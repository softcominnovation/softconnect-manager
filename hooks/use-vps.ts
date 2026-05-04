'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { CreateVpsDto, UpdateVpsDto } from '@/lib/types'

const KEY = 'vps'

export function useVpsList() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.getVpsList(token!),
    enabled: !!token,
  })
}

export function useVps(id: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.getVps(token!, id),
    enabled: !!token && !!id,
  })
}

export function useCreateVps() {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVpsDto) => api.createVps(token!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('VPS criada com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateVps(id: string) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateVpsDto) => api.updateVps(token!, id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('VPS atualizada com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeactivateVps() {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deactivateVps(token!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('VPS desativada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
