import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { CreateVpsDto, UpdateVpsDto } from '@/lib/types'

export function useVpsList() {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['vps'],
    queryFn: () => api.getVpsList(token),
    enabled: !!token,
  })
}

export function useVps(id: string) {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['vps', id],
    queryFn: () => api.getVps(token, id),
    enabled: !!token && !!id,
  })
}

export function useCreateVps() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateVpsDto) => api.createVps(token, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps'] })
    },
  })
}

export function useUpdateVps() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateVpsDto }) =>
      api.updateVps(token, id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps'] })
    },
  })
}

export function useDeactivateVps() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deactivateVps(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vps'] })
    },
  })
}
