import { ReactNode } from 'react'
import { Cpu, MemoryStick, HardDrive, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { HubMetrics } from '@/lib/types'

const CPU_COLOR = '#4f8ef7'
const MEMORY_COLOR = '#61f2a2'
const DISK_COLOR = '#f59e0b'
const DANGER_COLOR = '#ef4444'

function parseGb(value: string): number {
  return parseFloat(value.replace(/[^0-9.]/g, '')) || 0
}

function parsePct(value: string): number {
  return parseFloat(value.replace('%', '').trim()) || 0
}

interface ProgressRowProps {
  icon: ReactNode
  label: ReactNode
  value: number
  color: string
}

function ProgressRow({ icon, label, value, color }: ProgressRowProps) {
  return (
    <div className="flex items-center gap-3 text-sm w-full">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1">
        <div className="flex justify-between mb-1.5">
          <span className="font-medium">{label}</span>
          <span className="font-semibold tabular-nums" style={{ color: value >= 90 ? color : undefined }}>{value.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  )
}

interface HubResourceMetricsProps {
  metrics: HubMetrics | undefined
  isLoading: boolean
}

export function HubResourceMetrics({ metrics, isLoading }: HubResourceMetricsProps) {
  const cpu = metrics?.cpu
  const memory = metrics?.memory
  const primaryDisk = metrics?.disks?.find((d) => d.mount === '/') ?? metrics?.disks?.[0]

  const cpuLoad = cpu ? parseFloat(cpu.load) : 0
  const cpuSubtitle = cpu
    ? [cpu.brand, cpu.cores ? `${cpu.cores} cores` : '', cpu.speed ? `@ ${cpu.speed} GHz` : '']
        .filter(Boolean)
        .join(' · ')
    : ''

  const memTotal = memory ? parseGb(memory.total) : 0
  const memUsed = memory ? parseGb(memory.used) : 0
  const memPct = memTotal > 0 ? (memUsed / memTotal) * 100 : 0
  const memSubtitle = memory ? `${memory.used} / ${memory.total}` : ''

  const diskPct = primaryDisk ? parsePct(primaryDisk.use) : 0
  const diskSubtitle = primaryDisk ? `${primaryDisk.used} / ${primaryDisk.size} (${primaryDisk.mount})` : ''

  const activeCpuColor = cpuLoad >= 90 ? DANGER_COLOR : CPU_COLOR
  const activeMemColor = memPct >= 90 ? DANGER_COLOR : MEMORY_COLOR
  const activeDiskColor = diskPct >= 90 ? DANGER_COLOR : DISK_COLOR

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Resource Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && !metrics ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-9" />
            <Skeleton className="w-full h-9" />
            <Skeleton className="w-full h-9" />
          </div>
        ) : (
          <>
            {cpu && (
              <ProgressRow
                icon={<Cpu className="h-4 w-4" style={{ color: activeCpuColor }} />}
                label={
                  <span className="flex flex-wrap items-center gap-1.5">
                    CPU Usage
                    {cpuSubtitle && (
                      <span className="text-xs text-muted-foreground font-normal">{cpuSubtitle}</span>
                    )}
                  </span>
                }
                value={cpuLoad}
                color={activeCpuColor}
              />
            )}

            {memory && (
              <ProgressRow
                icon={<MemoryStick className="h-4 w-4" style={{ color: activeMemColor }} />}
                label={
                  <span className="flex flex-wrap items-center gap-1.5">
                    Memory Usage
                    {memSubtitle && (
                      <span className="text-xs text-muted-foreground font-normal">{memSubtitle}</span>
                    )}
                  </span>
                }
                value={memPct}
                color={activeMemColor}
              />
            )}

            {primaryDisk && (
              <ProgressRow
                icon={<HardDrive className="h-4 w-4" style={{ color: activeDiskColor }} />}
                label={
                  <span className="flex flex-wrap items-center gap-1.5">
                    Disk Usage
                    {diskSubtitle && (
                      <span className="text-xs text-muted-foreground font-normal">{diskSubtitle}</span>
                    )}
                  </span>
                }
                value={diskPct}
                color={activeDiskColor}
              />
            )}

            {!cpu && !memory && !primaryDisk && (
              <p className="text-xs text-muted-foreground italic">
                Métricas detalhadas não disponíveis.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

