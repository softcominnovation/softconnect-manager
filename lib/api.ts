import type {
  AdminUser,
  VpsServer,
  Product,
  AdminLog,
  VpsHealthStatus,
  HubMetrics,
  CreateVpsDto,
  UpdateVpsDto,
  CreateProductDto,
  UpdateProductDto,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  PaginatedResponse,
  LogFilters,
} from './types'

function withAuth(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
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
    throw new Error(
      (data as { message?: string; error?: string })?.message ??
        (data as { message?: string; error?: string })?.error ??
        'Erro na requisição'
    )
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

  getVps: (token: string, id: string) =>
    request<VpsServer>(`/api/vps/${id}`, { headers: withAuth(token) }),

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

  getProductList: (token: string) =>
    request<Product[]>('/api/products', { headers: withAuth(token) }),

  getProduct: (token: string, id: string) =>
    request<Product>(`/api/products/${id}`, { headers: withAuth(token) }),

  createProduct: (token: string, dto: CreateProductDto) =>
    request<Product>('/api/products', {
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

  getInstanceList: (token: string, params?: { vpsId?: string; productId?: string }) => {
    const qs = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : ''
    return request<unknown[]>(`/api/instances${qs}`, { headers: withAuth(token) })
  },

  getInstance: (token: string, instanceId: string) =>
    request<unknown>(`/api/instances/${instanceId}`, {
      headers: withAuth(token),
    }),

  deleteInstance: (token: string, instanceId: string) =>
    request<void>(`/api/instances/${instanceId}`, {
      method: 'DELETE',
      headers: withAuth(token),
    }),

  getHealth: (token: string) =>
    request<VpsHealthStatus[]>('/api/health', { headers: withAuth(token) }),

  getHubMetrics: (token: string) =>
    request<HubMetrics>('/api/health/hub/metrics', {
      headers: withAuth(token),
    }),

  getLogs: (token: string, filters?: LogFilters) => {
    const qs = filters
      ? '?' + new URLSearchParams(filters as Record<string, string>).toString()
      : ''
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
}
