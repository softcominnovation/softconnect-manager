'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEvolutionList } from '@/hooks/use-evolutions'
import { useVpsList } from '@/hooks/use-vps'
import { useProductList } from '@/hooks/use-products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { availabilityText } from '@/lib/evolutions'
import { Panel, Choice, Failure } from '@/components/providers/shared'

function ProvidersCatalog() {
  const params = useSearchParams()
  const [search, setSearch] = useState('')
  const [vpsId, setVpsId] = useState(params.get('vpsId') ?? '')
  const [productId, setProductId] = useState('')
  const [active, setActive] = useState('true')
  const list = useEvolutionList({ search, vpsId, productId, isActive: active === 'true' })
  const vps = useVpsList()
  const products = useProductList()
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Providers</h1>
          <p className="text-sm text-muted-foreground">
            Instalações Evolution. Um cadastro pode atender vários produtos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline"><Link href="/providers/setup">Preparação do ambiente</Link></Button>
        <Button asChild>
          <Link href="/providers/new">Cadastrar provider</Link>
        </Button>
        </div>
      </div>
      <Panel title="Buscar instalações">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <label htmlFor="provider-search" className="text-sm font-medium">
              Nome ou URL
            </label>
            <Input
              id="provider-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar provider"
            />
          </div>
          <Choice label="VPS" value={vpsId} onChange={(e) => setVpsId(e.target.value)}>
            <option value="">Todas as VPS</option>
            {vps.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Choice>
          <Choice label="Produto" value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">Todos os produtos</option>
            {products.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Choice>
          <Choice label="Estado" value={active} onChange={(e) => setActive(e.target.value)}>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </Choice>
        </div>
      </Panel>
      <Failure
        error={list.error || vps.error || products.error}
        onReload={() => {
          void list.refetch()
          void vps.refetch()
          void products.refetch()
        }}
      />
      {list.isLoading && <p role="status">Carregando providers…</p>}
      {list.data?.length === 0 && (
        <p className="rounded-md border p-6 text-muted-foreground">
          Nenhum provider encontrado para estes filtros.
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {list.data?.map((item) => (
          <Panel key={item.id} title={item.label}>
            <p className="break-all text-sm text-muted-foreground">{item.providerUrl}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{item.isActive ? 'Ativo' : 'Inativo'}</Badge>
              <Badge variant="secondary">{item.links.length} produto(s)</Badge>
            </div>
            <p className="text-sm">{availabilityText(item.occupancy)}</p>
            <p className="text-sm text-muted-foreground">
              {item.occupancy.instances} instâncias · {item.occupancy.reservations} reservas
              {!item.inventory.fresh ? ' · Inventário sem confirmação recente' : ''}
            </p>
            <Button asChild variant="outline">
              <Link href={`/providers/${item.id}`}>Gerenciar {item.label}</Link>
            </Button>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export default function ProvidersPage() {
  return (
    <Suspense fallback={<p role="status">Carregando providers…</p>}>
      <ProvidersCatalog />
    </Suspense>
  )
}
