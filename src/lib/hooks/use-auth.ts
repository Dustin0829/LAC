import { useAuthStore } from '@/lib/stores/authStore'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const loading = useAuthStore((s) => s.loading)
  const accessToken = useAuthStore((s) => s.accessToken)

  const isAuthenticated = Boolean(user)
  const hasRole = role === 'creator' || role === 'brand'

  return {
    user,
    role,
    loading,
    accessToken,
    isAuthenticated,
    hasRole,
    isCreator: role === 'creator',
    isBrand: role === 'brand',
  }
}
