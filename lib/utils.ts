import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = Date.now()
  const target = new Date(date).getTime()
  const diffMs = now - target
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'agora'
  if (diffMin < 60) return `há ${diffMin} min`
  if (diffHour < 24) return `há ${diffHour}h`
  return `há ${diffDay} dias`
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 4)}${'•'.repeat(key.length - 8)}${key.slice(-4)}`
}
