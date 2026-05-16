import { isProfileOnboardingComplete } from '@/lib/profileOnboarding'
import { useAuthStore } from '@/lib/stores/authStore'

export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const loading = useAuthStore((s) => s.loading)
  const profileOnboardingComplete = useAuthStore((s) => s.profileOnboardingComplete)

  const isAuthenticated = Boolean(user)
  const hasRole = role === 'creator' || role === 'brand'
  const hasCompletedProfileOnboarding =
    hasRole && isProfileOnboardingComplete(user?.id, role)

  return {
    user,
    role,
    loading,
    profileOnboardingComplete,
    isAuthenticated,
    hasRole,
    hasCompletedProfileOnboarding,
    isCreator: role === 'creator',
    isBrand: role === 'brand',
  }
}
