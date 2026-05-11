export interface AdminUser {
  id: string
  name: string
  email: string
  type: 'super-admin' | 'admin' | 'user'
  isActive: boolean
  createdAt: string
}

export interface VpsProvider {
  id: string
  vpsId: string
  label: string
  providerUrl: string
  providerApiKey?: string | null
  adapterType: string
  isHealthy?: boolean
  lastHealthAt?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface VpsServer {
  id: string
  label: string
  subdomain: string
  ip: string
  managerType?: string | null
  managerUrl?: string | null
  managerApiKey?: string | null
  monitorUrl?: string | null
  monitorApiKey?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  providers?: VpsProvider[]
}

export interface Product {
  id: string
  name: string
  slug: string
  adapterType: string
  origins: string[] | null
  hubRelay: boolean
  batchWebhookEnabled: boolean
  batchWebhookUrl: string | null
  isActive: boolean
  vpsProviderId: string | null
  vpsProvider?: Pick<VpsProvider, 'id' | 'label' | 'providerUrl'>
  createdAt: string
  updatedAt: string
}

export interface ProductWithApiKey extends Product {
  apiKey: string
}

export type InstanceStatus = 'open' | 'close' | 'connecting' | 'disconnected'
export type IntegrationType = 'WHATSAPP-BAILEYS' | 'WHATSAPP-BUSINESS'

export interface Instance {
  instanceId: string
  productId: string
  status: InstanceStatus
  ownerJid?: string | null
  profileName?: string | null
  createdAt: string
}

export interface AdminInstance {
  id: string
  providerInstanceId?: string | null
  name: string
  connectionStatus: InstanceStatus
  ownerJid?: string | null
  profileName?: string | null
  profilePicUrl?: string | null
  integration?: string | null
  number?: string | null
  token?: string | null
  clientName?: string | null
  createdAt: string
  updatedAt: string
  Setting?: Record<string, unknown> | null
  _count?: { Message: number; Contact: number; Chat: number }
}

export interface HubInstanceDto {
  id: string
  instanceName: string
  providerInstanceId: string | null
  status: string
  phoneNumber: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateInstanceDto {
  instanceName: string
  number?: string
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

export interface ProviderHealthEntry {
  providerId: string
  label: string
  adapterType: string
  providerUrl: string
  isHealthy: boolean
  lastHealthAt: string | null
  lastCheck: {
    status: string
    responseMs: number | null
    errorMsg: string | null
    checkedAt: string
  } | null
}

export interface VpsHealthStatus {
  vpsId: string
  label: string
  subdomain: string
  isHealthy: boolean
  lastHealthAt: string | null
  lastCheck: {
    status: string
    responseMs: number | null
    errorMsg: string | null
    checkedAt: string
  } | null
  systemMetrics?: VpsSystemMetrics | null
  providers: ProviderHealthEntry[]
}

export interface VpsSystemMetrics {
  cpu?: {
    manufacturer?: string
    brand?: string
    speed?: number
    cores?: number
    physicalCores?: number
    load: string
    coresLoad?: HubCpuCoreLoad[]
  }
  memory?: {
    total: string
    used: string
    free: string
    cached?: string
    available: string
  }
  disks?: HubDisk[]
  collectedAt: string
}

export interface HubCpuCoreLoad {
  core: number
  load: string
}

export interface HubDisk {
  device: string
  type: string
  mount: string
  used: string
  size: string
  available: string
  use: string
}

export interface HubMetrics {
  available: boolean
  cpu?: {
    manufacturer?: string
    brand?: string
    speed?: number
    cores: number
    physicalCores?: number
    load: string
    coresLoad?: HubCpuCoreLoad[]
  }
  memory?: {
    total: string
    used: string
    free: string
    cached: string
    available: string
  }
  disks?: HubDisk[]
  collectedAt?: string
}

export interface AdminLog {
  id: string
  method: string
  endpoint: string
  statusCode: number
  productId?: string | null
  instanceId?: string | null
  latencyMs: number
  origin?: string | null
  ip?: string | null
  errorMsg?: string | null
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total?: number
  page?: number
  limit?: number
  totalPages?: number
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
  managerType?: string
  managerUrl?: string
  managerApiKey?: string
  monitorUrl?: string
  monitorApiKey?: string
  notes?: string
}

export interface UpdateVpsDto extends Partial<CreateVpsDto> {}

export interface CreateVpsProviderDto {
  label: string
  providerUrl: string
  providerApiKey: string
  adapterType: string
}

export interface UpdateVpsProviderDto {
  label?: string
  providerUrl?: string
  providerApiKey?: string
  adapterType?: string
  isActive?: boolean
}

export interface CreateProductDto {
  name: string
  slug: string
  vpsProviderId?: string
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
  batchWebhookEnabled?: boolean
  batchWebhookUrl?: string | null
  vpsProviderId?: string
  isActive?: boolean
}

export interface WebhookConfig {
  url: string
  secret: string
  events: string[]
  byEvents?: boolean
  base64?: boolean
}

export interface WebhookConfigApiResponse extends WebhookConfig {
  id: string
  productId: string
  isActive: boolean
  createdAt: string
}

export interface SyncRelayDto {
  instanceId?: string
}

export interface ImportInstanceDto {
  id: string
  name: string
  token: string
  connectionStatus?: string
  number?: string
}

export interface ImportInstanceResult {
  result: 'created' | 'skipped'
  hubInstanceId: string
}

export interface ImportBulkDetail {
  instanceName: string
  result: 'created' | 'skipped' | 'error'
  hubInstanceId?: string
  error?: string
}

export interface ImportBulkResult {
  created: number
  skipped: number
  errors: number
  details: ImportBulkDetail[]
}

export interface CreateAdminUserDto {
  name: string
  email: string
  password: string
  type: 'super-admin' | 'admin' | 'user'
}

export interface UpdateAdminUserDto {
  name?: string
  type?: 'super-admin' | 'admin' | 'user'
  isActive?: boolean
}

export interface InstanceDefaultWebhook {
  id?: string
  productId?: string
  enabled: boolean
  url: string
  headers?: Record<string, string>
  byEvents: boolean
  base64: boolean
  events: string[]
  createdAt?: string
  updatedAt?: string
}

export interface InstanceDefaultProxy {
  id?: string
  productId?: string
  enabled: boolean
  host: string
  port: string
  protocol: string
  username?: string
  password?: string
  createdAt?: string
  updatedAt?: string
}

