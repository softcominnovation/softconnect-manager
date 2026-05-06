'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  HeartPulse,
  Server,
  Package,
  MessageCircle,
  Users,
  ScrollText,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vps', label: 'VPS', icon: Server },
  { href: '/products', label: 'Produtos', icon: Package },
  { href: '/instances', label: 'Instâncias', icon: MessageCircle },
  { href: '/health', label: 'Saúde', icon: HeartPulse },
  { href: '/users', label: 'Usuários', icon: Users },
  { href: '/logs', label: 'Logs', icon: ScrollText },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuthStore()

  function handleLogout() {
    logout()
    router.replace('/login')
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-border bg-card md:hidden">
      <TooltipProvider delayDuration={0}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/health' && pathname.startsWith(item.href))

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 px-2 py-1',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[9px]">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">{item.label}</TooltipContent>
            </Tooltip>
          )
        })}

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-0.5 px-2 py-1 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-[9px]">Sair</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Sair</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </nav>
  )
}
