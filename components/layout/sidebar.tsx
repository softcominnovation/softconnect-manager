'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  HeartPulse,
  Server,
  Package,
  MessageCircle,
  Users,
  ScrollText,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { SidebarItem } from './sidebar-item'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import Image from 'next/image'

const NAV_SECTIONS = [
  {
    label: 'Dashboard',
    items: [
      // { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
      { href: '/health', label: 'Saúde das VPS', icon: HeartPulse },
    ],
  },
  {
    label: 'Infraestrutura',
    items: [
      { href: '/vps', label: 'VPS', icon: Server },
      { href: '/products', label: 'Produtos', icon: Package },
      { href: '/instances', label: 'Instâncias', icon: MessageCircle },
    ],
  },
  {
    label: 'Administração',
    items: [
      // { href: '/users', label: 'Usuários Admin', icon: Users },
      { href: '/logs', label: 'Logs', icon: ScrollText },
    ],
  },
]

export function Sidebar() {
  const router = useRouter()
  const { logout, user } = useAuthStore()
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-border bg-card transition-all duration-200',
          sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
        )}
      >
        <div
          className={cn(
            'flex h-14 items-center border-b border-border px-3',
            sidebarCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Image src="/favicon.png" alt="Logo" width={24} height={24} className="rounded" />
              <span className="text-sm font-semibold text-foreground">SC Manager</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {NAV_SECTIONS.map((section, i) => (
            <div key={section.label}>
              {!sidebarCollapsed && (
                <p className="mb-1 mt-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              {sidebarCollapsed && i > 0 && (
                <Separator className="my-2" />
              )}
              {section.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-2">
          {!sidebarCollapsed && user && (
            <div className="mb-2 px-3 py-1">
              <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              'w-full text-muted-foreground hover:text-destructive',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-start gap-3 px-3'
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Sair</span>}
          </Button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  )
}
