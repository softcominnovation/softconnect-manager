import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { LogFilters } from '@/lib/types'

export function useLogs(filters?: LogFilters) {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['logs', filters],
    queryFn: () => api.getLogs(token, filters),
    enabled: !!token,
  })
}
