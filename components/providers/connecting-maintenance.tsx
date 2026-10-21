'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/store/auth.store'
import { evolutionsApi } from '@/lib/evolutions-api'
import {
  actionStateLabel,
  draftFromPolicy,
  formatWhen,
  maintenancePayload,
  needsHubConfirmation,
  parseAge,
  reasonLabel,
  situationLabel,
  workerLabel,
  type MaintenanceActionRow,
  type MaintenanceDraft,
  type MaintenanceObservation,
  type MaintenanceView,
} from '@/lib/maintenance'
import { Acknowledgement, Choice, Failure, Panel } from './shared'

function productName(view: MaintenanceView | undefined, productId: string) {
  return view?.affectedProducts.find((product) => product.id === productId)?.name ?? productId
}

function PageList<T extends { id: string }>({
  title,
  empty,
  page,
  error,
  loading,
  onRetry,
  onNext,
  onPrevious,
  canPrevious,
  render,
}: {
  title: string
  empty: string
  page?: { items: T[]; nextCursor: string | null }
  error: unknown
  loading: boolean
  onRetry: () => void
  onNext: () => void
  onPrevious: () => void
  canPrevious: boolean
  render: (item: T) => ReactNode
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {loading && <Skeleton className="h-16 w-full" />}
      <Failure error={error} onReload={onRetry} />
      {!loading && !error && page?.items.length === 0 && (
        <p className="text-sm text-muted-foreground">{empty}</p>
      )}
      <ul className="space-y-3">{page?.items.map((item) => <li key={item.id}>{render(item)}</li>)}</ul>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={!canPrevious} onClick={onPrevious}>
          Página anterior
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={!page?.nextCursor} onClick={onNext}>
          Próxima página
        </Button>
      </div>
    </div>
  )
}

