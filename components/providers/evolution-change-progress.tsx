'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useProductList } from '@/hooks/use-products'
import { useInstancePlacements } from '@/hooks/use-evolutions'
import type { useEvolutionJourney } from '@/hooks/use-evolution-journey'
import {
  actionLabels,
  canPrepareCallback,
  changeStatusLabels,
  isPendingChange,
  operationExpired,
  type EvolutionChange,
} from '@/lib/evolution-changes'
import { Panel, Choice, Failure } from './shared'

function TestValidation({ productId, providerId }: { productId: string; providerId: string }) {
  const products = useProductList()
  const [selected, setSelected] = useState('')
  const placements = useInstancePlacements(selected)
  return (
    <div className="space-y-3 rounded-md border p-3 text-sm">
      <p className="font-medium">Validar com uma instância de teste</p>
      <ol className="list-inside list-decimal space-y-2">
        <li>Escolha ou cadastre um produto dedicado a testes, diferente deste produto.</li>
        <li>
          No cadastro desse produto, escolha esta Evolution como padrão e habilite o relay. Mantenha
          o modo padrão.
        </li>
        <li>
          Crie e conecte uma instância de teste pelas telas existentes. Aguarde um evento autêntico
          da Evolution.
        </li>
        <li>
          Volte aqui e prepare novamente. Os recursos de teste contam na ocupação e no limite
          compartilhado.
        </li>
      </ol>
      <Link
        className="inline-block text-primary underline"
        href="/products"
        target="_blank"
        rel="noopener noreferrer"
      >
        Abrir cadastro de produtos em outra aba
      </Link>
      <Choice
        label="Acompanhar produto dedicado a testes"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        <option value="">Selecione após cadastrar</option>
        {products.data
          ?.filter((p) => p.id !== productId && p.vpsProviderId === providerId)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
      </Choice>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          void products.refetch()
          if (selected) void placements.refetch()
        }}
      >
        Atualizar recursos de teste
      </Button>
      <Failure error={products.error || (selected ? placements.error : null)} />
      {selected && (
        <div className="space-y-2">
          <p>
            Produto acompanhado:{' '}
            <Link
              href={`/products/${encodeURIComponent(selected)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              {products.data?.find((p) => p.id === selected)?.name ?? selected}
            </Link>
          </p>
          <Link
            href={`/instances/${encodeURIComponent(selected)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-primary underline"
          >
            Criar, conectar ou limpar explicitamente as instâncias de teste
          </Link>
          <ul className="break-all">
            {placements.data?.map((p) => (
              <li key={p.instanceId}>
                Instância: {p.instanceId} · {p.label}
              </li>
            ))}
          </ul>
          <p>
            Nenhum recurso será criado ou excluído automaticamente. Após validar, gerencie a limpeza
            nessas telas.
          </p>
        </div>
      )}
      <Link
        href={`/products/${encodeURIComponent(productId)}#distribution`}
        className="block text-primary underline"
      >
        Voltar à distribuição deste produto
      </Link>
    </div>
  )
}

export function EvolutionChangeProgress({
  productId,
  journey,
  labels,
  hasDraftChanges,
  onReview,
}: {
  productId: string
  journey: ReturnType<typeof useEvolutionJourney>
  labels: Record<string, string>
  hasDraftChanges: boolean
  onReview: (row: EvolutionChange) => void
}) {
  const row = journey.operation.data
  const products = useProductList()
  const [now, setNow] = useState(Date.now())
  const [confirm, setConfirm] = useState<'apply' | 'cancel' | 'callback' | null>(null)
  const [instanceId, setInstanceId] = useState('')
  const [callbackProvider, setCallbackProvider] = useState('')
  useEffect(() => {
    if (
      !row ||
      ['applied', 'cancelled', 'failed', 'expired'].includes(row.status) ||
      operationExpired(row)
    )
      return
    setNow(Date.now())
    const timer = setInterval(() => {
      setNow(Date.now())
      if (operationExpired(row)) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [row])
  useEffect(() => {
    setConfirm(null)
    setInstanceId('')
  }, [row?.operationId])
  const error =
    journey.operation.error ||
    journey.prepare.error ||
    journey.apply.error ||
    journey.cancel.error ||
    journey.callback.error
  return (
    <Panel title="Acompanhamento da configuração">
      <Failure
        error={error}
        onReload={() => {
          if (row) void journey.verify()
          void journey.history.refetch()
        }}
      />
      {journey.applyUncertain && (
        <p role="alert" className="text-sm">
          A resposta da aplicação não foi confirmada. Consulte a situação antes de enviar novamente;
          a configuração pode já ter sido aplicada.
        </p>
      )}
      {!row && (
        <p className="text-sm text-muted-foreground">
          Seu rascunho só será enviado quando você confirmar a preparação.
        </p>
      )}
      {row && (
        <>
          <p role="status" aria-live="polite" className="font-medium">
            {journey.apply.isPending
              ? 'Aplicando configuração; aguarde a confirmação'
              : journey.applyUncertain
                ? 'Aplicação ainda não confirmada'
                : operationExpired(row, now) && isPendingChange(row.status)
                  ? 'Prazo da verificação encerrado; consulte a situação ou prepare novamente'
                  : row.status === 'applied' && hasDraftChanges
                    ? 'Operação selecionada aplicada; há alterações pendentes no rascunho'
                    : changeStatusLabels[row.status]}
          </p>
          <p className="text-sm text-muted-foreground">
            {actionLabels[row.action]} · iniciada em{' '}
            {new Date(row.createdAt).toLocaleString('pt-BR')}
            {isPendingChange(row.status)
              ? ` · ${Math.max(0, Math.floor((now - Date.parse(row.createdAt)) / 1000))} s decorridos`
              : ''}
          </p>
          {row.status === 'applied' && (
            <p className="text-sm">
              A aplicação foi confirmada para a operação indicada acima.
              {hasDraftChanges &&
                ' Esse resultado não confirma as alterações que ainda estão no rascunho.'}{' '}
              As instâncias existentes permanecem nos seus hosts. Esta operação não desliga
              nenhuma Evolution ou VPS.
            </p>
          )}
          {isPendingChange(row.status) && !operationExpired(row, now) && (
            <p className="text-sm">
              A configuração ainda não foi aplicada. Aguarde nesta aba. Se sair dela ou editar o
              rascunho, a aplicação automática será interrompida; conclua a ativação quando a
              verificação terminar.
            </p>
          )}
          {row.status === 'ready' &&
            !journey.apply.isPending &&
            !journey.applyUncertain &&
            !operationExpired(row, now) && (
              <p role="status" className="rounded-md border border-primary/40 p-3 text-sm">
                Falta aplicar esta configuração. Se a aplicação automática não continuar, clique
                em{' '}
                <strong>
                  Concluir {row.action === 'configure_capacity' ? 'ativação' : 'configuração'}
                </strong>.{' '}
                Trocar de aba, reabrir a página ou editar o rascunho exige uma nova confirmação.
                Revisar escolhas apenas prepara uma nova revisão.
              </p>
            )}
          {row.callback && !['applied', 'cancelled', 'failed', 'expired'].includes(row.status) && (
            <p className="text-sm">
              {row.callback.state === 'uncertain'
                ? 'Não foi possível confirmar a configuração do webhook. O Hub verificará o estado antes de repetir.'
                : 'Aguardando evento da Evolution. Configurar o webhook não confirma o recebimento.'}
            </p>
          )}
          <ul className="space-y-2 text-sm">
            {row.checks
              .filter((c) => c.code !== 'verified')
              .map((c, i) => (
                <li
                  key={`${c.code}:${c.providerId}:${i}`}
                  className={c.blocking ? 'rounded-md border p-3' : 'text-muted-foreground'}
                >
                  {c.providerId && <strong>{labels[c.providerId] ?? 'Evolution'}: </strong>}
                  {c.message}
                </li>
              ))}
          </ul>
          {row.requiredActions.some((a) => a.destination === 'environment-setup') && (
            <Link
              href="/providers/setup"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-primary underline"
            >
              Preparar ambiente em outra aba e voltar à verificação
            </Link>
          )}
          {Array.from(
            new Set(
              row.requiredActions
                .filter((a) => a.providerId && a.destination === 'draft-review')
                .map((a) => a.providerId!)
            )
          ).map((id) => (
            <div key={id} className="flex flex-wrap gap-3 text-sm">
              <Link
                href={`/providers/${encodeURIComponent(id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Revisar cadastro de {labels[id] ?? 'Evolution'}
              </Link>
              <Link
                href={`/instances/${encodeURIComponent(productId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Revisar instâncias e importação deste produto
              </Link>
            </div>
          ))}
          {row.requiredActions
            .filter(
              (a) => row.status === 'action_required' && a.code === 'confirm_instance_webhook'
            )
            .map((a) => (
              <div key={a.providerId} className="space-y-2 rounded-md border p-3">
                <p className="text-sm">
                  Preparar recebimento de eventos de {labels[a.providerId!] ?? 'Evolution'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={journey.busy || !canPrepareCallback(row, now)}
                  onClick={() => {
                    setCallbackProvider(a.providerId!)
                    setInstanceId(a.instanceIds?.[0] ?? '')
                    setConfirm('callback')
                  }}
                >
                  Escolher instância própria
                </Button>
              </div>
            ))}
          {row.requiredActions
            .filter(
              (a) =>
                row.status === 'action_required' &&
                a.code === 'use_dedicated_test_product' &&
                a.providerId
            )
            .map((a) => (
              <TestValidation key={a.providerId} productId={productId} providerId={a.providerId!} />
            ))}
          <div className="flex flex-wrap gap-2">
            {row.status === 'ready' && (
              <Button
                disabled={
                  journey.busy ||
                  journey.applyUncertain ||
                  journey.operation.isFetching ||
                  !!journey.operation.error ||
                  operationExpired(row, now)
                }
                onClick={() => setConfirm('apply')}
              >
                Concluir {row.action === 'configure_capacity' ? 'ativação' : 'configuração'}
              </Button>
            )}
            {!['applied', 'cancelled', 'expired', 'failed'].includes(row.status) && (
              <Button
                variant="outline"
                disabled={journey.busy}
                onClick={() => {
                  journey.clearConsent()
                  setConfirm('cancel')
                }}
              >
                Cancelar preparação
              </Button>
            )}
            {(!isPendingChange(row.status) || operationExpired(row, now)) && (
              <Button
                variant="outline"
                disabled={journey.busy || journey.applyUncertain}
                onClick={() => {
                  journey.clearConsent()
                  onReview(row)
                }}
              >
                Revisar escolhas e preparar novamente
              </Button>
            )}
            <Button
              variant="outline"
              disabled={journey.operation.isFetching || journey.busy}
              onClick={() => void journey.verify()}
            >
              Atualizar situação
            </Button>
          </div>
        </>
      )}
      <Failure error={journey.history.error} />
      {!!journey.history.data?.items.length && (
        <Choice
          label="Retomar uma configuração recente"
          value={row?.operationId ?? ''}
          onChange={(e) => journey.resume(e.target.value)}
        >
          <option value="">Selecione</option>
          {journey.history.data.items.map((item) => (
            <option key={item.operationId} value={item.operationId}>
              {new Date(item.createdAt).toLocaleString('pt-BR')} · {actionLabels[item.action]} ·{' '}
              {changeStatusLabels[item.operationId === row?.operationId ? row.status : item.status]}
            </option>
          ))}
        </Choice>
      )}
      <Dialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !journey.busy) setConfirm(null)
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {confirm === 'apply'
                ? 'Concluir configuração revisada?'
                : confirm === 'cancel'
                  ? 'Cancelar preparação?'
                  : 'Preparar recebimento de eventos?'}
            </DialogTitle>
            <DialogDescription>
              {confirm === 'apply'
                ? 'Aplica somente as escolhas desta operação, listadas abaixo. Alterações posteriores no rascunho serão mantidas para outra preparação. A API revalidará as condições; as sessões existentes continuam nos hosts atuais.'
                : confirm === 'cancel'
                  ? 'Impede a aplicação da configuração. Consultas ou configurações de webhook já enviadas podem ter efeito; não serão desfeitas.'
                  : 'Esta ação configura o webhook somente da instância própria selecionada. Não envia mensagens nem reinicia sessões.'}
            </DialogDescription>
          </DialogHeader>
          {confirm === 'apply' && row && (
            <div className="space-y-2 text-sm">
              <p>
                {actionLabels[row.action]}
                {row.draft.targetProviderId
                  ? `: ${labels[row.draft.targetProviderId] ?? row.draft.targetProviderId}`
                  : ''}
              </p>
              {row.draft.links?.map((l, index) => (
                <p key={l.vpsProviderId}>
                  {index + 1}ª · {labels[l.vpsProviderId] ?? l.vpsProviderId} ·{' '}
                  {l.acceptingNewInstances ? 'recebe novas instâncias' : 'novas criações pausadas'}
                </p>
              ))}
              {row.draft.providerUpdates?.map((p) => (
                <p key={p.vpsProviderId}>
                  Limite global de {labels[p.vpsProviderId] ?? p.vpsProviderId}:{' '}
                  {p.maxInstances ?? 'sem limite'}
                </p>
              ))}
              <p>
                Produtos afetados:{' '}
                {row.affectedProducts
                  .map((id) => products.data?.find((p) => p.id === id)?.name ?? id)
                  .join(', ')}
              </p>
            </div>
          )}
          {confirm === 'callback' && row && (
            <Choice
              label="Instância própria"
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
            >
              {row.requiredActions
                .find(
                  (a) => a.providerId === callbackProvider && a.code === 'confirm_instance_webhook'
                )
                ?.instanceIds?.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
            </Choice>
          )}
          <Failure error={journey.apply.error || journey.cancel.error || journey.callback.error} />
          <DialogFooter>
            <Button variant="outline" disabled={journey.busy} onClick={() => setConfirm(null)}>
              Voltar
            </Button>
            <Button
              disabled={
                journey.busy ||
                !row ||
                (confirm === 'apply' &&
                  (journey.applyUncertain ||
                    journey.operation.isFetching ||
                    !!journey.operation.error ||
                    row.status !== 'ready' ||
                    operationExpired(row, now))) ||
                (confirm === 'callback' &&
                  (!instanceId || Date.now() >= Date.parse(row.executionDeadline)))
              }
              onClick={async () => {
                if (!row) return
                try {
                  if (confirm === 'apply') await journey.apply.mutateAsync(row)
                  else if (confirm === 'cancel') await journey.cancel.mutateAsync(row)
                  else await journey.callback.mutateAsync({ row, instanceId })
                  setConfirm(null)
                } catch {
                  /* Mutation error remains visible. */
                }
              }}
            >
              {journey.busy ? 'Enviando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Panel>
  )
}
