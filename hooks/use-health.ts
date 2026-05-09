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

export function useProviderHealth(providerId: string) {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['health', 'provider', providerId],
    queryFn: () => api.getProviderHealth(token, providerId),
    enabled: !!token && !!providerId,
    refetchInterval: 10_000,
  })
}

export function useVpsHealth(vpsId: string) {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['health', 'vps', vpsId],
    queryFn: async () => {
      const all = await api.getHealth(token)
      return all.find((h) => h.vpsId === vpsId) ?? null
    },
    enabled: !!token && !!vpsId,
    refetchInterval: 10_000,
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
