import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import { registerQueryClient } from '@/lib/queryClientRef'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient())

  useEffect(() => {
    registerQueryClient(client)
  }, [client])

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
