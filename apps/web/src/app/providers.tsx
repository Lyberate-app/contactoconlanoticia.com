'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Para el frontend público, los datos vienen del server via SSR
            // TanStack Query se usa principalmente para interacciones del cliente
            // (búsqueda, paginación dinámica, etc.)
            staleTime: 30 * 1000, // 30 segundos
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

