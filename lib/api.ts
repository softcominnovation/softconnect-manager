import type {
  AdminUser,
  VpsServer,
  VpsProvider,
  Product,
  ProductWithApiKey,
  AdminInstance,
  HubInstanceDto,
  CreateInstanceDto,
  ImportInstanceDto,
  ImportInstanceResult,
  ImportBulkResult,
  SendTestMessageDto,
  SendTestMessageResponse,
  AdminLog,
  VpsHealthStatus,
  ProviderHealthEntry,
  VpsSystemMetrics,
  HubMetrics,
  CreateVpsDto,
  UpdateVpsDto,
  CreateVpsProviderDto,
  UpdateVpsProviderDto,
  CreateProductDto,
  UpdateProductDto,
  WebhookConfig,
  WebhookConfigApiResponse,
  SyncRelayDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  InstanceDefaultWebhook,
  InstanceDefaultProxy,
  PaginatedResponse,
  LogFilters,
} from './types'

function withAuth(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

function withApiKey(encryptedApiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-api-key': encryptedApiKey,
  }
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, cache: 'no-store' })

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({}))

  if (response.status === 401) {
    const { useAuthStore } = await import('@/store/auth.store')
    useAuthStore.getState().logout()
    throw new Error('Sessão expirada')
  }

  if (!response.ok) {
    const body = data as {
      message?: string | string[]
      error?: string
      response?: { message?: string | string[] }
    }

    const nested = body.response?.message
    const nestedMsg = Array.isArray(nested) ? nested[0] : nested

    const topMsg = Array.isArray(body.message) ? body.message[0] : body.message

    throw new Error(nestedMsg ?? topMsg ?? body.error ?? 'Erro na requisição')
  }

  return data as T
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AdminUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: { 'Content-Type': 'application/json' },
    }),

  me: (token: string) =>
    request<AdminUser>('/api/me', { headers: withAuth(token) }),

  getVpsList: (token: string) =>
    request<VpsServer[]>('/api/vps', { headers: withAuth(token) }),

  getVps: async (token: string, id: string): Promise<VpsServer> => {
    const list = await request<VpsServer[]>('/api/vps', { headers: withAuth(token) })
    const found = list.find((v) => v.id === id)
    if (!found) throw new Error(`VPS ${id} não encontrada`)
    return found
  },

  createVps: (token: string, dto: CreateVpsDto) =>
    request<VpsServer>('/api/vps', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  updateVps: (token: string, id: string, dto: UpdateVpsDto) =>
    request<VpsServer>(`/api/vps/${id}`, {
      method: 'PUT',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  deactivateVps: (token: string, id: string) =>
    request<void>(`/api/vps/${id}`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),

  getVpsProviders: (token: string, vpsId: string) =>
    request<VpsProvider[]>(`/api/vps/${vpsId}/providers`, { headers: withAuth(token) }),

  createVpsProvider: (token: string, vpsId: string, dto: CreateVpsProviderDto) =>
    request<VpsProvider>(`/api/vps/${vpsId}/providers`, {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  updateVpsProvider: (token: string, vpsId: string, providerId: string, dto: UpdateVpsProviderDto) =>
    request<VpsProvider>(`/api/vps/${vpsId}/providers/${providerId}`, {
      method: 'PUT',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  deactivateVpsProvider: (token: string, vpsId: string, providerId: string) =>
    request<VpsProvider>(`/api/vps/${vpsId}/providers/${providerId}`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),

  getProductList: (token: string) =>
    request<Product[]>('/api/products', { headers: withAuth(token) }),

  getProduct: async (token: string, id: string): Promise<Product> => {
    const list = await request<Product[]>('/api/products', { headers: withAuth(token) })
    const found = list.find((p) => p.id === id)
    if (!found) throw new Error(`Produto ${id} não encontrado`)
    return found
  },

  createProduct: (token: string, dto: CreateProductDto) =>
    request<ProductWithApiKey>('/api/products', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  updateProduct: (token: string, id: string, dto: UpdateProductDto) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  deactivateProduct: (token: string, id: string) =>
    request<void>(`/api/products/${id}`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),

  rotateProductKey: (token: string, id: string) =>
    request<ProductWithApiKey>(`/api/products/${id}/rotate-key`, {
      method: 'POST',
      headers: withAuth(token),
    }),

  updateWebhookConfig: (token: string, productId: string, dto: WebhookConfig) =>
    request<void>(`/api/products/${productId}/webhook-config`, {
      method: 'PUT',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  getWebhookConfig: (token: string, productId: string) =>
    request<WebhookConfigApiResponse>(`/api/products/${productId}/webhook-config`, {
      headers: withAuth(token),
    }),

  syncRelay: (token: string, productId: string, dto?: SyncRelayDto) =>
    request<void>(`/api/products/${productId}/sync-relay`, {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(dto ?? {}),
    }),

  getInstanceList: (token: string, productId: string) =>
    request<AdminInstance[]>(`/api/admin/products/${productId}/instances`, {
      headers: withAuth(token),
    }),

  getHubInstanceList: (token: string, productId: string) =>
    request<HubInstanceDto[]>(`/api/admin/products/${productId}/instances/hub`, {
      headers: withAuth(token),
    }),

  getInstance: (token: string, productId: string, instanceId: string) =>
    request<AdminInstance>(`/api/admin/products/${productId}/instances/${instanceId}`, {
      headers: withAuth(token),
    }),

  createInstance: (token: string, productId: string, dto: CreateInstanceDto) =>
    request<AdminInstance>(`/api/admin/products/${productId}/instances`, {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  deleteInstance: (token: string, productId: string, instanceId: string) =>
    request<void>(`/api/admin/products/${productId}/instances/${instanceId}`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),

  importInstance: (token: string, productId: string, dto: ImportInstanceDto) =>
    request<ImportInstanceResult>(`/api/admin/products/${productId}/instances/import`, {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  importInstancesBulk: (token: string, productId: string) =>
    request<ImportBulkResult>(`/api/admin/products/${productId}/instances/import/bulk`, {
      method: 'POST',
      headers: withAuth(token),
    }),

  sendPresence: (token: string, productId: string, instanceId: string, dto: { number: string; presence: string; delay?: number }) =>
    request<void>(`/api/admin/products/${productId}/instances/${instanceId}/send-presence`, {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  sendTestMessage: (token: string, productId: string, instanceId: string, dto: SendTestMessageDto) =>
    request<SendTestMessageResponse>(
      `/api/admin/products/${productId}/instances/${instanceId}/send-text`,
      {
        method: 'POST',
        headers: withAuth(token),
        body: JSON.stringify(dto),
      }
    ),

  getHealth: (token: string) =>
    request<VpsHealthStatus[]>('/api/health', { headers: withAuth(token) }),

  getVpsHealthDetails: (token: string, vpsId: string) =>
    request<VpsHealthStatus>(`/api/health/${vpsId}`, { headers: withAuth(token) }),

  getHubMetrics: (token: string) =>
    request<HubMetrics>('/api/health/hub/metrics', {
      headers: withAuth(token),
    }),

  getLogs: (token: string, filters?: LogFilters) => {
    const params = new URLSearchParams()
    if (filters) {
      for (const [k, v] of Object.entries(filters)) {
        if (v !== undefined && v !== null && v !== '' && v !== 'undefined') {
          params.set(k, v)
        }
      }
    }
    const qs = params.toString() ? '?' + params.toString() : ''
    return request<PaginatedResponse<AdminLog>>(`/api/logs${qs}`, {
      headers: withAuth(token),
    })
  },

  getAdminUsers: (token: string) =>
    request<AdminUser[]>('/api/users', { headers: withAuth(token) }),

  createAdminUser: (token: string, dto: CreateAdminUserDto) =>
    request<AdminUser>('/api/users', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  updateAdminUser: (token: string, id: string, dto: UpdateAdminUserDto) =>
    request<AdminUser>(`/api/users/${id}`, {
      method: 'PUT',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  deactivateAdminUser: (token: string, id: string) =>
    request<void>(`/api/users/${id}`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),

  deleteAdminUser: (token: string, id: string) =>
    request<void>(`/api/users/${id}`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),

  // Instance Defaults Webhook
  getInstanceDefaultWebhook: (token: string, productId: string) =>
    request<InstanceDefaultWebhook | null>(`/api/admin/products/${productId}/instance-defaults/webhook`, {
      headers: withAuth(token),
    }),

  updateInstanceDefaultWebhook: (token: string, productId: string, dto: InstanceDefaultWebhook) =>
    request<InstanceDefaultWebhook>(`/api/admin/products/${productId}/instance-defaults/webhook`, {
      method: 'PUT',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  deleteInstanceDefaultWebhook: (token: string, productId: string) =>
    request<void>(`/api/admin/products/${productId}/instance-defaults/webhook`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),

  // Instance Defaults Proxy
  getInstanceDefaultProxy: (token: string, productId: string) =>
    request<InstanceDefaultProxy | null>(`/api/admin/products/${productId}/instance-defaults/proxy`, {
      headers: withAuth(token),
    }),

  updateInstanceDefaultProxy: (token: string, productId: string, dto: InstanceDefaultProxy) =>
    request<InstanceDefaultProxy>(`/api/admin/products/${productId}/instance-defaults/proxy`, {
      method: 'PUT',
      headers: withAuth(token),
      body: JSON.stringify(dto),
    }),

  deleteInstanceDefaultProxy: (token: string, productId: string) =>
    request<void>(`/api/admin/products/${productId}/instance-defaults/proxy`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),
}
