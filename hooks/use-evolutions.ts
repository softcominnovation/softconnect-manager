'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { evolutionsApi } from '@/lib/evolutions-api'
import { api } from '@/lib/api'
import type { Evolution, EvolutionFilters } from '@/lib/evolutions'
import { changePollInterval } from '@/lib/evolution-changes'

export const evolutionQueryRoots = [
  'evolution-setup',
  'evolution-changes',
  'evolution-change',
  'evolution-removal',
  'evolutions',
  'evolution-credential',
  'product-evolutions',
  'allocation',
  'instance-placements',
  'import-candidates',
  'vps',
  'vps-providers',
  'products',
] as const

export function useEvolutionSetup() {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['evolution-setup', userId],
    queryFn: () => evolutionsApi.setup(token!),
    enabled: !!token,
    retry: false,
    gcTime: 0,
  })
}
export function useEvolutionChanges(productId: string, enabled: boolean) {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['evolution-changes', userId, productId],
    queryFn: () => evolutionsApi.changes(token!, productId),
    enabled: !!token && enabled,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
}
export function useEvolutionChange(productId: string, id: string) {
  const token = useAuthStore((s) => s.token)
  const userId = useAuthStore((s) => s.user?.id)
  return useQuery({
    queryKey: ['evolution-change', userId, productId, id],
    queryFn: () => evolutionsApi.change(token!, productId, id),
    enabled: !!token && !!id,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => (query.state.error ? false : changePollInterval(query.state.data)),
  })
}

export function useEvolutionList(filters: EvolutionFilters = {}) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['evolutions', 'list', filters],
    queryFn: () => evolutionsApi.list(token!, filters),
    enabled: !!token,
  })
}
export function useEvolution(id: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['evolutions', 'detail', id],
    queryFn: () => evolutionsApi.get(token!, id),
    enabled: !!token && !!id,
  })
}
export function useEvolutionCredential(provider: Evolution) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [
      'evolution-credential',
      provider.id,
      provider.vpsId,
      provider.configurationRevision,
      provider.isActive,
    ],
    queryFn: async () => {
      if (!provider.isActive) return null
      const providers = await api.getVpsProviders(token!, provider.vpsId)
      return providers.find((item) => item.id === provider.id)?.providerApiKey ?? null
    },
    enabled: !!token,
    retry: false,
    gcTime: 0,
  })
}
export function useProductEvolutions(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['product-evolutions', productId],
    queryFn: () => evolutionsApi.links(token!, productId),
    enabled: !!token && !!productId,
  })
}
export function useAllocation(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['allocation', productId],
    queryFn: () => evolutionsApi.allocation(token!, productId),
    enabled: !!token && !!productId,
  })
}
export function useInstancePlacements(productId: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['instance-placements', productId],
    queryFn: () => evolutionsApi.placements(token!, productId),
    enabled: !!token && !!productId,
  })
}
export function useImportCandidates(productId: string, providerId: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['import-candidates', productId, providerId],
    queryFn: () => evolutionsApi.candidates(token!, productId, providerId),
    enabled: !!token && !!providerId && !!productId,
  })
}
export function useEvolutionMutation<T, R>(mutation: (token: string, input: T) => Promise<R>) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: T) => mutation(token!, input),
    retry: false,
    onError: async (error: Error) => {
      if ((error as Error & { status?: number }).status === 409) {
        await Promise.all(
          evolutionQueryRoots.map((key) => qc.invalidateQueries({ queryKey: [key] }))
        )
      }
    },
    onSuccess: async () => {
      await Promise.all(evolutionQueryRoots.map((key) => qc.invalidateQueries({ queryKey: [key] })))
    },
  })
}
