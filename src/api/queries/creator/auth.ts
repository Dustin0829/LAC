import { useAuthStore } from '@/lib/stores/authStore'

export function useCreatorAuthEnabled(): boolean {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  return Boolean(user && role === 'creator')
}
