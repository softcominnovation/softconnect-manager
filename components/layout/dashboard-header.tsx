'use client'

import { usePathname } from 'next/navigation'

const ROUTE_LABELS: Record<string, string> = {
  // '/dashboard': 'Visão Geral',
  '/vps': 'VPS',
  '/products': 'Produtos',
  '/instances': 'Instâncias',
  '/health': 'Saúde das VPS',
  '/users': 'Usuários Admin',
  '/logs': 'Logs de Auditoria',
}

function resolveTitle(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  const base = '/' + pathname.split('/')[1]
  return ROUTE_LABELS[base] ?? 'Softconnect Manager'
}

export function DashboardHeader() {
  const pathname = usePathname()
  const title = resolveTitle(pathname)

  return (
    <header className="flex h-14 items-center border-b border-border bg-card px-4 md:hidden">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
    </header>
  )
}
