'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'
import type { CreateProductDto, UpdateProductDto } from '@/lib/types'

const KEY = 'products'

export function useProductList() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.getProductList(token!),
    enabled: !!token,
  })
}

export function useProduct(id: string) {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => api.getProduct(token!, id),
    enabled: !!token && !!id,
  })
}

export function useCreateProduct() {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProductDto) => api.createProduct(token!, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateProduct(id: string) {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpdateProductDto) => api.updateProduct(token!, id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Produto atualizado com sucesso')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeactivateProduct() {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deactivateProduct(token!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] })
      toast.success('Produto desativado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
