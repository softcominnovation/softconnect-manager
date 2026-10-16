import {
  parseOptionalLimit,
  type Evolution,
  type EvolutionAllocation,
  type EvolutionLink,
  type EvolutionLinkResponse,
} from './evolutions'

export type ChangeAction = 'configure_capacity' | 'single_destination' | 'restore_legacy' | 'detach'
export interface EvolutionSetup {
  distributionEnabled: boolean
  databaseConsolidated: boolean
  requirementsVersion: string
  confirmationRequired: boolean
  revision: number
  confirmation: { actor: string; confirmedAt: string } | null
}
export interface EvolutionDraft {
  requestId: string
  expectedRevision: number
  action: ChangeAction
  targetProviderId?: string
  links?: {
    vpsProviderId: string
    expectedRevision?: number
    allocationPriority?: number
    acceptingNewInstances?: boolean
  }[]
  providerUpdates?: {
    vpsProviderId: string
    expectedRevision: number
    maxInstances: number | null
  }[]
  confirmations?: {
    identities: { vpsProviderId: string; expectedRevision: number; confirmed: true }[]
    sharedLimits: {
      vpsProviderId: string
      expectedRevision: number
      maxInstances: number | null
      productIds: string[]
      confirmed: true
    }[]
  }
}
export interface EvolutionChange {
  operationId: string
  productId: string
  action: ChangeAction
  status:
    | 'queued'
    | 'running'
    | 'action_required'
    | 'ready'
    | 'applied'
    | 'failed'
    | 'expired'
    | 'cancelled'
  revision: number
  stage: string
  actor: string
  createdAt: string
  updatedAt: string
  executionDeadline: string
  expiresAt: string
  affectedProducts: string[]
  checks: {
    code: string
    message: string
    blocking: boolean
    providerId?: string
    observedAt: string
  }[]
  requiredActions: {
    code: string
    providerId?: string
    destination: string
    instanceIds?: string[]
    productIds?: string[]
    instructions?: string[]
  }[]
  draft: EvolutionDraft
  callback: {
    instanceId: string
    providerId: string
    state: 'queued' | 'syncing' | 'configured' | 'uncertain'
  } | null
  result: unknown
}
export interface EvolutionRemoval {
  providerId: string
  isActive: boolean
  revision: number
  inventoryRevision: number
  inventoryObservedAt: string | null
  usage: Record<string, number>
  instancesByProduct: { productId: string; _count: { _all: number } }[]
  blockers: string[]
  removable: boolean
}
export interface DistributionRow {
  provider: Evolution
  link?: EvolutionLink
  priority: number
  admission: boolean
  limit: string
  limitEdited: boolean
}
export const actionLabels: Record<ChangeAction, string> = {
  configure_capacity: 'Verificar e ativar distribuição',
  single_destination: 'Usar apenas esta Evolution para novas instâncias',
  restore_legacy: 'Voltar ao modo padrão',
  detach: 'Desvincular deste produto',
}
export const changeStatusLabels: Record<EvolutionChange['status'], string> = {
  queued: 'Aguardando início da verificação',
  running: 'Consultando as Evolutions e conferindo a ocupação',
  action_required: 'Falta resolver uma pendência',
  ready: 'Verificação concluída; falta aplicar a configuração',
  applied: 'Configuração aplicada',
  failed: 'Não foi possível concluir; a configuração anterior foi mantida',
  expired: 'Verificação vencida; prepare novamente',
  cancelled: 'Preparação cancelada; nenhuma mudança de distribuição aplicada',
}
export const isPendingChange = (status?: string) => status === 'queued' || status === 'running'
export function canPrepareCallback(operation: EvolutionChange, now = Date.now()) {
  return operation.status === 'action_required' && now < Date.parse(operation.executionDeadline)
}
export function changePollInterval(operation?: EvolutionChange, now = Date.now()): number | false {
  return operation &&
    isPendingChange(operation.status) &&
    now < Date.parse(operation.executionDeadline)
    ? 2000
    : false
}
export function operationExpired(operation: EvolutionChange, now = Date.now()) {
  return (
    now >=
    Date.parse(
      isPendingChange(operation.status) ? operation.executionDeadline : operation.expiresAt
    )
  )
}
export const apiUnavailable = (error: unknown) =>
  [404, 405, 501].includes((error as { status?: number } | null)?.status ?? 0)
