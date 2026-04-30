'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'

function AuthInitializer() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage)
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])
  return null
}

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
