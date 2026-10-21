'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  useEvolution,
  useEvolutionCredential,
  useEvolutionMutation,
  useEvolutionSetup,
  evolutionQueryRoots,
} from '@/hooks/use-evolutions'
import { useVpsList } from '@/hooks/use-vps'
import { useAuthStore } from '@/store/auth.store'
import { evolutionsApi } from '@/lib/evolutions-api'
import {
  availabilityText,
  capacityPatch,
  type Evolution,
  type UpdateEvolution,
} from '@/lib/evolutions'
import { providerChanges } from '@/lib/provider-form'
import { ProviderForm } from './provider-form'
import { ConnectingMaintenance } from './connecting-maintenance'
import { EvolutionRetirement } from './evolution-retirement'
import { Panel, Failure, Acknowledgement } from './shared'

function BasicEditor({ provider }: { provider: Evolution }) {
  const credential = useEvolutionCredential(provider)
  const [base, setBase] = useState<Evolution & { providerApiKey?: string }>(provider)
  const [version, setVersion] = useState(0)
  const [dirty, setDirty] = useState(false)
  const vps = useVpsList()
  const update = useEvolutionMutation((token, dto: UpdateEvolution) =>
    evolutionsApi.update(token, provider.id, dto)
  )
  useEffect(() => {
    if (
      !dirty &&
      !update.isPending &&
      !update.isError &&
      !credential.isPending &&
      (base.configurationRevision !== provider.configurationRevision ||
        base.providerApiKey !== (credential.data ?? ''))
    ) {
      setBase({ ...provider, providerApiKey: credential.data ?? '' })
      setVersion((value) => value + 1)
    }
  }, [
    provider,
    base.configurationRevision,
    base.providerApiKey,
    credential.data,
    credential.isPending,
    dirty,
    update.isPending,
    update.isError,
  ])
  return (
    <Panel title="Cadastro da instalação">
      <p className="text-sm text-muted-foreground">
        Este cadastro é compartilhado por {provider.links.length} produto(s). Alterar URL, VPS ou
        credencial afeta todos eles. A API verifica se a instalação pode ser alterada.
      </p>
      <Failure error={vps.error} />
      <Failure error={credential.error} onReload={() => void credential.refetch()} />
      {!credential.isPending && !credential.isError && !credential.data && (
        <p className="text-sm text-muted-foreground">
          {provider.isActive
            ? 'A chave atual não está disponível na resposta administrativa. Deixe o campo em branco para preservá-la.'
            : 'A consulta administrativa atual só disponibiliza chaves de providers ativos. A chave cadastrada está preservada; deixe o campo em branco para mantê-la.'}
        </p>
      )}
      {credential.isPending && base.providerApiKey === undefined ? (
        <p role="status">Carregando chave do provider…</p>
      ) : (
        <ProviderForm
          key={version}
          editing
          initial={base}
          onDirtyChange={setDirty}
          vpsOptions={vps.data}
          pending={update.isPending}
          error={update.error}
          onReload={() => {
            setBase({ ...provider, providerApiKey: credential.data ?? '' })
            setVersion((v) => v + 1)
            update.reset()
          }}
          onSubmit={(values) => {
            const changes = providerChanges(values, base)
            update.mutate(
              {
                ...changes,
                adapterType: changes.adapterType as 'evolution' | undefined,
                expectedRevision: base.configurationRevision,
              },
              {
                onSuccess: (result) => {
                  setBase({
                    ...result,
                    providerApiKey: changes.providerApiKey ?? base.providerApiKey,
                  })
                  setVersion((v) => v + 1)
                  toast.success('Provider atualizado')
                },
              }
            )
          }}
        />
      )}
    </Panel>
  )
}

