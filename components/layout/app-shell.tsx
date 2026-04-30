'use client'

import { usePathname } from 'next/navigation'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { DashboardHeader } from '@/components/layout/dashboard-header'

const PUBLIC_ROUTES = ['/', '/login']

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isPublic = PUBLIC_ROUTES.includes(pathname)

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <DashboardHeader />
          <div className="flex-1 overflow-y-auto pb-14 md:pb-0">
            {children}
          </div>
          <MobileNav />
        </main>
      </div>
    </ProtectedRoute>
  )
}
