import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { CreateAdminUserDto, UpdateAdminUserDto } from '@/lib/types'

export function useAdminUsers() {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.getAdminUsers(token),
    enabled: !!token,
  })
}

export function useCreateAdminUser() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateAdminUserDto) => api.createAdminUser(token, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useUpdateAdminUser() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAdminUserDto }) =>
      api.updateAdminUser(token, id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeactivateAdminUser() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deactivateAdminUser(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
