import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

export function useHealth() {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(token),
    enabled: !!token,
    refetchInterval: 30_000,
  })
}

export function useHubMetrics() {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['health', 'hub-metrics'],
    queryFn: () => api.getHubMetrics(token),
    enabled: !!token,
    refetchInterval: 30_000,
  })
}
