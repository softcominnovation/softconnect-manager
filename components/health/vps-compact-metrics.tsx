import { Cpu, MemoryStick, HardDrive, WifiOff } from 'lucide-react'
import type { VpsSystemMetrics } from '@/lib/types'

function parseGb(value: string): number {
  return parseFloat(value.replace(/[^0-9.]/g, '')) || 0
}

function parsePct(value: string): number {
  return parseFloat(value.replace('%', '').trim()) || 0
}

function MiniBar({
  icon,
  label,
  pct,
  color,
}: {
  icon: React.ReactNode
  label: string
  pct: number
  color: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-medium tabular-nums">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

function barColor(pct: number): string {
  if (pct >= 90) return 'bg-destructive'
  if (pct >= 70) return 'bg-yellow-500'
  return 'bg-[#61f2a2]'
}

interface VpsCompactMetricsProps {
  metrics: VpsSystemMetrics | null | undefined
}

export function VpsCompactMetrics({ metrics }: VpsCompactMetricsProps) {
  const fixedHeight = 'mt-3 border-t border-border pt-3 h-[88px]'

  if (!metrics) {
    return (
      <div className={`${fixedHeight} flex items-center justify-center gap-2 text-muted-foreground`}>
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[11px]">Métricas não configuradas</span>
      </div>
    )
  }

  const cpuLoad = metrics.cpu ? parseFloat(metrics.cpu.load) : null

  const memTotal = metrics.memory ? parseGb(metrics.memory.total) : 0
  const memUsed = metrics.memory ? parseGb(metrics.memory.used) : 0
  const memPct = memTotal > 0 ? (memUsed / memTotal) * 100 : null

  const primaryDisk = metrics.disks?.find((d) => d.mount === '/') ?? metrics.disks?.[0]
  const diskPct = primaryDisk ? parsePct(primaryDisk.use) : null

  if (cpuLoad === null && memPct === null && diskPct === null) {
    return (
      <div className={`${fixedHeight} flex items-center justify-center gap-2 text-muted-foreground`}>
        <WifiOff className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[11px]">Métricas indisponíveis</span>
      </div>
    )
  }

  return (
    <div className={`${fixedHeight} space-y-2`}>
      {cpuLoad !== null && (
        <MiniBar
          icon={<Cpu className="h-2.5 w-2.5" />}
          label="CPU"
          pct={cpuLoad}
          color={barColor(cpuLoad)}
        />
      )}
      {memPct !== null && (
        <MiniBar
          icon={<MemoryStick className="h-2.5 w-2.5" />}
          label="Mem"
          pct={memPct}
          color={barColor(memPct)}
        />
      )}
      {diskPct !== null && (
        <MiniBar
          icon={<HardDrive className="h-2.5 w-2.5" />}
          label="Disco"
          pct={diskPct}
          color={barColor(diskPct)}
        />
      )}
    </div>
  )
}
