import { useAuthStore } from '@/lib/stores/authStore'

export function useBrandAuthEnabled(): boolean {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  return Boolean(user && role === 'brand')
}
