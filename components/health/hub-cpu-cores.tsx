import { Cpu } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { HubMetrics } from '@/lib/types'

function getCoreBarColor(load: number): string {
  if (load >= 80) return 'bg-destructive'
  if (load >= 50) return 'bg-yellow-500'
  return 'bg-[#61f2a2]'
}

interface HubCpuCoresProps {
  metrics: HubMetrics | undefined
  isLoading: boolean
}

export function HubCpuCores({ metrics, isLoading }: HubCpuCoresProps) {
  const coresLoad = metrics?.cpu?.coresLoad

  if (!isLoading && (!coresLoad || coresLoad.length === 0)) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          CPU Cores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && !metrics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {coresLoad!.map((core) => {
              const load = parseFloat(core.load)
              return (
                <div key={core.core} className="bg-muted/50 px-3 py-2.5 rounded-lg">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-muted-foreground">Core {core.core}</span>
                    <span className="text-sm font-semibold tabular-nums">{load.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${getCoreBarColor(load)}`}
                      style={{ width: `${Math.min(load, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
