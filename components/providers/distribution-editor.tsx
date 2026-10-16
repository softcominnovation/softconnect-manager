'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useAllocation,
  useEvolutionList,
  useEvolutionMutation,
  useEvolutionSetup,
  useProductEvolutions,
} from '@/hooks/use-evolutions'
import { useEvolutionJourney } from '@/hooks/use-evolution-journey'
import { useAuthStore } from '@/store/auth.store'
import { evolutionsApi } from '@/lib/evolutions-api'
import {
  parseOptionalLimit,
  type EvolutionAllocation,
  type EvolutionLinkResponse,
} from '@/lib/evolutions'
import {
  actionLabels,
  affectedProductIds,
  apiUnavailable,
  distributionRows,
  distributionSelection,
  draftFromRows,
  pendingIdentities,
  type ChangeAction,
  type DistributionRow,
  type EvolutionChange,
  type EvolutionDraft,
} from '@/lib/evolution-changes'
import { Panel, Choice, Failure, Acknowledgement } from './shared'
import { EvolutionChangeProgress } from './evolution-change-progress'

function DistributionEditor({
  productId,
  initialEntries,
  initialAllocation,
  supported,
}: {
  productId: string
  initialEntries: EvolutionLinkResponse[]
  initialAllocation: EvolutionAllocation
  supported: boolean
}) {
  const links = useProductEvolutions(productId)
  const allocation = useAllocation(productId)
  const catalog = useEvolutionList()
  const journey = useEvolutionJourney(productId, supported)
  const [base, setBase] = useState(initialAllocation)
  const [rows, setRows] = useState(() => distributionRows(initialEntries))
  const confirmedRows = useRef<{ requestId: string; rows: DistributionRow[] } | null>(null)
  const [reordered, setReordered] = useState(false)
  const [selected, setSelected] = useState('')
  const [review, setReview] = useState<{
    action: ChangeAction
    target?: DistributionRow
    requestId: string
    expectedRevision: number
    sentDraft?: EvolutionDraft
  } | null>(null)
  const [identities, setIdentities] = useState(false)
  const [globalImpact, setGlobalImpact] = useState(false)
  const [orderAccepted, setOrderAccepted] = useState(false)
  const [formError, setFormError] = useState<Error | null>(null)
  const [updating, setUpdating] = useState(false)
  const [pauseTarget, setPauseTarget] = useState<DistributionRow | null>(null)
  const [reviewSource, setReviewSource] = useState<EvolutionChange | null>(null)
  const pause = useEvolutionMutation((token, row: DistributionRow) =>
    evolutionsApi.updateLink(token, productId, row.provider.id, {
      expectedRevision: row.link!.configurationRevision,
      acceptingNewInstances: !row.link!.acceptingNewInstances,
    })
  )
  const busy = journey.busy || journey.applyUncertain || pause.isPending || updating
  const hasDraftChanges =
    distributionSelection(rows, reordered || orderAccepted) !==
    distributionSelection(distributionRows(links.data ?? initialEntries))
  const currentLink = (row: DistributionRow) =>
    links.data?.find((item) => item.link.vpsProviderId === row.provider.id)?.link
  useEffect(() => {
    const operation = journey.operation.data
    if (
      operation?.status !== 'applied' ||
      operation.action !== 'configure_capacity' ||
      !links.data ||
      !allocation.data ||
      allocation.isFetching ||
      links.isFetching ||
      journey.busy
    )
      return
    if (
      confirmedRows.current?.requestId !== operation.draft.requestId ||
      confirmedRows.current.rows !== rows
    )
      return
    confirmedRows.current = null
    setRows(distributionRows(links.data))
    setBase(allocation.data)
    setReordered(false)
  }, [
    journey.operation.data,
    journey.busy,
    links.data,
    links.isFetching,
    allocation.data,
    allocation.isFetching,
    rows,
  ])
  const labels = Object.fromEntries(
    [...(catalog.data ?? []), ...rows.map((r) => r.provider)].map((p) => [p.id, p.label])
  )
  const tied = new Set(rows.map((r) => r.priority)).size !== rows.length && !reordered
  const changedLimits = rows.filter(
    (r) => r.limitEdited && r.limit.trim() !== (r.provider.maxInstances?.toString() ?? '')
  )
  let needsIdentity: DistributionRow[] = []
  let invalid: Error | null = null
  try {
    rows.forEach((r) => parseOptionalLimit(r.limit))
    needsIdentity = pendingIdentities(rows)
  } catch (error) {
    invalid = error as Error
  }
  const changeRow = (id: string, update: Partial<DistributionRow>) => {
    journey.clearConsent()
    setRows((current) => current.map((r) => (r.provider.id === id ? { ...r, ...update } : r)))
  }
  function openReview(action: ChangeAction, target?: DistributionRow, revision?: number) {
    journey.clearConsent()
    journey.prepare.reset()
    journey.apply.reset()
    journey.cancel.reset()
    journey.callback.reset()
    setFormError(null)
    setIdentities(false)
    setGlobalImpact(false)
    setOrderAccepted(false)
    setReview({
      action,
      target,
      requestId: crypto.randomUUID(),
      expectedRevision:
        revision ??
        (action === 'configure_capacity'
          ? base.configurationRevision
          : (allocation.data?.configurationRevision ?? base.configurationRevision)),
    })
  }
  async function reload(past?: EvolutionChange) {
    journey.clearConsent()
    setUpdating(true)
    setFormError(null)
    try {
      const [entries, policy, providers] = await Promise.all([
        links.refetch(),
        allocation.refetch(),
        catalog.refetch(),
      ])
      if (!entries.data || !policy.data || entries.error || policy.error || providers.error)
        throw new Error('Não foi possível atualizar. Seu rascunho foi mantido.')
      const fresh = distributionRows(entries.data)
      const all = [...(providers.data ?? []), ...entries.data.map((e) => e.evolution)]
      const oldRows =
        past?.draft.action === 'configure_capacity'
          ? (past.draft.links ?? []).map((l) => {
              const provider = all.find((p) => p.id === l.vpsProviderId)
              if (!provider)
                throw new Error(
                  'Uma Evolution não está mais disponível. Revise os cadastros antes de continuar.'
                )
              const limit = past.draft.providerUpdates?.find(
                (p) => p.vpsProviderId === l.vpsProviderId
              )
              return {
                provider,
                priority: l.allocationPriority ?? 0,
                admission: l.acceptingNewInstances ?? false,
                limit: limit
                  ? (limit.maxInstances?.toString() ?? '')
                  : (provider.maxInstances?.toString() ?? ''),
                limitEdited: !!limit,
              } as DistributionRow
            })
          : rows
      const rebased: DistributionRow[] = oldRows.map((old) => {
        const current = fresh.find((r) => r.provider.id === old.provider.id)
        const provider = all.find((p) => p.id === old.provider.id)
        if (!provider || (old.link && !current))
          throw new Error(
            'Um vínculo foi removido por outra operação. Suas escolhas foram mantidas; descarte o rascunho para carregar a lista atual.'
          )
        return {
          ...old,
          provider,
          link: current?.link,
          limit: old.limitEdited ? old.limit : (provider.maxInstances?.toString() ?? ''),
        }
      })
      for (const item of fresh)
        if (!rebased.some((r) => r.provider.id === item.provider.id)) rebased.push(item)
      setRows(rebased)
      setBase(policy.data)
      setReview(null)
      if (past?.action === 'configure_capacity') setReordered(false)
      if (past && past.action !== 'configure_capacity') {
        const target = rebased.find((r) => r.provider.id === past.draft.targetProviderId)
        if (!target) throw new Error('O destino desta operação não está mais vinculado.')
        openReview(past.action, target, policy.data.configurationRevision)
      }
      toast.info(
        'Leitura atualizada. Confira as escolhas e o impacto antes de confirmar novamente.'
      )
      return true
    } catch (error) {
      setFormError(error as Error)
      return false
    } finally {
      setUpdating(false)
    }
  }
  return (
    <section
      id="distribution"
      aria-label="Distribuição de novas instâncias"
      className="space-y-6 [&_button]:h-auto [&_button]:min-h-10 [&_button]:whitespace-normal"
    >
      <Panel title="Distribuição de novas instâncias">
        <p>
          Modo aplicado:{' '}
          <strong>
            {allocation.data?.mode === 'capacity'
              ? 'Distribuir por capacidade'
              : 'Usar Evolution padrão'}
          </strong>
        </p>
        <p className="text-sm">
          Destinos da configuração aplicada:{' '}
          {allocation.data?.mode === 'capacity'
            ? allocation.data.order
                .filter((link) => link.acceptingNewInstances)
                .map((link) => labels[link.vpsProviderId] ?? link.vpsProviderId)
                .join(', ') || 'todos pausados'
            : (labels[allocation.data?.defaultProviderId ?? ''] ?? 'padrão do produto')}
          . A admissão permanece sujeita aos controles do Hub.
        </p>
        <p className="text-sm text-muted-foreground">
          Edite o rascunho e confirme a verificação. Só novas instâncias seguem esta ordem; as
          existentes permanecem no host onde foram criadas. Limites são opcionais e compartilhados
          por todos os produtos da mesma Evolution.
        </p>
        {!supported && (
          <p role="alert" className="text-sm">
            A preparação guiada está indisponível. Confira a versão ou conexão da API. Os cadastros
            e fluxos atuais continuam acessíveis.
          </p>
        )}
        {allocation.data &&
          allocation.data.configurationRevision !== base.configurationRevision && (
            <p role="alert" className="text-sm">
              A configuração aplicada mudou. Seu rascunho foi mantido; atualize a leitura e revise
              antes de enviar.
            </p>
          )}
        <h3 className="font-medium">Rascunho — ordem de preferência</h3>
        {hasDraftChanges && (
          <p role="status" className="rounded-md border border-primary/40 p-3 text-sm">
            Este rascunho tem alterações ainda não aplicadas. A configuração em uso continua sendo
            a indicada acima até a confirmação da aplicação.
          </p>
        )}
        {rows.length === 0 && <p className="text-sm">Adicione uma Evolution para começar.</p>}
        {rows.map((row, index) => (
          <div key={row.provider.id} className="space-y-3 rounded-md border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {index + 1}ª · {row.provider.label}
                  {base.defaultProviderId === row.provider.id ? ' · padrão atual' : ''}
                  {!row.link ? ' · novo vínculo no rascunho' : ''}
                </p>
                <p className="break-all text-sm text-muted-foreground">
                  {row.provider.providerUrl}
                </p>
              </div>
              <div className="flex gap-1">
                {[-1, 1].map((direction) => (
                  <Button
                    key={direction}
                    size="icon"
                    variant="outline"
                    disabled={busy || (direction < 0 ? index === 0 : index === rows.length - 1)}
                    aria-label={`${direction < 0 ? 'Subir' : 'Descer'} ${row.provider.label}`}
                    onClick={() => {
                      journey.clearConsent()
                      setRows((current) => {
                        const next = [...current]
                        ;[next[index], next[index + direction]] = [
                          next[index + direction],
                          next[index],
                        ]
                        return next
                      })
                      setReordered(true)
                    }}
                  >
                    {direction < 0 ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-sm">
              {row.provider.inventory.fresh
                ? `${row.provider.occupancy.effective} ocupações conhecidas (instâncias e reservas)`
                : 'Ocupação sem confirmação recente'}{' '}
              ·{' '}
              {row.provider.inventory.asOf
                ? new Date(row.provider.inventory.asOf).toLocaleString('pt-BR')
                : 'sem data de confirmação'}
            </p>
            {!row.provider.acceptingNewInstances && (
              <p className="text-sm">Novas criações estão pausadas globalmente nesta Evolution.</p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor={`draft-limit-${row.provider.id}`}>
                Limite de instâncias — global desta Evolution
              </Label>
              <Input
                id={`draft-limit-${row.provider.id}`}
                disabled={busy}
                inputMode="numeric"
                value={row.limit}
                placeholder="Sem limite"
                onChange={(e) =>
                  changeRow(row.provider.id, { limit: e.target.value, limitEdited: true })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {affectedProductIds(row.provider, productId).length} produto(s) compartilham este
              limite. Vazio significa sem limite; a quantidade não faz transbordar para a próxima
              Evolution nesse caso.
            </p>
            <Acknowledgement
              checked={row.admission}
              onChange={(value) => {
                if (!busy) changeRow(row.provider.id, { admission: value })
              }}
            >
              Receber novas instâncias deste produto após aplicar
            </Acknowledgement>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/providers/${encodeURIComponent(row.provider.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Revisar cadastro em outra aba
                </Link>
              </Button>
              {!currentLink(row) ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    journey.clearConsent()
                    setRows((current) => current.filter((r) => r.provider.id !== row.provider.id))
                  }}
                >
                  Remover do rascunho
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => {
                      journey.clearConsent()
                      pause.reset()
                      setPauseTarget({ ...row, link: currentLink(row) })
                    }}
                  >
                    {currentLink(row)?.acceptingNewInstances
                      ? 'Pausar novas criações agora'
                      : 'Retomar novas criações'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || !supported}
                    onClick={() => openReview('single_destination', row)}
                  >
                    Usar apenas esta para novas instâncias
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || !supported}
                    onClick={() => openReview('restore_legacy', row)}
                  >
                    Voltar ao modo padrão com esta
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || !supported}
                    onClick={() => openReview('detach', row)}
                  >
                    Desvincular deste produto
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
        {tied && (
          <p className="text-sm">
            Há preferências empatadas. A ordem efetiva está preservada; confirme a ordem exibida no
            resumo para eliminar o empate.
          </p>
        )}
        <div className="space-y-3 rounded-md border p-4">
          <Choice
            label="Adicionar Evolution existente ao rascunho"
            value={selected}
            disabled={busy}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Selecione</option>
            {catalog.data
              ?.filter(
                (p) => !rows.some((r) => r.provider.id === p.id) && p.adapterType === 'evolution'
              )
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} · {p.links.length} produto(s)
                </option>
              ))}
          </Choice>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={!selected || busy}
              onClick={() => {
                const provider = catalog.data?.find((p) => p.id === selected)
                if (!provider) return
                journey.clearConsent()
                setRows((current) => [
                  ...current,
                  {
                    provider,
                    priority: Math.max(0, ...current.map((r) => r.priority)) + 1,
                    admission: false,
                    limit: provider.maxInstances?.toString() ?? '',
                    limitEdited: false,
                  },
                ])
                setSelected('')
                setReordered(true)
              }}
            >
              Adicionar ao rascunho
            </Button>
            <Link
              href="/providers/new"
              target="_blank"
              rel="noopener noreferrer"
              className="self-center text-sm text-primary underline"
            >
              Cadastrar Evolution em outra aba
            </Link>
            <Button
              variant="outline"
              disabled={catalog.isFetching}
              onClick={() => void catalog.refetch()}
            >
              Atualizar catálogo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            O novo vínculo começa pausado no rascunho. Marque a participação para autorizar novas
            criações ao aplicar.
          </p>
        </div>
        <Failure error={formError || invalid || catalog.error || links.error || allocation.error} />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || !!invalid || !supported || !rows.some((r) => r.admission)}
            onClick={() => openReview('configure_capacity')}
          >
            Verificar e ativar distribuição
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => void reload()}>
            Atualizar leitura mantendo escolhas
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (!links.data || !allocation.data) return
              journey.clearConsent()
              setRows(distributionRows(links.data))
              setBase(allocation.data)
              setReordered(false)
              setFormError(null)
            }}
          >
            Descartar rascunho e ler configuração atual
          </Button>
        </div>
      </Panel>
      {supported && (
        <EvolutionChangeProgress
          productId={productId}
          journey={journey}
          labels={labels}
          hasDraftChanges={hasDraftChanges}
          onReview={(row) => {
            if (hasDraftChanges) {
              setFormError(null)
              setReviewSource(row)
            } else void reload(row)
          }}
        />
      )}
      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open && !busy) setReview(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {review ? actionLabels[review.action] : 'Revisar configuração'}
            </DialogTitle>
            <DialogDescription>
              Confira o alcance antes de continuar. A preparação não altera a política; esta
              confirmação autoriza aplicar este rascunho se a verificação terminar nesta aba, sem
              conflitos. Se você sair da aba ou editar as escolhas durante a verificação, será
              necessário concluir a ativação ao voltar.
            </DialogDescription>
          </DialogHeader>
          {review?.action === 'configure_capacity' ? (
            <div className="space-y-4 text-sm">
              <ol className="list-inside list-decimal space-y-2">
                {rows.map((r) => (
                  <li key={r.provider.id}>
                    {r.provider.label}:{' '}
                    {r.admission ? 'recebe novas instâncias' : 'novas criações pausadas'} · limite
                    global {r.limit || 'sem limite'}
                  </li>
                ))}
              </ol>
              {tied && (
                <Acknowledgement checked={orderAccepted} onChange={setOrderAccepted}>
                  Confirmo a ordem exibida para substituir os empates de preferência.
                </Acknowledgement>
              )}
              {!!needsIdentity.length && (
                <>
                  <p>
                    Instalações a confirmar: {needsIdentity.map((r) => r.provider.label).join(', ')}
                    .
                  </p>
                  <Acknowledgement checked={identities} onChange={setIdentities}>
                    Confirmo que esses cadastros representam as instalações pretendidas. Cadastros
                    duplicados devem ser revisados; compartilhar VPS não significa compartilhar a
                    mesma Evolution.
                  </Acknowledgement>
                </>
              )}
              {!!changedLimits.length && (
                <>
                  <ul className="space-y-2">
                    {changedLimits.map((r) => (
                      <li key={r.provider.id}>
                        <strong>{r.provider.label}</strong>:{' '}
                        {r.provider.maxInstances ?? 'sem limite'} → {r.limit || 'sem limite'}
                        <br />
                        Produtos afetados:{' '}
                        {affectedProductIds(r.provider, productId)
                          .map(
                            (id) =>
                              r.provider.links.find((l) => l.productId === id)?.product.name ??
                              (id === productId ? 'este produto' : id)
                          )
                          .join(', ')}
                      </li>
                    ))}
                  </ul>
                  <Acknowledgement checked={globalImpact} onChange={setGlobalImpact}>
                    Confirmo essas alterações globais de limite para todos os produtos indicados.
                  </Acknowledgement>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                Destino: <strong>{review?.target?.provider.label}</strong>
              </p>
              {review?.action === 'single_destination' && (
                <>
                  <p>
                    Somente este destino receberá novas instâncias, sujeito ao limite e à
                    disponibilidade. Os demais vínculos serão pausados; nenhuma sessão será movida.
                  </p>
                  <ul>
                    {rows
                      .filter((r) => r.link && r.provider.id !== review.target?.provider.id)
                      .map((r) => (
                        <li key={r.provider.id}>
                          {r.provider.label}:{' '}
                          {r.provider.inventory.fresh
                            ? `${r.provider.occupancy.byProduct[productId] ?? 0} ocupações conhecidas (inclui reservas)`
                            : 'ocupação ainda não confirmada'}
                          . Instâncias existentes continuam atendidas aqui.
                        </li>
                      ))}
                  </ul>
                </>
              )}
              {review?.action === 'restore_legacy' && (
                <p>
                  A API verifica se todas as instâncias deste produto estão neste destino, inclusive
                  as desconectadas, e se existem pendências. Limites globais permanecem. Com sessões
                  em outro host, use destino único para novas criações.
                </p>
              )}
              {review?.action === 'detach' && (
                <p>
                  Remove apenas um vínculo sem uso. A API recusará se for o padrão, houver
                  instâncias ou pendências. Nesse caso, pause novas criações. Não exclui sessões nem
                  desativa a instalação.
                </p>
              )}
              <p>Edições não salvas de limites e ordem não fazem parte desta ação.</p>
            </div>
          )}
          <Failure error={formError || journey.prepare.error} />
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setReview(null)}>
              Voltar ao rascunho
            </Button>
            <Button
              disabled={
                busy ||
                !review ||
                (review.action === 'configure_capacity' &&
                  ((tied && !orderAccepted) ||
                    (needsIdentity.length > 0 && !identities) ||
                    (changedLimits.length > 0 && !globalImpact)))
              }
              onClick={async () => {
                if (!review) return
                setFormError(null)
                try {
                  const draft: EvolutionDraft =
                    review.sentDraft ??
                    (review.action === 'configure_capacity'
                      ? draftFromRows(productId, base, rows, {
                          requestId: review.requestId,
                          reorder: reordered || orderAccepted,
                          identities,
                          sharedLimits: globalImpact,
                        })
                      : {
                          requestId: review.requestId,
                          expectedRevision: review.expectedRevision,
                          action: review.action,
                          targetProviderId: review.target!.provider.id,
                        })
                  setReview({ ...review, sentDraft: draft })
                  if (review.action === 'configure_capacity')
                    confirmedRows.current = { requestId: draft.requestId, rows }
                  await journey.prepare.mutateAsync(draft)
                  setReview(null)
                } catch (error) {
                  setFormError(error as Error)
                }
              }}
            >
              {busy ? 'Enviando…' : 'Confirmar e verificar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!reviewSource}
        onOpenChange={(open) => {
          if (!open && !busy) setReviewSource(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Qual rascunho deseja revisar?</DialogTitle>
            <DialogDescription>
              Você tem alterações ainda não aplicadas. Pode mantê-las ou substituí-las pelas
              escolhas da operação selecionada. Revisar não salva nem ativa a distribuição.
            </DialogDescription>
          </DialogHeader>
          <Failure error={formError} />
          <DialogFooter>
            <Button
              disabled={busy}
              onClick={async () => {
                if (await reload()) setReviewSource(null)
              }}
            >
              Manter meu rascunho
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                if (reviewSource && (await reload(reviewSource))) setReviewSource(null)
              }}
            >
              Substituir pelas escolhas da operação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!pauseTarget}
        onOpenChange={(open) => {
          if (!open && !busy) setPauseTarget(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pauseTarget?.link?.acceptingNewInstances ? 'Pausar' : 'Retomar'} novas criações deste
              produto?
            </DialogTitle>
            <DialogDescription>
              Afeta somente o vínculo com {pauseTarget?.provider.label}. Instâncias existentes
              permanecem aqui; criações já enviadas podem terminar no host reservado. A retomada
              continua sujeita aos controles do Hub.
            </DialogDescription>
          </DialogHeader>
          <Failure error={pause.error} />
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setPauseTarget(null)}>
              Cancelar
            </Button>
            <Button
              disabled={busy}
              onClick={async () => {
                if (!pauseTarget) return
                try {
                  await pause.mutateAsync(pauseTarget)
                  setPauseTarget(null)
                  toast.success(
                    'Admissão atualizada. Atualize a leitura antes de aplicar seu rascunho.'
                  )
                } catch {
                  /* Error is shown above. */
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function ProductEvolutions({ productId }: { productId: string }) {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)
  const links = useProductEvolutions(productId)
  const allocation = useAllocation(productId)
  const setup = useEvolutionSetup()
  return (
    <div className="space-y-4">
      <Failure
        error={links.error || allocation.error}
        onReload={() => {
          void links.refetch()
          void allocation.refetch()
        }}
      />
      {apiUnavailable(setup.error) ? (
        <p role="alert" className="text-sm">
          A API ainda não oferece a preparação guiada. Atualize a API para utilizar este recurso; os
          cadastros atuais estão preservados.
        </p>
      ) : (
        <Failure error={setup.error} onReload={() => void setup.refetch()} />
      )}
      {(links.isLoading || allocation.isLoading) && (
        <Panel title="Distribuição de novas instâncias">
          <div role="status">
            <span className="sr-only">Carregando distribuição de novas instâncias…</span>
            <div className="space-y-4" aria-hidden="true">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-10 w-52 max-w-full" />
            </div>
          </div>
        </Panel>
      )}
      {links.data && allocation.data && (
        <DistributionEditor
          key={`${productId}:${userId}:${token}`}
          productId={productId}
          initialEntries={links.data}
          initialAllocation={allocation.data}
          supported={!!setup.data && !setup.error}
        />
      )}
    </div>
  )
}