export function distributionRows(entries: EvolutionLinkResponse[]): DistributionRow[] {
  return entries
    .map(({ evolution, link }) => ({
      provider: evolution,
      link,
      priority: link.allocationPriority,
      admission: link.acceptingNewInstances,
      limit: evolution.maxInstances?.toString() ?? '',
      limitEdited: false,
    }))
    .sort((a, b) => a.priority - b.priority || a.provider.id.localeCompare(b.provider.id))
}
// Compare user choices only; refreshed occupancy/revisions do not edit a draft.
export function distributionSelection(rows: DistributionRow[], reorder = false): string {
  return JSON.stringify(
    rows
      .map((row, index) => {
        let limit: number | string | null
        try {
          limit = parseOptionalLimit(row.limit)
        } catch {
          limit = row.limit.trim()
        }
        return {
          id: row.provider.id,
          priority: reorder ? index : row.priority,
          admission: row.admission,
          limit,
        }
      })
      .sort((a, b) => a.id.localeCompare(b.id))
  )
}
export function affectedProductIds(provider: Evolution, productId: string) {
  return Array.from(new Set([...provider.links.map((l) => l.productId), productId])).sort()
}
export function pendingIdentities(rows: DistributionRow[]) {
  return rows.filter(
    (r) =>
      r.provider.identityStatus !== 'verified' &&
      (r.admission || (r.limitEdited && parseOptionalLimit(r.limit) !== null))
  )
}
export function draftFromRows(
  productId: string,
  allocation: EvolutionAllocation,
  rows: DistributionRow[],
  options: { requestId: string; reorder: boolean; identities: boolean; sharedLimits: boolean }
): EvolutionDraft {
  if (!rows.length || !rows.some((r) => r.admission))
    throw new Error('Escolha ao menos uma Evolution para receber novas instâncias.')
  if (rows.length > 50) throw new Error('Prepare até 50 Evolutions por vez.')
  if (new Set(rows.map((r) => r.provider.id)).size !== rows.length)
    throw new Error('Uma Evolution não pode aparecer duas vezes.')
  const updates = rows.filter(
    (r) => r.limitEdited && parseOptionalLimit(r.limit) !== r.provider.maxInstances
  )
  const identities = pendingIdentities(rows)
  if (identities.length && !options.identities)
    throw new Error('Confirme as instalações indicadas no resumo.')
  if (updates.length && !options.sharedLimits)
    throw new Error('Confirme o impacto dos limites globais.')
  return {
    requestId: options.requestId,
    expectedRevision: allocation.configurationRevision,
    action: 'configure_capacity',
    links: rows.map((r, index) => ({
      vpsProviderId: r.provider.id,
      ...(r.link ? { expectedRevision: r.link.configurationRevision } : {}),
      allocationPriority: options.reorder ? index : r.priority,
      acceptingNewInstances: r.admission,
    })),
    providerUpdates: updates.map((r) => ({
      vpsProviderId: r.provider.id,
      expectedRevision: r.provider.configurationRevision,
      maxInstances: parseOptionalLimit(r.limit),
    })),
    confirmations: {
      identities: identities.map((r) => ({
        vpsProviderId: r.provider.id,
        expectedRevision: r.provider.configurationRevision,
        confirmed: true,
      })),
      sharedLimits: updates
        .filter((r) => affectedProductIds(r.provider, productId).length > 1)
        .map((r) => ({
          vpsProviderId: r.provider.id,
          expectedRevision: r.provider.configurationRevision,
          maxInstances: parseOptionalLimit(r.limit),
          productIds: affectedProductIds(r.provider, productId),
          confirmed: true,
        })),
    },
  }
}

// Consent exists only in this mounted journey. It is consumed before sending apply.
export class ChangeConsent {
  private intent: { id: string; scope: string; draft: string } | null = null
  private generation = 0
  checkpoint() {
    return this.generation
  }
  authorize(operation: EvolutionChange, scope: string, generation = this.generation) {
    if (generation !== this.generation) return
    this.intent = { id: operation.operationId, scope, draft: JSON.stringify(operation.draft) }
  }
  clear() {
    this.intent = null
    this.generation++
  }
  claim(operation: EvolutionChange, scope: string, visible: boolean, now = Date.now()) {
    const allowed =
      visible &&
      operation.status === 'ready' &&
      !operationExpired(operation, now) &&
      this.intent?.id === operation.operationId &&
      this.intent.scope === scope &&
      this.intent.draft === JSON.stringify(operation.draft)
    if (allowed) this.clear()
    return !!allowed
  }
}
