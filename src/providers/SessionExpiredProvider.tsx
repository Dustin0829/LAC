import type { ReactNode } from 'react'
import { SessionExpiredDialog } from '@/components/auth/SessionExpiredDialog'

export function SessionExpiredProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SessionExpiredDialog />
    </>
  )
}
