import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { CreateProductDto, UpdateProductDto } from '@/lib/types'

export function useProductList() {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.getProductList(token),
    enabled: !!token,
  })
}

export function useProduct(id: string) {
  const token = useAuthStore((s) => s.token)!
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => api.getProduct(token, id),
    enabled: !!token && !!id,
  })
}

export function useCreateProduct() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProductDto) => api.createProduct(token, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) =>
      api.updateProduct(token, id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useDeactivateProduct() {
  const token = useAuthStore((s) => s.token)!
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deactivateProduct(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
