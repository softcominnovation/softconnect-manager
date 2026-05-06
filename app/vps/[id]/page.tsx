'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Server, Globe, Cpu, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useVps } from '@/hooks/use-vps'

export default function VpsDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data: vps, isLoading, error } = useVps(params.id)

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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provider URL</span>
              <a
                href={vps.providerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                {vps.providerUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Adapter</span>
              <span className="font-medium">{vps.adapterType}</span>
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

      {vps.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Anotações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground">{vps.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

