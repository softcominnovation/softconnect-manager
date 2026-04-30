'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarItemProps {
  href: string
  label: string
  icon: LucideIcon
  collapsed: boolean
}

export function SidebarItem({ href, label, icon: Icon, collapsed }: SidebarItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  const content = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-muted hover:text-foreground',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground'
      )}
    >
      <Icon
        className={cn('h-5 w-5 shrink-0', isActive ? 'text-primary' : '')}
      />
      {!collapsed && <span>{label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return content
}