function LimitEditor({ provider }: { provider: Evolution }) {
  const [base, setBase] = useState(provider)
  const [limit, setLimit] = useState(provider.maxInstances?.toString() ?? '')
  const setup = useEvolutionSetup()
  const [impact, setImpact] = useState(false)
  const [validation, setValidation] = useState<Error | null>(null)
  const update = useEvolutionMutation((token, dto: UpdateEvolution) =>
    evolutionsApi.update(token, provider.id, dto)
  )
  const dirty = limit !== (base.maxInstances?.toString() ?? '') || impact
  useEffect(() => {
    if (
      !dirty &&
      !update.isPending &&
      !update.isError &&
      base.configurationRevision !== provider.configurationRevision
    ) {
      setBase(provider)
      setLimit(provider.maxInstances?.toString() ?? '')
    }
  }, [provider, base.configurationRevision, dirty, update.isPending, update.isError])
  return (
    <Panel title="Limite global opcional">
      <p className="text-sm text-muted-foreground">
        O limite vale para toda esta Evolution, somando os produtos vinculados. Vazio remove o teto.
        Instâncias existentes permanecem no mesmo host. Este valor não garante a capacidade física
        da VPS.
      </p>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          setValidation(null)
          try {
            const patch = capacityPatch(
              base.maxInstances,
              limit,
              base.configurationRevision,
              !!setup.data?.databaseConsolidated && !setup.data.confirmationRequired
            )
            if ('maxInstances' in patch && !impact)
              throw new Error('Confirme o impacto nos produtos vinculados.')
            update.mutate(patch, {
              onSuccess: (result) => {
                setBase(result)
                setLimit(result.maxInstances?.toString() ?? '')
                setImpact(false)
                toast.success('Limite atualizado')
              },
            })
          } catch (error) {
            setValidation(error as Error)
          }
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="provider-limit">Máximo de instâncias (opcional)</Label>
          <Input
            id="provider-limit"
            inputMode="numeric"
            value={limit}
            disabled={update.isPending}
            onChange={(e) => {
              setLimit(e.target.value)
              setImpact(false)
            }}
            placeholder="Sem limite"
          />
        </div>
        <p className="text-sm">
          Limite atual: {base.maxInstances ?? 'sem limite'} → novo: {limit || 'sem limite'}.
          Produtos afetados:{' '}
          {base.links.map((l) => l.product.name).join(', ') || 'nenhum vinculado'}.
        </p>
        <Acknowledgement checked={impact} onChange={setImpact}>
          Entendo que a alteração afeta todos os produtos vinculados a esta Evolution.
        </Acknowledgement>
        {(!setup.data || setup.data.confirmationRequired || !setup.data.databaseConsolidated) && (
          <Link
            href="/providers/setup"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-primary underline"
          >
            Consultar preparação do ambiente em outra aba
          </Link>
        )}
        <Failure
          error={validation || update.error}
          onReload={() => {
            setBase(provider)
            setLimit(provider.maxInstances?.toString() ?? '')
            setImpact(false)
            setValidation(null)
            update.reset()
          }}
        />
        <Button disabled={update.isPending} type="submit">
          {update.isPending ? 'Salvando…' : 'Salvar limite'}
        </Button>
      </form>
    </Panel>
  )
}

