import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/use-auth'
import { isProfileOnboardingComplete } from '@/lib/profileOnboarding'
import type { UserRole } from '@/lib/stores/authStore'

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-phc-gradient animate-pulse" />
        Loading…
      </div>
    </div>
  )
}

function dashboardForRole(role: UserRole | null) {
  if (role === 'brand') return '/brand/dashboard'
  if (role === 'creator') return '/creator/dashboard'
  return '/onboarding/role'
}

const PROFILE_SETUP_PATH = '/onboarding/profile'

export interface ProtectedRouteProps {
  /** Index `/` — redirect to auth, onboarding, or dashboard. */
  index?: boolean
  /** Guest-only (e.g. `/auth`): show children only when not signed in. */
  guestOnly?: boolean
  /** Require authenticated user but not a role yet (onboarding gate). */
  requireAuth?: boolean
  /** Require authenticated user with a role; profile setup not yet finished. */
  profileSetup?: boolean
  /** Require a specific role. */
  requiredRole?: UserRole
  children?: React.ReactNode
}

export function ProtectedRoute({
  index = false,
  guestOnly = false,
  requireAuth = false,
  profileSetup = false,
  requiredRole,
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, role, loading, user } = useAuth()

  if (loading) return <AuthLoading />

  if (index) {
    if (!isAuthenticated) return <Navigate to="/auth" replace />
    if (!hasRole || !role) return <Navigate to="/onboarding/role" replace />
    if (!isProfileOnboardingComplete(user?.id, role)) {
      return <Navigate to={PROFILE_SETUP_PATH} replace />
    }
    return <Navigate to={dashboardForRole(role)} replace />
  }

  if (guestOnly) {
    if (isAuthenticated && hasRole && role) {
      if (!isProfileOnboardingComplete(user?.id, role)) {
        return <Navigate to={PROFILE_SETUP_PATH} replace />
      }
      return <Navigate to={dashboardForRole(role)} replace />
    }
    if (isAuthenticated && !hasRole) return <Navigate to="/onboarding/role" replace />
    return <>{children}</>
  }

  if (requireAuth) {
    if (!isAuthenticated) return <Navigate to="/auth" replace />
    if (hasRole && role) {
      if (!isProfileOnboardingComplete(user?.id, role)) {
        return <Navigate to={PROFILE_SETUP_PATH} replace />
      }
      return <Navigate to={dashboardForRole(role)} replace />
    }
    return <>{children}</>
  }

  if (profileSetup) {
    if (!isAuthenticated) return <Navigate to="/auth" replace />
    if (!hasRole || !role) return <Navigate to="/onboarding/role" replace />
    if (isProfileOnboardingComplete(user?.id, role)) {
      return <Navigate to={dashboardForRole(role)} replace />
    }
    return <>{children}</>
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (!hasRole || !role) return <Navigate to="/onboarding/role" replace />
  if (!isProfileOnboardingComplete(user?.id, role)) {
    return <Navigate to={PROFILE_SETUP_PATH} replace />
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={dashboardForRole(role)} replace />
  }

  return <>{children}</>
}
