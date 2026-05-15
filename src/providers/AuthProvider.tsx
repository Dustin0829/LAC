import { useEffect, type ReactNode } from 'react'
import { useAuthStore } from '@/lib/stores/authStore'

export function AuthProvider({ children }: { children: ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return <>{children}</>
}
