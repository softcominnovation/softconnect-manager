import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export function useInstanceList(params?: { vpsId?: string; productId?: string }) {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['instances', params],
    queryFn: () => api.getInstanceList(token, params),
    enabled: !!token,
  })
}

export function useInstance(instanceId: string) {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['instances', instanceId],
    queryFn: () => api.getInstance(token, instanceId),
    enabled: !!token && !!instanceId,
  })
}

export function useDeleteInstance() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (instanceId: string) => api.deleteInstance(token, instanceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
    },
  })
}
