export interface EvolutionInventory {
  status: string
  asOf: string | null
  ageMs: number | null
  revision: number
  occupancyRevision: number
  fresh: boolean
  ambiguous?: boolean
}

export interface EvolutionOccupancy {
  vpsProviderId: string
  instances: number
  reservations: number
  effective: number
  byProduct: Record<string, number>
  maxInstances: number | null
  limitConfigured: boolean
  available: number | null
  overLimit: boolean | null
  asOf: string | null
  inventory: EvolutionInventory
}

export interface EvolutionLink {
  productId: string
  vpsProviderId: string
  allocationPriority: number
  acceptingNewInstances: boolean
  configurationRevision: number
}

export interface Evolution {
  id: string
  vpsId: string
  label: string
  providerUrl: string
  adapterType: string
  isActive: boolean
  maxInstances: number | null
  acceptingNewInstances: boolean
  configurationRevision: number
  hasProviderCredential: boolean
  identityStatus: string
  callbackReadiness: string
  health: { isHealthy: boolean; asOf: string | null; fresh: boolean }
  inventory: EvolutionInventory
  occupancy: EvolutionOccupancy
  links: (EvolutionLink & { product: { id: string; name: string; allocationMode: string } })[]
}

export interface EvolutionLinkResponse {
  link: EvolutionLink
  evolution: Evolution
  allocationRevision?: number
}

export interface EvolutionAllocation {
  mode: 'legacy' | 'capacity'
  configurationRevision: number
  defaultProviderId: string | null
  distributionEnabled: boolean
  databaseConsolidated: boolean
  capacityFirstAllocationAt: string | null
  requiresWriterConfirmation: boolean
  blockers: string[]
  ready: boolean
  order: (Omit<EvolutionLink, 'productId'> & {
    eligible: boolean
    blockers: string[]
    maxInstances: number | null
  })[]
}

export interface EvolutionReconciliation {
  operationId: string
  vpsProviderId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  errorCode: string | null
  result: {
    inventoryRevision: number | null
    unknownCount: number | null
    conflictCount: number | null
  } | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

export interface ImportCandidates {
  items: {
    providerInstanceId: string
    instanceName: string
    status: string | null
    ownership: 'own' | 'unassigned'
    hubInstanceId?: string
  }[]
  asOf: string | null
  inventoryStatus: string
  conflictCount: number
}

export interface InstancePlacement {
  instanceId: string
  vpsProviderId: string
  label: string
  providerUrl: string
  vpsId: string
}

export interface CreateEvolution {
  vpsId: string
  label: string
  providerUrl: string
  providerApiKey: string
  adapterType: 'evolution'
}

export type UpdateEvolution = Partial<CreateEvolution> & {
  expectedRevision: number
  maxInstances?: number | null
  acceptingNewInstances?: boolean
  isActive?: boolean
  confirmIdentity?: true
  writersCompatible?: true
}

export interface EvolutionFilters {
  search?: string
  vpsId?: string
  productId?: string
  isActive?: boolean
}
export interface ImportBulkOptions {
  vpsProviderId?: string
  instanceIds?: string[]
}

export function parseOptionalLimit(value: string): number | null {
  if (!value.trim()) return null
  if (!/^\d+$/.test(value.trim()))
    throw new Error('Informe um limite inteiro positivo ou deixe vazio.')
  const limit = Number(value)
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 2147483647)
    throw new Error('O limite deve estar entre 1 e 2147483647.')
  return limit
}

export function capacityPatch(
  current: number | null,
  value: string,
  expectedRevision: number,
  confirmed: boolean
): UpdateEvolution {
  const next = parseOptionalLimit(value)
  if (next === current) return { expectedRevision }
  if (next !== null && !confirmed)
    throw new Error(
      'Conclua a preparação do ambiente antes de definir o limite.'
    )
  return {
    expectedRevision,
    maxInstances: next,
  }
}

export function availabilityText(occupancy: EvolutionOccupancy): string {
  if (occupancy.maxInstances === null) return 'Sem limite configurado no Hub'
  if (occupancy.available === null) return 'Sem informação atualizada de vagas'
  return `${occupancy.available} vagas disponíveis`
}

export const readinessLabels: Record<string, string> = {
  allocation_disabled: 'Distribuição ainda não habilitada na API',
  database_not_consolidated: 'Preparação do banco pendente',
  product_inactive: 'Produto inativo',
  no_eligible_evolution: 'Nenhuma Evolution pronta para novas instâncias',
  identity_unverified: 'Identidade da instalação não confirmada',
  endpoint_alias: 'URL cadastrada em mais de um provider',
  provider_inactive: 'Provider inativo',
  vps_inactive: 'VPS inativa',
  health_unconfirmed: 'Saúde sem confirmação recente',
  inventory_unconfirmed: 'Inventário sem confirmação recente',
  callback_unconfirmed: 'Callback autenticado ainda não confirmado',
  occupancy_ambiguous: 'Ocupação precisa de revisão',
  provisioning_unresolved: 'Existem criações pendentes de resolução',
  link_paused: 'Novas criações pausadas para este produto',
  provider_paused: 'Novas criações pausadas para todos os produtos',
  adapter_mismatch: 'Adapter incompatível com o produto',
  capacity_full: 'Limite de instâncias atingido',
  configuration_changed: 'Atualize o inventário após alterar a configuração',
}

export function bulkRequest(
  productId: string,
  options?: ImportBulkOptions
): { url: string; body?: string } {
  const query = options?.vpsProviderId
    ? `?${new URLSearchParams({ vpsProviderId: options.vpsProviderId })}`
    : ''
  const ids = options?.instanceIds
  if (ids && (!ids.length || ids.some((id) => !id.trim()) || new Set(ids).size !== ids.length))
    throw new Error('Selecione ao menos uma instância, sem IDs repetidos.')
  return {
    url: `/api/admin/products/${encodeURIComponent(productId)}/instances/import/bulk${query}`,
    ...(ids ? { body: JSON.stringify({ instanceIds: ids }) } : {}),
  }
}
