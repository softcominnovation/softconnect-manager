'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, AlertTriangle, Search, Server, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProductList } from '@/hooks/use-products'
import { useVpsList } from '@/hooks/use-vps'
import type { Product } from '@/lib/types'

function ProductCard({
  product,
  vpsLabel,
}: {
  product: Product
  vpsLabel: string | null
}) {
  const router = useRouter()

  return (
    <Card className={`transition-all ${!product.isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-base">{product.name}</CardTitle>
              <Badge variant={product.isActive ? 'default' : 'secondary'} className="text-xs">
                {product.isActive ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">{product.slug}</p>
            {vpsLabel && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Server className="h-3 w-3 shrink-0" />
                {vpsLabel}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs shrink-0"
            disabled={!product.isActive}
            onClick={() => router.push(`/instances/${product.id}`)}
          >
            Ver instancias
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  )
}

export default function InstancesPage() {
  const router = useRouter()
  const { data: products, isLoading: productsLoading } = useProductList()
  const { data: vpsList } = useVpsList()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredProducts = useMemo(() => {
    const list = products ?? []
    return list.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' ? p.isActive : !p.isActive)
      return matchSearch && matchStatus
    })
  }, [products, search, filterStatus])

  const hasNoActiveProducts =
    !productsLoading && (products ?? []).filter((p) => p.isActive).length === 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Instancias</h1>
          <p className="text-sm text-muted-foreground">
            Selecione um produto para gerenciar suas instancias WhatsApp
          </p>
        </div>
      </div>

      {hasNoActiveProducts && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800/50 dark:bg-yellow-900/10">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-500" />
          <div>
            <p className="font-medium text-yellow-800 dark:text-yellow-400">Nenhum produto ativo</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-500">
              Cadastre pelo menos um produto em{' '}
              <button
                className="underline font-medium"
                onClick={() => router.push('/products')}
              >
                Produtos
              </button>{' '}
              antes de criar instancias.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
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

      {productsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const vps = product.vpsId ? vpsList?.find((v) => v.id === product.vpsId) : null
            return (
              <ProductCard
                key={product.id}
                product={product}
                vpsLabel={vps ? `${vps.label}  ${vps.ip}` : null}
              />
            )
          })}
          {filteredProducts.length === 0 && !productsLoading && (
            <p className="col-span-full text-center text-sm text-muted-foreground py-8">
              Nenhum produto encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
