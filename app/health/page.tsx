'use client'

import { useState, useMemo } from 'react'
import { HeartPulse, RefreshCw, Server, Cpu, MemoryStick, HardDrive, WifiOff, CheckCircle2, Clock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useHealth, useHubMetrics } from '@/hooks/use-health'
import { HubResourceMetrics } from '@/components/health/hub-resource-metrics'
import { HubCpuCores } from '@/components/health/hub-cpu-cores'
import type { VpsHealthStatus, SystemMetrics } from '@/lib/types'

function MetricBar({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const color =
    value >= 90 ? 'bg-destructive' : value >= 70 ? 'bg-yellow-500' : 'bg-[#61f2a2]'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium tabular-nums">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function SystemMetricsSection({ metrics }: { metrics: SystemMetrics }) {
  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <MetricBar
        label="CPU"
        value={metrics.cpu.usagePercent}
        icon={<Cpu className="h-3 w-3" />}
      />
      <MetricBar
        label="Memória"
        value={metrics.memory.usagePercent}
        icon={<MemoryStick className="h-3 w-3" />}
      />
      <MetricBar
        label="Disco"
        value={metrics.disk.usagePercent}
        icon={<HardDrive className="h-3 w-3" />}
      />
      <p className="text-[10px] text-muted-foreground/60 pt-1">
        Coletado em {new Date(metrics.collectedAt).toLocaleTimeString('pt-BR')}
      </p>
    </div>
  )
}

function VpsHealthCard({ item }: { item: VpsHealthStatus }) {
  return (
    <Card className={item.isHealthy ? '' : 'border-destructive/40'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{item.vpsName}</span>
          </CardTitle>
          <Badge variant={item.isHealthy ? 'success' : 'destructive'}>
            {item.isHealthy ? 'Saudável' : 'Com erro'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {item.lastChecked ? (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">
              Último check: {new Date(item.lastChecked).toLocaleString('pt-BR')}
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Nenhum check realizado ainda.</p>
        )}

        {!item.isHealthy && item.errorMessage && (
          <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5">
            {item.errorMessage}
          </p>
        )}

        {item.isHealthy && !item.systemMetrics && (
          <p className="text-xs text-muted-foreground italic">Métricas de sistema não configuradas.</p>
        )}

        {item.systemMetrics && <SystemMetricsSection metrics={item.systemMetrics} />}
      </CardContent>
    </Card>
  )
}

export default function HealthPage() {
  const { data: healthList, isLoading: loadingHealth, dataUpdatedAt, refetch, isFetching } = useHealth()
  const { data: hubMetrics, isLoading: loadingHub } = useHubMetrics()

  const [filterVps, setFilterVps] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  const vpsOptions = useMemo(() => healthList?.map((h) => ({ id: h.vpsId, label: h.vpsName })) ?? [], [healthList])

  const filtered = useMemo(() => {
    return (healthList ?? []).filter((h) => {
      const matchVps = filterVps === 'all' || h.vpsId === filterVps
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'healthy' ? h.isHealthy : !h.isHealthy)
      return matchVps && matchStatus
    })
  }, [healthList, filterVps, filterStatus])

  const lastRefresh = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR') : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <HeartPulse className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saúde das VPS</h1>
            <p className="text-sm text-muted-foreground">Monitoramento em tempo real · auto-refresh 30s</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Atualizado às {lastRefresh}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

            {/* Métricas do Hub */}
      {(loadingHub || hubMetrics) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />
              Métricas do Hub
            </h2>
            {!loadingHub && hubMetrics && (
              <Badge variant={hubMetrics.available ? 'success' : 'destructive'}>
                {hubMetrics.available ? (
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Online</span>
                ) : (
                  <span className="flex items-center gap-1"><WifiOff className="h-3 w-3" /> Offline</span>
                )}
              </Badge>
            )}
          </div>

          {loadingHub ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><Skeleton className="h-5 w-36" /></CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><Skeleton className="h-5 w-28" /></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                    <Skeleton className="h-14" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : hubMetrics?.available ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <HubResourceMetrics metrics={hubMetrics} isLoading={false} />
              <HubCpuCores metrics={hubMetrics} isLoading={false} />
            </div>
          ) : (
            <Card className="border-destructive/40">
              <CardContent className="py-6 flex items-center gap-2 text-muted-foreground text-sm">
                <WifiOff className="h-4 w-4 text-destructive" />
                Monitor offline — métricas indisponíveis.
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <div className='w-full h-px bg-[hsl(0_0%_14.9%)]'></div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={filterVps} onValueChange={setFilterVps}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="VPS" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as VPS</SelectItem>
            {vpsOptions.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Saúde" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="healthy">Saudável</SelectItem>
            <SelectItem value="unhealthy">Com erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de VPS */}
      {loadingHealth ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {filterVps !== 'all' || filterStatus !== 'all' ? (
            <>
              <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhuma VPS encontrada para os filtros aplicados.</p>
            </>
          ) : (
            <>
              <HeartPulse className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Nenhum dado de saúde disponível.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <VpsHealthCard key={item.vpsId} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
