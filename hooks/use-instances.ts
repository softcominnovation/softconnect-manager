'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import { useProductKeysStore } from '@/store/product-keys.store'
import type { CreateInstanceDto, SendTestMessageDto } from '@/lib/types'

const KEY = 'instances'

export function useInstanceList(productId: string) {
  const token = useAuthStore((s) => s.token)
  const encryptedKey = useProductKeysStore((s) => s.getEncryptedKey(productId))
  return useQuery({
    queryKey: [KEY, { productId }],
    queryFn: () => api.getInstanceList(token!, encryptedKey!),
    enabled: !!token && !!encryptedKey,
  })
}

export function useInstance(productId: string, instanceId: string) {
  const token = useAuthStore((s) => s.token)
  const encryptedKey = useProductKeysStore((s) => s.getEncryptedKey(productId))
  return useQuery({
    queryKey: [KEY, instanceId],
    queryFn: () => api.getInstance(token!, encryptedKey!, instanceId),
    enabled: !!token && !!encryptedKey && !!instanceId,
  })
}

export function useInstanceStatus(
  productId: string,
  instanceId: string,
  options?: { refetchInterval?: number | false }
) {
  const token = useAuthStore((s) => s.token)
  const encryptedKey = useProductKeysStore((s) => s.getEncryptedKey(productId))
  return useQuery({
    queryKey: [KEY, instanceId, 'status'],
    queryFn: () => api.getInstanceStatus(token!, encryptedKey!, instanceId),
    enabled: !!token && !!encryptedKey && !!instanceId,
    refetchInterval: options?.refetchInterval,
  })
}

export function useCreateInstance(productId: string) {
  const token = useAuthStore((s) => s.token)
  const encryptedKey = useProductKeysStore((s) => s.getEncryptedKey(productId))
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateInstanceDto) =>
      api.createInstance(token!, encryptedKey!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, { productId }] })
      toast.success('Instância criada com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteInstance(productId: string) {
  const token = useAuthStore((s) => s.token)
  const encryptedKey = useProductKeysStore((s) => s.getEncryptedKey(productId))
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (instanceId: string) =>
      api.deleteInstance(token!, encryptedKey!, instanceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, { productId }] })
      toast.success('Instância deletada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useSendPresence(productId: string, instanceId: string) {
  const token = useAuthStore((s) => s.token)
  const encryptedKey = useProductKeysStore((s) => s.getEncryptedKey(productId))
  return useMutation({
    mutationFn: () => api.sendPresence(token!, encryptedKey!, instanceId),
  })
}

export function useSendTestMessage(productId: string, instanceId: string) {
  const token = useAuthStore((s) => s.token)
  const encryptedKey = useProductKeysStore((s) => s.getEncryptedKey(productId))
  return useMutation({
    mutationFn: (dto: SendTestMessageDto) =>
      api.sendTestMessage(token!, encryptedKey!, instanceId, dto),
    onSuccess: () => toast.success('Mensagem de teste enviada'),
    onError: (err: Error) => toast.error(err.message),
  })
}
