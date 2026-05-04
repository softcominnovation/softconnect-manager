export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'admin'
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface VpsServer {
  id: string
  label: string
  subdomain: string
  ip: string
  providerUrl: string
  providerApiKey?: string | null
  adapterType: string
  managerType?: string | null
  managerUrl?: string | null
  managerApiKey?: string | null
  monitorUrl?: string | null
  monitorApiKey?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  name: string
  slug: string
  adapterType: string
  origins: string[]
  hubRelay: boolean
  isActive: boolean
  vpsId: string | null
  vps?: Pick<VpsServer, 'id' | 'label' | 'ip'>
  createdAt: string
  updatedAt: string
}

export interface ProductWithApiKey extends Product {
  apiKey: string
}

export type InstanceStatus = 'open' | 'close' | 'connecting'
export type IntegrationType = 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS'

export interface Instance {
  instanceId: string
  productId: string
  status: InstanceStatus
  ownerJid?: string | null
  profileName?: string | null
  createdAt: string
}

export interface InstanceConnectResponse {
  base64?: string | null
  code?: string | null
  pairingCode?: string | null
}

export interface InstanceStatusResponse {
  instanceId: string
  status: InstanceStatus
  ownerJid?: string | null
  profileName?: string | null
}

export interface CreateInstanceDto {
  instanceName: string
  token?: string
  qrcode?: boolean
  integration?: IntegrationType
}

export interface SendPresenceResponse {
  presence?: string
  status?: string
  error?: string
}

export interface SendTestMessageDto {
  number: string
  text: string
}

export interface SendTestMessageResponse {
  key?: { id: string; fromMe?: boolean; remoteJid?: string }
  status?: string
  message?: string
}

export interface VpsHealthStatus {
  vpsId: string
  vpsName: string
  isHealthy: boolean
  lastChecked: string | null
  errorMessage?: string | null
  systemMetrics?: SystemMetrics | null
}

export interface SystemMetrics {
  cpu: {
    usagePercent: number
    cores: number
  }
  memory: {
    totalMb: number
    usedMb: number
    usagePercent: number
  }
  disk: {
    totalGb: number
    usedGb: number
    usagePercent: number
  }
  collectedAt: string
}

export interface HubMetrics {
  available: boolean
  cpu?: { usagePercent: number; cores: number }
  memory?: { totalMb: number; usedMb: number; usagePercent: number }
  disk?: { totalGb: number; usedGb: number; usagePercent: number }
  collectedAt?: string
}

export interface AdminLog {
  id: string
  method: string
  path: string
  statusCode: number
  productId?: string | null
  instanceId?: string | null
  durationMs: number
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface LogFilters {
  productId?: string
  instanceId?: string
  statusCode?: string
  from?: string
  to?: string
  page?: string
  limit?: string
}

export interface CreateVpsDto {
  label: string
  subdomain: string
  ip: string
  providerUrl: string
  providerApiKey: string
  adapterType?: string
  managerType?: string
  managerUrl?: string
  managerApiKey?: string
  monitorUrl?: string
  monitorApiKey?: string
}

export interface UpdateVpsDto extends Partial<CreateVpsDto> {}

export interface CreateProductDto {
  name: string
  slug: string
  vpsId?: string
  adapterType?: string
  origins?: string[]
  hubRelay?: boolean
}

export interface UpdateProductDto {
  name?: string
  slug?: string
  adapterType?: string
  origins?: string[]
  hubRelay?: boolean
  vpsId?: string
  isActive?: boolean
}

export interface CreateAdminUserDto {
  name: string
  email: string
  password: string
  role: 'admin' | 'superadmin'
}

export interface UpdateAdminUserDto {
  name?: string
  role?: 'admin' | 'superadmin'
  isActive?: boolean
}
