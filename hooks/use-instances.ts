'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useProductKeysStore } from '@/store/product-keys.store'
import type {
  AdminInstance,
  HubInstanceDto,
  CreateInstanceDto,
  ImportInstanceDto,
  ImportBulkResult,
  SendTestMessageDto,
} from '@/lib/types'

const KEY = 'instances'
const STATUS_ORDER: Record<string, number> = { open: 0, connecting: 1, close: 2, disconnected: 3 }

// Shape retornado pelo GET /admin/products/:productId/instances (Hub wraps Evolution raw):
// {
//   id: "hub-uuid",              ← UUID do Hub — usar em TODAS as chamadas admin
//   instance: {
//     instanceName: "agente-001",
//     id: "evo-uuid",            ← UUID da Evolution (providerInstanceId)
//     owner: "551199...",
//     profileName: "...",
//     profilePictureUrl: "..."
//   },
//   connectionStatus: "open"
// }
function normalizeInstance(item: Record<string, unknown>): AdminInstance {
  const inner = (item.instance && typeof item.instance === 'object')
    ? item.instance as Record<string, unknown>
    : item

  return {
    id: (item.id as string) ?? '',                                       // hub UUID (nível raiz)
    providerInstanceId: (inner.id as string | null) ?? null,             // evo UUID (dentro de instance)
    name: ((inner.instanceName ?? inner.name ?? item.instanceName ?? '') as string),
    connectionStatus: ((item.connectionStatus ?? item.status ?? inner.status ?? 'close') as AdminInstance['connectionStatus']),
    ownerJid: ((inner.owner ?? inner.ownerJid) as string | null) ?? null,
    profileName: (inner.profileName as string | null) ?? null,
    profilePicUrl: ((inner.profilePictureUrl ?? inner.profilePicUrl) as string | null) ?? null,
    integration: ((inner.integration ?? item.integration) as string | null) ?? null,
    number: ((inner.number ?? item.number) as string | null) ?? null,
    token: ((inner.token ?? item.token) as string | null) ?? null,
    clientName: ((inner.clientName ?? item.clientName) as string | null) ?? null,
    createdAt: ((item.createdAt ?? inner.createdAt) as string) ?? new Date().toISOString(),
    updatedAt: ((item.updatedAt ?? inner.updatedAt) as string) ?? new Date().toISOString(),
    Setting: (item.Setting as Record<string, unknown> | null) ?? null,
    _count: (item._count as AdminInstance['_count']) ?? undefined,
  }
}

export function useInstanceList(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [KEY, { productId }],
    queryFn: async () => {
      const raw = await api.getInstanceList(token!, productId)
      console.log('[useInstanceList] raw response:', JSON.stringify(raw))

      const rawArray: Record<string, unknown>[] = Array.isArray(raw[0])
        ? (raw as unknown as Record<string, unknown>[][]).flat()
        : (raw as unknown as Record<string, unknown>[])

      const normalized = rawArray.map(normalizeInstance)

      console.log('[useInstanceList] normalized:', JSON.stringify(normalized.map((i) => ({ id: i.id, name: i.name, providerInstanceId: i.providerInstanceId }))))

      return normalized.sort(
        (a, b) =>
          (STATUS_ORDER[a.connectionStatus] ?? 2) - (STATUS_ORDER[b.connectionStatus] ?? 2),
      )
    },
    enabled: !!token && !!productId,
  })
}

// Busca as instâncias do banco do Hub em paralelo com a lista Evolution.
// Constrói um Map para lookup rápido de Hub UUID pelo providerInstanceId ou instanceName.
// Endpoint: GET .../instances/hub — não depende de VPS, retorna sempre o id correto.
export function useHubInstanceMap(productId: string): Map<string, HubInstanceDto> {
  const token = useAuthStore((s) => s.token)
  const { data } = useQuery({
    queryKey: [KEY, 'hub-map', { productId }],
    queryFn: () => api.getHubInstanceList(token!, productId),
    enabled: !!token && !!productId,
    staleTime: 0,
  })

  return useMemo<Map<string, HubInstanceDto>>(() => {
    const map = new Map<string, HubInstanceDto>()
    for (const inst of data ?? []) {
      if (inst.providerInstanceId) map.set(inst.providerInstanceId, inst)
      map.set(inst.instanceName, inst)
      map.set(inst.id, inst)
    }
    return map
  }, [data])
}

export function useInstance(productId: string, instanceId: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [KEY, productId, instanceId],
    queryFn: () => api.getInstance(token!, productId, instanceId),
    enabled: !!token && !!productId && !!instanceId,
  })
}

export function useCreateInstance(productId: string) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateInstanceDto) => api.createInstance(token!, productId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, { productId }] })
      toast.success('Instância criada com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteInstance(productId: string) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (instanceId: string) => api.deleteInstance(token!, productId, instanceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, { productId }] })
      toast.success('Instância deletada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useImportInstance(productId: string) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: ImportInstanceDto) => api.importInstance(token!, productId, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, { productId }] })
      qc.invalidateQueries({ queryKey: [KEY, 'hub-map', { productId }] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useImportInstancesBulk(productId: string) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (): Promise<ImportBulkResult> => api.importInstancesBulk(token!, productId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, { productId }] })
      qc.invalidateQueries({ queryKey: [KEY, 'hub-map', { productId }] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSendPresence(productId: string, instanceId: string) {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (dto: { number: string; presence: string; delay?: number }) =>
      api.sendPresence(token!, productId, instanceId, dto),
  })
}

export function useSendTestMessage(productId: string, instanceId: string) {
  const token = useAuthStore((s) => s.token)
  return useMutation({
    mutationFn: (dto: SendTestMessageDto) =>
      api.sendTestMessage(token!, productId, instanceId, dto),
    onError: () => {},
  })
}
