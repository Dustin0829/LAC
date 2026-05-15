import { useAuthStore } from '@/lib/stores/authStore'

export function useBrandAuthEnabled(): boolean {
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)
  return Boolean(accessToken && role === 'brand')
}
