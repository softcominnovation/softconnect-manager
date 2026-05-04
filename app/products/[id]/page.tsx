'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, Server, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useProduct } from '@/hooks/use-products'
import { useVpsList } from '@/hooks/use-vps'

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: product, isLoading, error } = useProduct(params.id)
  const { data: vpsList } = useVpsList()

  const vps = product?.vpsId ? vpsList?.find((v) => v.id === product.vpsId) : null

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <p className="text-destructive">{(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        {isLoading ? (
          <Skeleton className="h-7 w-48" />
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{product?.name}</h1>
            <Badge variant={product?.isActive ? 'default' : 'secondary'}>
              {product?.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Informações do Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
            ) : (
              <>
                <Row label="Nome" value={product?.name} />
                <Row label="Slug" value={<span className="font-mono text-xs">{product?.slug}</span>} />
                <Row label="Adapter" value={product?.adapterType} />
                <Row label="Hub Relay" value={product?.hubRelay ? 'Ativado' : 'Desativado'} />
                <Row
                  label="Criado em"
                  value={product?.createdAt ? new Date(product.createdAt).toLocaleDateString('pt-BR') : '—'}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-primary" />
              Infraestrutura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)
            ) : (
              <>
                <Row
                  label="VPS vinculada"
                  value={vps ? `${vps.label} (${vps.ip})` : <span className="italic text-muted-foreground">Nenhuma</span>}
                />
                {product?.origins && product.origins.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Origens permitidas</span>
                    <div className="flex flex-col gap-1">
                      {product.origins.map((o) => (
                        <span key={o} className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 w-fit">{o}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(!product?.origins || product.origins.length === 0) && (
                  <Row label="Origens permitidas" value={<span className="italic text-muted-foreground">Nenhuma configurada</span>} />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Button
        variant="outline"
        className="gap-2"
        onClick={() => router.push(`/instances?productId=${params.id}`)}
        disabled={isLoading}
      >
        <Layers className="h-4 w-4" />
        Ver instâncias vinculadas
      </Button>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium">{value ?? '—'}</span>
    </div>
  )
}

