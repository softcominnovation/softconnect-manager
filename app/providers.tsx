'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useProductKeysStore } from '@/store/product-keys.store'

function AppInitializer() {
  const loadAuth = useAuthStore((s) => s.loadFromStorage)
  const loadKeys = useProductKeysStore((s) => s.loadFromStorage)
  useEffect(() => {
    loadAuth()
    loadKeys()
  }, [loadAuth, loadKeys])
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
      <AppInitializer />
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
