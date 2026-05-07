'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLogs } from '@/hooks/use-logs'
import { useProductList } from '@/hooks/use-products'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { LogFilters } from '@/lib/types'

const HTTP_STATUS_OPTIONS = [
  { value: '2xx', label: '2xx — Sucesso' },
  { value: '3xx', label: '3xx — Redirecionamento' },
  { value: '4xx', label: '4xx — Erro do cliente' },
  { value: '5xx', label: '5xx — Erro do servidor' },
]

const LIMIT_OPTIONS = ['10', '25', '50']

function statusBadgeVariant(code: number): 'default' | 'secondary' | 'destructive' {
  if (code >= 200 && code < 300) return 'default'
  if (code >= 400) return 'destructive'
  return 'secondary'
}

function methodBadgeColor(method: string): string {
  const map: Record<string, string> = {
    GET: 'bg-blue-500/20 text-blue-400',
    POST: 'bg-green-500/20 text-green-400',
    PUT: 'bg-yellow-500/20 text-yellow-400',
    PATCH: 'bg-orange-500/20 text-orange-400',
    DELETE: 'bg-red-500/20 text-red-400',
  }
  return map[method] ?? 'bg-muted text-muted-foreground'
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function cleanFilters(raw: Record<string, string | undefined>): LogFilters {
  const result: LogFilters = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v && v !== 'undefined' && v !== 'all') {
      (result as Record<string, string>)[k] = v
    }
  }
  return result
}

export default function LogsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const limit = searchParams.get('limit') ?? '25'
  const page = searchParams.get('page') ?? '1'

  const filters: LogFilters = cleanFilters({
    productId: searchParams.get('productId') ?? undefined,
    instanceId: searchParams.get('instanceId') ?? undefined,
    statusCode: searchParams.get('statusCode') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    page,
    limit,
  })

  const { data, isLoading } = useLogs(filters)
  const { data: productsData } = useProductList()

  const allItems = data?.data ?? []
  const serverTotal = data?.total
  const serverTotalPages = data?.totalPages

  const currentPage = Number(page)
  const limitNum = Number(limit)

  const totalItems = serverTotal ?? allItems.length
  const totalPages = serverTotalPages ?? Math.max(1, Math.ceil(totalItems / limitNum))

  const pagedItems = serverTotal !== undefined
    ? allItems
    : allItems.slice((currentPage - 1) * limitNum, currentPage * limitNum)

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all' && value !== 'undefined') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.set('page', '1')
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const setPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(p))
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Logs</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          value={searchParams.get('productId') ?? 'all'}
          onValueChange={(v) => setParam('productId', v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os produtos</SelectItem>
            {productsData?.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Instância"
          defaultValue={searchParams.get('instanceId') ?? ''}
          className="w-44"
          onBlur={(e) => setParam('instanceId', e.target.value || undefined)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('instanceId', (e.target as HTMLInputElement).value || undefined)
          }}
        />

        <Select
          value={searchParams.get('statusCode') ?? 'all'}
          onValueChange={(v) => setParam('statusCode', v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status HTTP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {HTTP_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="datetime-local"
          className="w-52"
          value={searchParams.get('from') ?? ''}
          onChange={(e) => setParam('from', e.target.value || undefined)}
        />

        <Input
          type="datetime-local"
          className="w-52"
          value={searchParams.get('to') ?? ''}
          onChange={(e) => setParam('to', e.target.value || undefined)}
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Timestamp</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Instância</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Latência (ms)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: limitNum }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !pagedItems.length ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  Nenhum log encontrado.
                </TableCell>
              </TableRow>
            ) : (
              pagedItems.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {formatTimestamp(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.productId ?? '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.instanceId ?? '—'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${methodBadgeColor(log.method)}`}
                    >
                      {log.method}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono text-xs max-w-xs truncate" title={log.endpoint}>
                    {log.endpoint}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(log.statusCode)}>
                      {log.statusCode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {log.latencyMs}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Itens por página:</span>
          <Select
            value={limit}
            onValueChange={(v) => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('limit', v)
              params.set('page', '1')
              router.push(`?${params.toString()}`, { scroll: false })
            }}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
            {` · ${totalItems} registros`}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
