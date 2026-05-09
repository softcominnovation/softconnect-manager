'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Server, Globe, Cpu, ExternalLink, Activity, RefreshCw, CheckCircle2, WifiOff, Clock, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useVps, useUpdateVps } from '@/hooks/use-vps'
import { useVpsHealth } from '@/hooks/use-health'
import { HubResourceMetrics } from '@/components/health/hub-resource-metrics'
import { HubCpuCores } from '@/components/health/hub-cpu-cores'
import type { HubMetrics, VpsSystemMetrics } from '@/lib/types'

function vpsHealthToHubMetrics(systemMetrics: VpsSystemMetrics | null | undefined): HubMetrics | undefined {
  if (!systemMetrics) return undefined
  return {
    available: true,
    cpu: systemMetrics.cpu
      ? { ...systemMetrics.cpu, cores: systemMetrics.cpu.cores ?? 0 }
      : undefined,
    memory: systemMetrics.memory
      ? { ...systemMetrics.memory, cached: systemMetrics.memory.cached ?? '' }
      : undefined,
    disks: systemMetrics.disks,
    collectedAt: systemMetrics.collectedAt,
  }
}

export default function VpsDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: vps, isLoading, error } = useVps(params.id)
  const { data: vpsHealth, isLoading: loadingHealth, isFetching: fetchingHealth } = useVpsHealth(params.id)
  const updateVps = useUpdateVps(params.id)

  const [notesOpen, setNotesOpen] = useState(false)
  const [notesValue, setNotesValue] = useState('')

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  if (error || !vps) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <p className="text-destructive">VPS não encontrada.</p>
      </div>
    )
  }

  const hubMetrics = vpsHealthToHubMetrics(vpsHealth?.systemMetrics)
  const providers = vpsHealth?.providers ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/vps')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">{vps.label}</h1>
            <p className="text-sm text-muted-foreground">{vps.subdomain}</p>
          </div>
        </div>
        <Badge variant={vps.isActive ? 'success' : 'secondary'} className="ml-auto">
          {vps.isActive ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {/* Painel de Saúde */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Monitor de Saúde
            <span className="text-xs font-normal text-muted-foreground">· auto-refresh 10s</span>
          </h2>
          <div className="flex items-center gap-3">
          {vpsHealth && (
              <Badge variant={vpsHealth.isHealthy ? 'success' : 'destructive'}>
                {vpsHealth.isHealthy ? (
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Saudável</span>
                ) : (
                  <span className="flex items-center gap-1"><WifiOff className="h-3 w-3" /> Com erro</span>
                )}
              </Badge>
            )}
            {fetchingHealth && <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
          </div>
        </div>

        {loadingHealth ? (
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
                </div>
              </CardContent>
            </Card>
          </div>
        ) : vpsHealth && providers.length > 0 ? (
          <>
            <div className="space-y-1.5">
              {providers.map((prov) => (
                <div key={prov.providerId} className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground rounded border border-border px-3 py-2">
                  <span className="font-medium text-foreground">{prov.label}</span>
                  {prov.lastCheck?.checkedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(prov.lastCheck.checkedAt).toLocaleString('pt-BR')}
                    </span>
                  )}
                  {prov.lastCheck?.responseMs != null && (
                    <span>
                      Resposta: <span className="font-medium text-foreground">{prov.lastCheck.responseMs} ms</span>
                    </span>
                  )}
                  {!prov.isHealthy && prov.lastCheck?.errorMsg && (
                    <span className="text-destructive">{prov.lastCheck.errorMsg}</span>
                  )}
                  <Badge variant={prov.isHealthy ? 'success' : 'destructive'} className="ml-auto text-[10px] px-1.5 py-0">
                    {prov.isHealthy ? 'OK' : 'Erro'}
                  </Badge>
                </div>
              ))}
            </div>

            {hubMetrics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <HubResourceMetrics metrics={hubMetrics} isLoading={false} />
                <HubCpuCores metrics={hubMetrics} isLoading={false} />
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-5 flex items-center gap-2 text-muted-foreground text-sm">
                  <WifiOff className="h-4 w-4 shrink-0" />
                  Monitor não configurado — sem métricas de sistema disponíveis.
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-5 flex items-center gap-2 text-muted-foreground text-sm">
              <WifiOff className="h-4 w-4 shrink-0" />
              Dados de saúde indisponíveis para esta VPS.
            </CardContent>
          </Card>
        )}
      </div>

      <div className="w-full h-px bg-[hsl(0_0%_14.9%)]" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-primary" />
              Informações de Rede
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">IP</span>
              <span className="font-mono font-medium">{vps.ip}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subdomínio</span>
              <span className="font-medium">{vps.subdomain}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-primary" />
              Gerenciamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Manager Type</span>
              <span className="font-medium">{vps.managerType ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Manager URL</span>
              {vps.managerUrl ? (
                <a
                  href={vps.managerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Abrir
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Monitor URL</span>
              {vps.monitorUrl ? (
                <a
                  href={vps.monitorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Abrir
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Criado em</span>
              <span className="font-medium">
                {new Date(vps.createdAt).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push(`/instances?vpsId=${vps.id}`)}>
          Ver instâncias vinculadas
        </Button>
      </div>

      {vps.notes !== undefined && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Anotações</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setNotesValue(vps.notes ?? '')
                setNotesOpen(true)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          </CardHeader>
          <CardContent>
            {vps.notes ? (
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{vps.notes}</p>
            ) : (
              <p className="text-sm italic text-muted-foreground/60">Nenhuma anotação cadastrada.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Anotações — {vps.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label htmlFor="notes-edit">Anotações</Label>
            <Textarea
              id="notes-edit"
              rows={8}
              className="resize-y"
              placeholder="Observações internas sobre esta VPS…"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesOpen(false)}>Cancelar</Button>
            <Button
              disabled={updateVps.isPending}
              onClick={async () => {
                await updateVps.mutateAsync({ notes: notesValue })
                setNotesOpen(false)
              }}
            >
              {updateVps.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