export function ProviderDetail({ id }: { id: string }) {
  const query = useEvolution(id)
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  const [operationId, setOperationId] = useState('')
  const [operationDeadline, setOperationDeadline] = useState(0)
  const refreshed = useRef('')
  const [action, setAction] = useState<{
    title: string
    description: string
    revision: number
    patch?: UpdateEvolution
    reconcile?: boolean
  } | null>(null)
  const operation = useQuery({
    queryKey: ['evolution-reconciliation', id, operationId],
    queryFn: () => evolutionsApi.reconciliation(token!, id, operationId),
    enabled: !!token && !!operationId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: (query) =>
      !query.state.error &&
      Date.now() < operationDeadline &&
      ['pending', 'running'].includes(query.state.data?.status ?? '')
        ? 2000
        : false,
  })
  const change = useEvolutionMutation(async (jwt, selected: NonNullable<typeof action>) => {
    if (selected.reconcile) {
      const result = await evolutionsApi.reconcile(jwt, id, selected.revision)
      setOperationId(result.operationId)
      setOperationDeadline(Date.now() + 120000)
      return result
    }
    return evolutionsApi.update(jwt, id, selected.patch!)
  })
  const provider = query.data
  useEffect(() => {
    if (
      !operation.data ||
      !['completed', 'failed'].includes(operation.data.status) ||
      refreshed.current === operation.data.operationId
    )
      return
    refreshed.current = operation.data.operationId
    void Promise.all(evolutionQueryRoots.map((key) => qc.invalidateQueries({ queryKey: [key] })))
  }, [operation.data, qc])
  if (!provider)
    return (
      <div className="space-y-4">
        <Link href="/providers">Voltar aos providers</Link>
        {query.isLoading && <p role="status">Carregando provider…</p>}
        <Failure error={query.error} onReload={() => void query.refetch()} />
      </div>
    )
  const selectAction = (
    title: string,
    description: string,
    patch: Omit<UpdateEvolution, 'expectedRevision'>
  ) => {
    change.reset()
    setAction({
      title,
      description,
      revision: provider.configurationRevision,
      patch: { ...patch, expectedRevision: provider.configurationRevision },
    })
  }
  return (
    <div className="space-y-6">
      <Link href="/providers" className="text-sm text-primary underline">
        Voltar aos providers
      </Link>
      <div>
        <h1 className="text-2xl font-semibold">{provider.label}</h1>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <p className="min-w-0 break-all">{provider.providerUrl}</p>
          {provider.adapterType === 'evolution' && (
            <Button asChild variant="ghost" size="icon" className="h-7 w-7 shrink-0">
              <a
                href={`${provider.providerUrl.replace(/\/+$/, '')}/manager`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir Manager da Evolution em outra aba"
                title="Abrir Manager da Evolution"
              >
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          )}
        </div>
      </div>
      <Failure error={query.error} onReload={() => void query.refetch()} />
      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <BasicEditor provider={provider} />
          <LimitEditor provider={provider} />
        </div>
        <div className="space-y-6">
          <Panel title="Ocupação e prontidão">
            <p>{availabilityText(provider.occupancy)}</p>
            <p className="text-sm">
              Instâncias: {provider.occupancy.instances} · Reservas:{' '}
              {provider.occupancy.reservations} · Total considerado: {provider.occupancy.effective}
            </p>
            <p className="text-sm text-muted-foreground">
              Inventário: {provider.inventory.fresh ? 'Atualizado' : 'Sem confirmação recente'} ·{' '}
              {provider.inventory.asOf
                ? new Date(provider.inventory.asOf).toLocaleString('pt-BR')
                : 'Sem data de confirmação'}
            </p>
            <p className="text-sm">
              Saúde:{' '}
              {provider.health.fresh
                ? provider.health.isHealthy
                  ? 'Disponível'
                  : 'Indisponível'
                : 'Sem confirmação recente'}
            </p>
            <p className="text-sm">
              Identidade: {provider.identityStatus} · Callback: {provider.callbackReadiness}
            </p>
            <p className="text-sm text-muted-foreground">
              Callback é confirmado pela recepção autenticada de eventos. Salvar o cadastro não
              confirma essa etapa.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                change.reset()
                setAction({
                  title: 'Atualizar inventário?',
                  description:
                    'A API consultará esta Evolution e atualizará as evidências de ocupação. Nenhuma sessão será migrada.',
                  revision: provider.configurationRevision,
                  reconcile: true,
                })
              }}
            >
              Atualizar inventário
            </Button>
            {operationId && (
              <div className="space-y-2 rounded-md border p-3">
                <p role="status" className="text-sm">
                  {operation.data?.status === 'completed'
                    ? 'Inventário atualizado'
                    : operation.data?.status === 'failed'
                      ? 'Não foi possível atualizar o inventário'
                      : 'Consultando a Evolution; o resultado será atualizado automaticamente por até 2 minutos'}
                </p>
                {operation.data?.errorCode && (
                  <p className="text-sm text-destructive">{operation.data.errorCode}</p>
                )}
                <Failure error={operation.error} />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={operation.isFetching}
                  onClick={async () => {
                    await operation.refetch()
                    await Promise.all(
                      evolutionQueryRoots.map((key) => qc.invalidateQueries({ queryKey: [key] }))
                    )
                  }}
                >
                  Consultar resultado
                </Button>
              </div>
            )}
          </Panel>
          <Panel title="Produtos vinculados">
            {provider.links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum produto vinculado. O cadastro pode ser usado no formulário atual de produtos
                ou vinculado nas configurações avançadas.
              </p>
            ) : (
              <ul className="space-y-3">
                {provider.links.map(({ product, acceptingNewInstances }) => (
                  <li key={product.id} className="flex flex-wrap justify-between gap-2 text-sm">
                    <Link href={`/products/${product.id}`} className="text-primary underline">
                      {product.name}
                    </Link>
                    <span>
                      {provider.occupancy.byProduct[product.id] ?? 0} ocupações (inclui reservas) ·{' '}
                      {acceptingNewInstances ? 'Admissão permitida' : 'Admissão pausada'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Controles globais">
            <p className="text-sm text-muted-foreground">
              Estas ações alcançam todos os produtos vinculados. Para pausar apenas um produto, abra
              suas configurações. Pausar novas criações não muda o host das instâncias existentes.
            </p>
            <p className="text-sm">
              Cadastro {provider.isActive ? 'ativo' : 'inativo'} · Novas criações{' '}
              {provider.acceptingNewInstances ? 'permitidas' : 'pausadas'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  selectAction(
                    provider.acceptingNewInstances
                      ? 'Pausar novas criações?'
                      : 'Permitir novas criações?',
                    'A alteração vale para todos os produtos vinculados a esta Evolution.',
                    { acceptingNewInstances: !provider.acceptingNewInstances }
                  )
                }
              >
                {provider.acceptingNewInstances
                  ? 'Pausar novas criações'
                  : 'Permitir novas criações'}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  selectAction(
                    'Confirmar identidade da instalação?',
                    'Confirme somente se esta URL representa uma instalação Evolution independente, com identidade verificada. Isso não confirma saúde nem callback.',
                    { confirmIdentity: true }
                  )
                }
              >
                Confirmar identidade
              </Button>
              {provider.isActive ? (
                <EvolutionRetirement
                  provider={provider}
                  onPause={() =>
                    selectAction(
                      'Parar novas criações para todos os produtos?',
                      'As sessões existentes continuam operacionais. A pausa afeta todos os produtos desta Evolution.',
                      { acceptingNewInstances: false }
                    )
                  }
                />
              ) : (
                <Button
                  variant="outline"
                  onClick={() =>
                    selectAction(
                      'Reativar provider?',
                      'Reativa o cadastro global. As pausas e os limites permanecem independentes.',
                      { isActive: true }
                    )
                  }
                >
                  Reativar cadastro
                </Button>
              )}
            </div>
          </Panel>
        </div>
      </div>
      {provider.adapterType === 'evolution' && <ConnectingMaintenance providerId={provider.id} />}
      <Dialog
        open={!!action}
        onOpenChange={(open) => {
          if (!open && !change.isPending) setAction(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action?.title}</DialogTitle>
            <DialogDescription>{action?.description}</DialogDescription>
          </DialogHeader>
          <Failure
            error={change.error}
            onReload={() => {
              void query.refetch()
              setAction(null)
              change.reset()
            }}
          />
          <DialogFooter>
            <Button variant="outline" disabled={change.isPending} onClick={() => setAction(null)}>
              Cancelar
            </Button>
            <Button
              disabled={change.isPending}
              onClick={() =>
                action &&
                change.mutate(action, {
                  onSuccess: () => {
                    setAction(null)
                    toast.success('Operação aceita')
                  },
                })
              }
            >
              {change.isPending ? 'Enviando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
