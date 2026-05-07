import { useAuthStore } from '@/lib/stores/authStore'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const loading = useAuthStore((s) => s.loading)

  const isAuthenticated = Boolean(user)
  const hasRole = role === 'clipper' || role === 'brand'

  return {
    user,
    role,
    loading,
    isAuthenticated,
    hasRole,
    isClipper: role === 'clipper',
    isBrand: role === 'brand',
  }
}
