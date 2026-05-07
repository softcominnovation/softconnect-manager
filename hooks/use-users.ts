import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { CreateAdminUserDto, UpdateAdminUserDto } from '@/lib/types'

const KEY = 'users'

export function useAdminUsers() {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: [KEY],
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
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Usuário criado com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateAdminUser() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAdminUserDto }) =>
      api.updateAdminUser(token, id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Usuário atualizado com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteAdminUser() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteAdminUser(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] })
      toast.success('Usuário removido com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
