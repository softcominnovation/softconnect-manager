'use client'

import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useProductKeysStore } from '@/store/product-keys.store'
import { useWebhookConfigsStore } from '@/store/webhook-configs.store'
import { useInstanceDefaultsStore } from '@/store/instance-defaults.store'
import type { 
  CreateProductDto, 
  UpdateProductDto, 
  ProductWithApiKey, 
  WebhookConfig, 
  SyncRelayDto,
  InstanceDefaultWebhook,
  InstanceDefaultProxy
} from '@/lib/types'

const KEY = 'products'

export function useProductList() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.getProductList(token!),
    enabled: !!token,
  })
}

export function useProduct(id: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.getProduct(token!, id),
    enabled: !!token && !!id,
  })
}

export function useCreateProduct() {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  const setProductKey = useProductKeysStore((s) => s.setProductKey)
  return useMutation({
    mutationFn: (dto: CreateProductDto) => api.createProduct(token!, dto),
    onSuccess: (data: ProductWithApiKey) => {
      qc.invalidateQueries({ queryKey: [KEY] })
      setProductKey(data.id, data.apiKey)
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateProduct(id: string) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateProductDto) => api.updateProduct(token!, id, dto),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Produto atualizado com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeactivateProduct() {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deactivateProduct(token!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Produto desativado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRotateProductKey(id: string) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  const setProductKey = useProductKeysStore((s) => s.setProductKey)
  return useMutation({
    mutationFn: () => api.rotateProductKey(token!, id),
    onSuccess: (data: ProductWithApiKey) => {
      qc.invalidateQueries({ queryKey: [KEY] })
      setProductKey(data.id, data.apiKey)
      toast.success('Nova API Key gerada com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateWebhookConfig(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (dto: WebhookConfig) => api.updateWebhookConfig(token!, productId, dto),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSyncRelay(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (dto?: SyncRelayDto) => api.syncRelay(token!, productId, dto),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useGetWebhookConfig(productId: string) {
  const token = useAuthStore((s) => s.token)
  const setConfig = useWebhookConfigsStore((s) => s.setConfig)
  return useQuery({
    queryKey: ['webhook-config', productId],
    queryFn: async () => {
      try {
        const data = await api.getWebhookConfig(token!, productId)
        if (data) {
          setConfig(productId, {
            url: data.url,
            secret: data.secret,
            events: data.events ?? [],
            byEvents: data.byEvents ?? false,
            base64: data.base64 ?? true,
          })
        }
        return data
      } catch {
        return null
      }
    },
    enabled: !!token && !!productId,
    retry: false,
    staleTime: 0,
  })
}

export function useLoadWebhookConfigs(productIds: string[]) {
  const token = useAuthStore((s) => s.token)
  const setConfig = useWebhookConfigsStore((s) => s.setConfig)
  useQueries({
    queries: productIds.map((productId) => ({
      queryKey: ['webhook-config', productId],
      queryFn: async () => {
        try {
          const data = await api.getWebhookConfig(token!, productId)
          if (data) {
            setConfig(productId, {
              url: data.url,
              secret: data.secret,
              events: data.events ?? [],
              byEvents: data.byEvents ?? false,
              base64: data.base64 ?? true,
            })
          }
          return data
        } catch {
          return null
        }
      },
      enabled: !!token && productIds.length > 0,
      retry: false,
      staleTime: 60_000,
    })),
  })
}

export function useUpdateInstanceDefaultWebhook(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (dto: InstanceDefaultWebhook) => api.updateInstanceDefaultWebhook(token!, productId, dto),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteInstanceDefaultWebhook(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: () => api.deleteInstanceDefaultWebhook(token!, productId),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateInstanceDefaultProxy(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (dto: InstanceDefaultProxy) => api.updateInstanceDefaultProxy(token!, productId, dto),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteInstanceDefaultProxy(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: () => api.deleteInstanceDefaultProxy(token!, productId),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useGetInstanceDefaults(productId: string) {
  const token = useAuthStore((s) => s.token)
  const setWebhookConfig = useInstanceDefaultsStore((s) => s.setWebhookConfig)
  const setProxyConfig = useInstanceDefaultsStore((s) => s.setProxyConfig)
  
  return useQuery({
    queryKey: ['instance-defaults', productId],
    queryFn: async () => {
      try {
        const [webhook, proxy] = await Promise.all([
          api.getInstanceDefaultWebhook(token!, productId).catch(() => null),
          api.getInstanceDefaultProxy(token!, productId).catch(() => null)
        ])
        
        // We only set the store state if it is currently undefined, to not override pending changes
        const store = useInstanceDefaultsStore.getState()
        if (store.getWebhookConfig(productId) === undefined) {
          setWebhookConfig(productId, webhook)
        }
        if (store.getProxyConfig(productId) === undefined) {
          setProxyConfig(productId, proxy)
        }

        return { webhook, proxy }
      } catch {
        return { webhook: null, proxy: null }
      }
    },
    enabled: !!token && !!productId,
    retry: false,
    staleTime: 0,
  })
}
