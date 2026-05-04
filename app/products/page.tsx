'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, PowerOff, Package, ExternalLink, Copy, Check, AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProductList, useCreateProduct, useUpdateProduct, useDeactivateProduct } from '@/hooks/use-products'
import { useVpsList } from '@/hooks/use-vps'
import { createProductSchema, updateProductSchema, type CreateProductFormData, type UpdateProductFormData } from '@/lib/schemas/product.schema'
import type { Product, ProductWithApiKey } from '@/lib/types'

function ProductFormFields({
  register,
  errors,
  setValue,
  watchVpsId,
  vpsList,
}: {
  register: ReturnType<typeof useForm<CreateProductFormData>>['register']
  errors: ReturnType<typeof useForm<CreateProductFormData>>['formState']['errors']
  setValue: ReturnType<typeof useForm<CreateProductFormData>>['setValue']
  watchVpsId?: string
  vpsList: { id: string; label: string }[]
}) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" placeholder="Softshop" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" placeholder="softshop" {...register('slug')} />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="vpsId">VPS vinculada</Label>
          <Select
            value={watchVpsId ?? ''}
            onValueChange={(v) => setValue('vpsId', v === 'none' ? '' : v)}
          >
            <SelectTrigger id="vpsId">
              <SelectValue placeholder="Selecione uma VPS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {vpsList.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vpsId && <p className="text-xs text-destructive">{errors.vpsId.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adapterType">Adapter Type</Label>
          <Input id="adapterType" placeholder="evolution" {...register('adapterType')} />
        </div>
      </div>
    </div>
  )
}

function ApiKeyModal({
  product,
  onClose,
}: {
  product: ProductWithApiKey
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(product.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Produto criado — API Key gerada</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Esta é a <strong>única vez</strong> que esta API Key será exibida. Copie agora e
              guarde em local seguro — não é possível recuperá-la depois.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>API Key</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={product.apiKey} className="font-mono text-xs" />
              <Button size="icon" variant="outline" onClick={copy} type="button">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Produto: <span className="font-medium text-foreground">{product.name}</span> —
            Slug: <span className="font-medium text-foreground">{product.slug}</span>
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Entendi, já copiei</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditProductDialog({
  product,
  vpsList,
  onClose,
}: {
  product: Product
  vpsList: { id: string; label: string }[]
  onClose: () => void
}) {
  const update = useUpdateProduct(product.id)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProductFormData>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      name: product.name,
      slug: product.slug,
      vpsId: product.vpsId ?? '',
      adapterType: product.adapterType,
    },
  })
  const watchVpsId = watch('vpsId')

  function onSubmit(data: UpdateProductFormData) {
    const dto = { ...data, vpsId: data.vpsId || undefined }
    update.mutate(dto, { onSuccess: onClose })
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ProductFormFields
            register={register as unknown as ReturnType<typeof useForm<CreateProductFormData>>['register']}
            errors={errors as ReturnType<typeof useForm<CreateProductFormData>>['formState']['errors']}
            setValue={setValue as unknown as ReturnType<typeof useForm<CreateProductFormData>>['setValue']}
            watchVpsId={watchVpsId ?? ''}
            vpsList={vpsList}
          />
          <DialogFooter className="pt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || update.isPending}>
              {update.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProductsPage() {
  const router = useRouter()
  const { data: products, isLoading } = useProductList()
  const { data: vpsList } = useVpsList()
  const createProduct = useCreateProduct()
  const deactivate = useDeactivateProduct()

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Product | null>(null)
  const [newProduct, setNewProduct] = useState<ProductWithApiKey | null>(null)

  const [search, setSearch] = useState('')
  const [filterVps, setFilterVps] = useState('all')
  const [filterAdapter, setFilterAdapter] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const adapterOptions = useMemo(() => {
    const seen = new Set<string>()
    for (const p of products ?? []) if (p.adapterType) seen.add(p.adapterType)
    return Array.from(seen)
  }, [products])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (products ?? []).filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      const matchVps = filterVps === 'all' || p.vpsId === filterVps
      const matchAdapter = filterAdapter === 'all' || p.adapterType === filterAdapter
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' ? p.isActive : !p.isActive)
      return matchSearch && matchVps && matchAdapter && matchStatus
    })
  }, [products, search, filterVps, filterAdapter, filterStatus])

  const activeVpsList = vpsList?.filter((v) => v.isActive) ?? []
  const hasActiveVps = activeVpsList.length > 0

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductFormData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: { name: '', slug: '', vpsId: '', adapterType: 'evolution' },
  })
  const watchVpsId = watch('vpsId')

  function onCreateSubmit(data: CreateProductFormData) {
    const dto = { ...data, vpsId: data.vpsId || undefined, adapterType: data.adapterType || 'evolution' }
    createProduct.mutate(dto, {
      onSuccess: (created) => {
        setCreateOpen(false)
        reset()
        setNewProduct(created)
      },
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os produtos do hub</p>
        </div>
        <div className="relative group">
          <Button
            disabled={!hasActiveVps}
            onClick={() => setCreateOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
          {!hasActiveVps && (
            <span className="absolute bottom-full mb-2 right-0 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Cadastre uma VPS ativa primeiro
            </span>
          )}
        </div>
      </div>

      {!hasActiveVps && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>
            Nenhuma VPS ativa encontrada. Você precisa{' '}
            <button
              onClick={() => router.push('/vps')}
              className="underline underline-offset-2 font-medium"
            >
              cadastrar uma VPS
            </button>{' '}
            antes de criar produtos.
          </span>
        </div>
      )}

      {/* Barra de filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por nome ou slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterVps} onValueChange={setFilterVps}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="VPS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as VPS</SelectItem>
            {(vpsList ?? []).map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAdapter} onValueChange={setFilterAdapter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Adapter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os adapters</SelectItem>
            {adapterOptions.map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">Slug</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">VPS</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Adapter</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))}

              {!isLoading && products?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Package className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                  </td>
                </tr>
              )}

              {!isLoading && products && products.length > 0 && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum produto encontrado para os filtros aplicados.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((p) => {
                  const vps = vpsList?.find((v) => v.id === p.vpsId)
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.slug}</td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                        {vps ? vps.label : <span className="italic">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                        {p.adapterType}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.isActive ? 'default' : 'secondary'}>
                          {p.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => router.push(`/products/${p.id}`)}
                            title="Ver detalhe"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditTarget(p)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {p.isActive && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeactivateTarget(p)}
                              title="Desativar"
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) reset() }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onCreateSubmit)}>
            <ProductFormFields
              register={register}
              errors={errors}
              setValue={setValue}
              watchVpsId={watchVpsId ?? ''}
              vpsList={activeVpsList}
            />
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => { setCreateOpen(false); reset() }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || createProduct.isPending}>
                {createProduct.isPending ? 'Criando…' : 'Criar Produto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {editTarget && (
        <EditProductDialog
          product={editTarget}
          vpsList={activeVpsList}
          onClose={() => setEditTarget(null)}
        />
      )}

      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => { if (!o) setDeactivateTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto <strong>{deactivateTarget?.name}</strong> será desativado. Instâncias vinculadas
              podem parar de funcionar. Esta ação pode ser revertida pelo suporte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deactivateTarget) {
                  deactivate.mutate(deactivateTarget.id, { onSuccess: () => setDeactivateTarget(null) })
                }
              }}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {newProduct && (
        <ApiKeyModal product={newProduct} onClose={() => setNewProduct(null)} />
      )}
    </div>
  )
}

