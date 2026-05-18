import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { VidULoading } from '@/components/VidULoading'
import { authLog } from '@/lib/auth/authLog'
import { isDashboardPath } from '@/lib/auth/postLoginSplash'
import { useAuth } from '@/lib/hooks/use-auth'
import { useAuthStore } from '@/lib/stores/authStore'
import { isProfileOnboardingComplete } from '@/lib/profileOnboarding'
import type { UserRole } from '@/lib/stores/authStore'

function dashboardForRole(role: UserRole | null) {
  if (role === 'brand') return '/brand/dashboard'
  if (role === 'creator') return '/dashboard'
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
  const bootstrapSplash = useAuthStore((s) => s.bootstrapSplash)
  const pendingBootstrapSplash = useAuthStore((s) => s.pendingBootstrapSplash)
  const startBootstrapSplash = useAuthStore((s) => s.startBootstrapSplash)
  const location = useLocation()
  const onDashboardRoute = isDashboardPath(location.pathname)
  const lastRedirectLog = useRef<string | null>(null)

  useEffect(() => {
    if (!requiredRole || !pendingBootstrapSplash) return
    useAuthStore.setState({ pendingBootstrapSplash: false })
    void startBootstrapSplash()
  }, [requiredRole, pendingBootstrapSplash, startBootstrapSplash])

  useEffect(() => {
    if (loading) return
    let redirectTo: string | null = null
    let reason = ''

    if (index) {
      if (!isAuthenticated) {
        redirectTo = '/auth'
        reason = 'index_not_authenticated'
      } else if (!hasRole || !role) {
        redirectTo = '/onboarding/role'
        reason = 'index_missing_role'
      } else if (!isProfileOnboardingComplete(user?.id, role)) {
        redirectTo = PROFILE_SETUP_PATH
        reason = 'index_profile_incomplete'
      } else {
        redirectTo = dashboardForRole(role)
        reason = 'index_to_dashboard'
      }
    } else if (guestOnly && isAuthenticated && hasRole && role) {
      redirectTo = isProfileOnboardingComplete(user?.id, role)
        ? dashboardForRole(role)
        : PROFILE_SETUP_PATH
      reason = 'guest_only_already_signed_in'
    } else if (guestOnly && isAuthenticated && !hasRole) {
      redirectTo = '/onboarding/role'
      reason = 'guest_only_needs_role'
    } else if (requireAuth && !isAuthenticated) {
      redirectTo = '/auth'
      reason = 'require_auth'
    } else if (profileSetup && !isAuthenticated) {
      redirectTo = '/auth'
      reason = 'profile_setup_not_authenticated'
    } else if (!profileSetup && !guestOnly && !requireAuth && !index && !isAuthenticated) {
      redirectTo = '/auth'
      reason = 'default_not_authenticated'
    }

    if (!redirectTo) return
    const key = `${location.pathname}:${reason}:${redirectTo}`
    if (lastRedirectLog.current === key) return
    lastRedirectLog.current = key
    authLog('route_redirect', {
      from: location.pathname,
      to: redirectTo,
      reason,
      isAuthenticated,
      hasRole,
      role,
    })
  }, [
    loading,
    index,
    guestOnly,
    requireAuth,
    profileSetup,
    isAuthenticated,
    hasRole,
    role,
    user?.id,
    location.pathname,
  ])

  if (loading) return null

  if (bootstrapSplash && onDashboardRoute) {
    return <VidULoading fullScreen label="Getting things ready…" size="lg" />
  }

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
    if (hasRole && role && isProfileOnboardingComplete(user?.id, role)) {
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
