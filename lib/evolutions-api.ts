import { request, withAuth } from './api'
import type {
  EvolutionChange,
  EvolutionDraft,
  EvolutionSetup,
  EvolutionRemoval,
} from './evolution-changes'
import type {
  Evolution,
  EvolutionFilters,
  EvolutionLinkResponse,
  EvolutionAllocation,
  EvolutionOccupancy,
  EvolutionReconciliation,
  ImportCandidates,
  InstancePlacement,
  CreateEvolution,
  UpdateEvolution,
} from './evolutions'

const providerPath = (id: string) => `/api/evolutions/${encodeURIComponent(id)}`
const productPath = (id: string) => `/api/admin/products/${encodeURIComponent(id)}`
const write = (token: string, body: unknown, method = 'PUT') => ({
  method,
  headers: withAuth(token),
  body: JSON.stringify(body),
})

export const evolutionsApi = {
  setup: (token: string) =>
    request<EvolutionSetup>('/api/evolution-setup', { headers: withAuth(token) }),
  confirmSetup: (token: string, expectedRevision: number) =>
    request<EvolutionSetup>(
      '/api/evolution-setup/confirmation',
      write(token, { expectedRevision, writersCompatible: true })
    ),
  changes: (token: string, productId: string) =>
    request<{ items: EvolutionChange[] }>(`${productPath(productId)}/evolution-changes`, {
      headers: withAuth(token),
    }),
  change: (token: string, productId: string, id: string) =>
    request<EvolutionChange>(
      `${productPath(productId)}/evolution-changes/${encodeURIComponent(id)}`,
      { headers: withAuth(token) }
    ),
  prepareChange: (token: string, productId: string, draft: EvolutionDraft) =>
    request<EvolutionChange>(
      `${productPath(productId)}/evolution-changes`,
      write(token, draft, 'POST')
    ),
  applyChange: (token: string, productId: string, id: string, expectedOperationRevision: number) =>
    request<EvolutionChange>(
      `${productPath(productId)}/evolution-changes/${encodeURIComponent(id)}/apply`,
      write(token, { expectedOperationRevision }, 'POST')
    ),
  cancelChange: (token: string, productId: string, id: string, expectedOperationRevision: number) =>
    request<EvolutionChange>(
      `${productPath(productId)}/evolution-changes/${encodeURIComponent(id)}/cancel`,
      write(token, { expectedOperationRevision }, 'POST')
    ),
  callbackCheck: (
    token: string,
    productId: string,
    id: string,
    expectedOperationRevision: number,
    instanceId: string
  ) =>
    request<EvolutionChange>(
      `${productPath(productId)}/evolution-changes/${encodeURIComponent(id)}/callback-check`,
      write(token, { expectedOperationRevision, instanceId, confirmWebhookUpdate: true }, 'POST')
    ),
  removal: (token: string, id: string) =>
    request<EvolutionRemoval>(`${providerPath(id)}/removal-readiness`, {
      headers: withAuth(token),
    }),
  retire: (
    token: string,
    id: string,
    expectedRevision: number,
    expectedInventoryRevision: number
  ) =>
    request<EvolutionRemoval>(
      `${providerPath(id)}/retirement`,
      write(token, { expectedRevision, expectedInventoryRevision }, 'POST')
    ),
  list(token: string, filters: EvolutionFilters = {}) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(filters))
      if (value !== undefined && value !== '') query.set(key, String(value))
    return request<Evolution[]>(`/api/evolutions?${query}`, { headers: withAuth(token) })
  },
  get: (token: string, id: string) =>
    request<Evolution>(providerPath(id), { headers: withAuth(token) }),
  create: (token: string, dto: CreateEvolution) =>
    request<Evolution>('/api/evolutions', write(token, dto, 'POST')),
  update: (token: string, id: string, dto: UpdateEvolution) =>
    request<Evolution>(providerPath(id), write(token, dto)),
  deactivate: (token: string, id: string, revision: number) =>
    request<Evolution>(`${providerPath(id)}?expectedRevision=${revision}`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),
  occupancy: (token: string, id: string) =>
    request<EvolutionOccupancy>(`${providerPath(id)}/occupancy`, { headers: withAuth(token) }),
  reconcile: (token: string, id: string, expectedRevision: number) =>
    request<EvolutionReconciliation>(
      `${providerPath(id)}/reconcile`,
      write(token, { expectedRevision }, 'POST')
    ),
  reconciliation: (token: string, id: string, operationId: string) =>
    request<EvolutionReconciliation>(
      `${providerPath(id)}/reconciliations/${encodeURIComponent(operationId)}`,
      { headers: withAuth(token) }
    ),
  links: (token: string, productId: string) =>
    request<EvolutionLinkResponse[]>(`${productPath(productId)}/evolutions`, {
      headers: withAuth(token),
    }),
  attach: (token: string, productId: string, vpsProviderId: string, expectedRevision: number) =>
    request<EvolutionLinkResponse>(
      `${productPath(productId)}/evolutions/attach`,
      write(token, { vpsProviderId, expectedRevision }, 'POST')
    ),
  updateLink: (
    token: string,
    productId: string,
    id: string,
    dto: { expectedRevision: number; allocationPriority?: number; acceptingNewInstances?: boolean }
  ) =>
    request<EvolutionLinkResponse>(
      `${productPath(productId)}/evolutions/${encodeURIComponent(id)}`,
      write(token, dto)
    ),
  detach: (token: string, productId: string, id: string, revision: number) =>
    request<void>(
      `${productPath(productId)}/evolutions/${encodeURIComponent(id)}?expectedRevision=${revision}`,
      { method: 'DELETE', headers: withAuth(token) }
    ),
  allocation: (token: string, productId: string) =>
    request<EvolutionAllocation>(`${productPath(productId)}/allocation`, {
      headers: withAuth(token),
    }),
  setAllocation: (
    token: string,
    productId: string,
    dto: { expectedRevision: number; mode: 'legacy' | 'capacity'; writersCompatible?: true }
  ) => request<EvolutionAllocation>(`${productPath(productId)}/allocation`, write(token, dto)),
  candidates: (token: string, productId: string, id: string) =>
    request<ImportCandidates>(
      `${productPath(productId)}/evolutions/${encodeURIComponent(id)}/import-candidates`,
      { headers: withAuth(token) }
    ),
  placements: (token: string, productId: string) =>
    request<InstancePlacement[]>(`${productPath(productId)}/instances/placements`, {
      headers: withAuth(token),
    }),
}
