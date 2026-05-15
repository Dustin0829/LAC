import api from '@/api/client'
import type { AuthSignOutData } from '@/api/types/auth.types'

export async function postAuthSignOut(): Promise<AuthSignOutData> {
  const res = await api.post<AuthSignOutData>('/auth/sign-out')
  return res.data
}