export function ConnectingMaintenance({ providerId }: { providerId: string }) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  const policy = useQuery({
    queryKey: ['maintenance', providerId],
    queryFn: () => evolutionsApi.maintenance(token!, providerId),
    enabled: !!token,
    retry: 1,
  })
  const [draft, setDraft] = useState<MaintenanceDraft | null>(null)
  const [dirty, setDirty] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [sharedScope, setSharedScope] = useState(false)
  const [permanent, setPermanent] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [tab, setTab] = useState<'observations' | 'actions'>('observations')
  const [observationCursor, setObservationCursor] = useState<string | null>(null)
  const [observationHistory, setObservationHistory] = useState<Array<string | null>>([])
  const [actionCursor, setActionCursor] = useState<string | null>(null)
  const [actionHistory, setActionHistory] = useState<Array<string | null>>([])

  useEffect(() => {
    if (!policy.data || dirty) return
    setDraft(draftFromPolicy(policy.data))
  }, [policy.data, dirty])

  const observations = useQuery({
    queryKey: ['maintenance-observations', providerId, observationCursor],
    queryFn: () => evolutionsApi.maintenanceObservations(token!, providerId, observationCursor),
    enabled: historyOpen && !!token && tab === 'observations' && !policy.isError,
    retry: 1,
  })
  const actions = useQuery({
    queryKey: ['maintenance-actions', providerId, actionCursor],
    queryFn: () => evolutionsApi.maintenanceActions(token!, providerId, actionCursor),
    enabled: historyOpen && !!token && tab === 'actions' && !policy.isError,
    retry: 1,
  })
  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      evolutionsApi.saveMaintenance(token!, providerId, body),
    retry: false,
    onSuccess: async (result) => {
      setDirty(false)
      setDraft(draftFromPolicy(result))
      setConfirming(false)
      qc.setQueryData(['maintenance', providerId], result)
      if (historyOpen) {
        await qc.invalidateQueries({ queryKey: ['maintenance-observations', providerId] })
        await qc.invalidateQueries({ queryKey: ['maintenance-actions', providerId] })
      }
      toast.success(
        result.policy.enabled
          ? 'Configuração salva. A contagem será iniciada novamente.'
          : 'Novas ações interrompidas; chamadas já enviadas podem concluir. A contagem será iniciada novamente.'
      )
    },
    onError: async (error: Error & { status?: number }) => {
      if (error.status === 409 || !error.status || error.status >= 500) {
        await qc.invalidateQueries({ queryKey: ['maintenance', providerId] })
      }
    },
  })

  const unsupported = (policy.error as { status?: number } | null)?.status === 404
  const view = policy.data
  const form = draft
  const ageError = (() => {
    if (!form) return null
    try {
      parseAge(form.ageText)
      return null
    } catch (error) {
      return error instanceof Error ? error.message : 'Prazo inválido'
    }
  })()
  const nextAge = form && !ageError ? parseAge(form.ageText) : null
  const requiresShared =
    !!view &&
    !!form &&
    !ageError &&
    needsHubConfirmation(view, {
      enabled: form.enabled,
      mode: form.mode,
      action: form.action,
      connectingMaxAgeMinutes: nextAge,
    })
  const requiresPermanent = !!form && form.enabled && form.mode === 'execute' && form.action === 'delete'

  function refresh() {
    void policy.refetch()
    if (!historyOpen) return
    if (tab === 'observations') void observations.refetch()
    else void actions.refetch()
  }

  function submit() {
    if (!view || !form || ageError) return
    save.mutate(maintenancePayload(view, form))
  }

  return (
    <Panel title="Instâncias em conexão prolongada">
      <p className="text-sm text-muted-foreground">
        Verifica apenas instâncias do Hub em connecting nesta Evolution. Vale para todos os produtos
        vinculados. O tempo é contado desde a observação, não desde a criação.
      </p>
      {policy.isLoading && <Skeleton className="h-28 w-full" />}
      {unsupported ? (
        <p role="alert" className="text-sm">
          Esta API ainda não oferece manutenção de connecting. Atualize o Hub para usar este painel.
          O restante do cadastro permanece disponível.
        </p>
      ) : (
        <Failure
          error={policy.error}
          onReload={() => {
            void policy.refetch()
          }}
        />
      )}
      {view && form && (
        <div className="space-y-4">
          <p className="text-sm">
            Situação: <strong>{situationLabel(view)}</strong>. {workerLabel(view.worker.status)}.
          </p>
          {view.blockers.some((item) => item.code === 'global_dry_run') && (
            <p className="text-sm" role="status">
              Simulação global ativa: nenhuma instância será alterada.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Salvo não significa que o worker está em execução. Última consulta válida:{' '}
            {formatWhen(view.monitoring.lastSuccessAt)}. Próxima estimativa:{' '}
            {formatWhen(view.monitoring.nextCheckAt)}. Elegíveis: {view.counts.eligible}. Pendências:{' '}
            {view.counts.pendingConfirmation}.
          </p>
          {view.monitoring.lastErrorMessage && (
            <p className="text-sm">{view.monitoring.lastErrorMessage}</p>
          )}
          {view.blockers.length > 0 && (
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {view.blockers.map((item) => (
                <li key={item.code}>{item.message}</li>
              ))}
            </ul>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              role="switch"
              aria-label="Verificar instâncias em conexão prolongada"
              checked={form.enabled}
              onChange={(event) => {
                setDirty(true)
                setDraft({ ...form, enabled: event.target.checked })
              }}
            />
            Verificar instâncias em conexão prolongada
          </label>
          <div className="space-y-1.5">
            <Label htmlFor="connecting-age">Tempo máximo em conexão (minutos)</Label>
            <Input
              id="connecting-age"
              inputMode="numeric"
              value={form.ageText}
              placeholder="Vazio usa o padrão"
              onChange={(event) => {
                setDirty(true)
                setDraft({ ...form, ageText: event.target.value })
              }}
            />
            <p className="text-xs text-muted-foreground">
              Prazo efetivo: {view.effective.connectingMaxAgeMinutes} minutos. Vazio herda o padrão e
              não significa zero.
            </p>
            {ageError && form.ageText.trim() !== '' && (
              <p className="text-sm text-destructive">{ageError}</p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Choice
              label="Ação"
              value={form.action}
              onChange={(event) => {
                setDirty(true)
                setDraft({ ...form, action: event.target.value as MaintenanceDraft['action'] })
              }}
            >
              <option value="disconnect">Desconectar e manter cadastro</option>
              <option value="delete">Excluir a instância</option>
            </Choice>
            <Choice
              label="Modo"
              value={form.mode}
              onChange={(event) => {
                setDirty(true)
                setDraft({ ...form, mode: event.target.value as MaintenanceDraft['mode'] })
              }}
            >
              <option value="observe">Somente observar</option>
              <option value="execute">Executar ação</option>
            </Choice>
          </div>
          <p className="text-sm text-muted-foreground">
            Desconectar mantém o cadastro e a ocupação. Excluir remove a instância permanentemente
            depois da confirmação. Somente observar mostra o que seria elegível, sem logout ou
            exclusão.
          </p>
          <div>
            <p className="text-sm font-medium">Produtos afetados</p>
            {view.affectedProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum produto vinculado.</p>
            ) : (
              <ul className="list-inside list-disc text-sm">
                {view.affectedProducts.map((product) => (
                  <li key={product.id}>{product.name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!dirty || !!ageError || save.isPending} onClick={() => {
              setSharedScope(false)
              setPermanent(false)
              save.reset()
              setConfirming(true)
            }}>
              Salvar configuração
            </Button>
            <Button type="button" variant="outline" onClick={refresh}>
              Atualizar situação
            </Button>
          </div>
          <Button type="button" variant="outline" onClick={() => setHistoryOpen(true)}>
            Ver acompanhamento
          </Button>
          <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Acompanhamento</DialogTitle>
                <DialogDescription>
                  Consulta feita agora, somente porque você abriu esta janela. Fechar interrompe novas
                  leituras desta lista.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2" role="tablist">
                <Button
                  type="button"
                  variant={tab === 'observations' ? 'default' : 'outline'}
                  onClick={() => setTab('observations')}
                >
                  Acompanhamento
                </Button>
                <Button
                  type="button"
                  variant={tab === 'actions' ? 'default' : 'outline'}
                  onClick={() => setTab('actions')}
                >
                  Últimas ações
                </Button>
              </div>
              {tab === 'observations' ? (
                <PageList<MaintenanceObservation>
                  title="Acompanhamento"
                  empty="Nenhuma observação registrada."
                  page={observations.data}
                  error={observations.error}
                  loading={observations.isLoading}
                  onRetry={() => void observations.refetch()}
                  canPrevious={observationHistory.length > 0}
                  onPrevious={() => {
                    const previous = observationHistory.at(-1) ?? null
                    setObservationHistory((items) => items.slice(0, -1))
                    setObservationCursor(previous)
                  }}
                  onNext={() => {
                    if (!observations.data?.nextCursor) return
                    setObservationHistory((items) => [...items, observationCursor])
                    setObservationCursor(observations.data.nextCursor)
                  }}
                  render={(item) => (
                    <div className="break-words text-sm">
                      <p className="font-medium">{item.instanceName}</p>
                      <p>
                        {productName(view, item.productId)} · {item.remoteStatus} ·{' '}
                        {item.eligible ? 'Elegível' : 'Ainda não elegível'}
                      </p>
                      <p>
                        {item.observedConnectingMs == null
                          ? 'Sem evidência válida de tempo em connecting.'
                          : `Observada em connecting desde ${formatWhen(item.connectingObservedSince)}.`}
                      </p>
                      {reasonLabel(item.reason) && <p>{reasonLabel(item.reason)}</p>}
                    </div>
                  )}
                />
              ) : (
                <PageList<MaintenanceActionRow>
                  title="Últimas ações"
                  empty="Nenhuma ação registrada."
                  page={actions.data}
                  error={actions.error}
                  loading={actions.isLoading}
                  onRetry={() => void actions.refetch()}
                  canPrevious={actionHistory.length > 0}
                  onPrevious={() => {
                    const previous = actionHistory.at(-1) ?? null
                    setActionHistory((items) => items.slice(0, -1))
                    setActionCursor(previous)
                  }}
                  onNext={() => {
                    if (!actions.data?.nextCursor) return
                    setActionHistory((items) => [...items, actionCursor])
                    setActionCursor(actions.data.nextCursor)
                  }}
                  render={(item) => (
                    <div className="break-words text-sm">
                      <p className="font-medium">{item.instanceName}</p>
                      <p>
                        {productName(view, item.productId)} · {actionStateLabel(item.action, item.state)}
                      </p>
                      <p>{formatWhen(item.updatedAt)}</p>
                      {reasonLabel(item.reason) && <p>{reasonLabel(item.reason)}</p>}
                    </div>
                  )}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
      <Dialog open={confirming} onOpenChange={(open) => !save.isPending && setConfirming(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar configuração</DialogTitle>
            <DialogDescription>
              {form?.enabled
                ? form.mode === 'observe'
                  ? 'Serão feitas consultas nesta Evolution. Nenhuma instância será desconectada ou excluída enquanto o modo for somente observar.'
                  : 'O modo de execução pode desconectar ou excluir instâncias depois do prazo observado. A alteração não dispara a ação agora.'
                : 'As consultas e os novos disparos deste provider serão interrompidos. Chamadas já enviadas podem concluir.'}{' '}
              A contagem será iniciada novamente.
            </DialogDescription>
          </DialogHeader>
          {view && form && (
            <div className="space-y-2 text-sm">
              <p>Provider: {view.providerId}</p>
              <p>
                Produtos:{' '}
                {view.affectedProducts.length
                  ? view.affectedProducts.map((product) => product.name).join(', ')
                  : 'nenhum vinculado'}
              </p>
              <p>Modo: {form.mode === 'observe' ? 'Somente observar' : 'Executar ação'}</p>
              <p>
                Ação:{' '}
                {form.action === 'delete' ? 'Excluir a instância' : 'Desconectar e manter cadastro'}
              </p>
              <p>
                Prazo:{' '}
                {form.ageText.trim()
                  ? `${form.ageText.trim()} minutos`
                  : `${view.effective.connectingMaxAgeMinutes} minutos (padrão)`}
              </p>
              {requiresShared && (
                <Acknowledgement checked={sharedScope} onChange={setSharedScope}>
                  Confirmo que a política vale para todos os produtos vinculados a este provider.
                </Acknowledgement>
              )}
              {requiresPermanent && (
                <Acknowledgement checked={permanent} onChange={setPermanent}>
                  Confirmo que a exclusão é permanente e não pode ser desfeita por este painel.
                </Acknowledgement>
              )}
            </div>
          )}
          <Failure error={save.error} onReload={refresh} />
          {save.isError &&
            (!((save.error as { status?: number } | null)?.status) ||
              ((save.error as { status?: number }).status ?? 0) >= 500) && (
              <p role="alert" className="text-sm">
                Não foi possível confirmar o salvamento. A situação foi relida; revise antes de
                tentar de novo.
              </p>
            )}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={save.isPending} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={save.isPending || (requiresShared && !sharedScope) || (requiresPermanent && !permanent)}
              onClick={submit}
            >
              {save.isPending ? 'Salvando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
