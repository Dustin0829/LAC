import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/hooks/useAuth'
import type { UserRole } from '@/lib/stores/authStore'

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full bg-phc-gradient animate-pulse" />
        Loading…
      </div>
    </div>
  )
}

function landingForRole(role: UserRole | null) {
  if (role === 'brand') return '/brand/dashboard'
  if (role === 'clipper') return '/clipper/dashboard'
  return '/onboarding/role'
}

export interface ProtectedRouteProps {
  /** Index `/` — redirect to auth, onboarding, or dashboard. */
  index?: boolean
  /** Guest-only (e.g. `/auth`): show children only when not signed in. */
  guestOnly?: boolean
  /** Require authenticated user but not a role yet (onboarding gate). */
  requireAuth?: boolean
  /** Require a specific role. */
  requiredRole?: UserRole
  children?: React.ReactNode
}

export function ProtectedRoute({
  index = false,
  guestOnly = false,
  requireAuth = false,
  requiredRole,
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, role, loading } = useAuth()

  if (loading) return <AuthLoading />

  if (index) {
    if (!isAuthenticated) return <Navigate to="/auth" replace />
    if (!hasRole) return <Navigate to="/onboarding/role" replace />
    return <Navigate to={landingForRole(role)} replace />
  }

  if (guestOnly) {
    if (isAuthenticated && hasRole) return <Navigate to={landingForRole(role)} replace />
    if (isAuthenticated && !hasRole) return <Navigate to="/onboarding/role" replace />
    return <>{children}</>
  }

  if (requireAuth) {
    if (!isAuthenticated) return <Navigate to="/auth" replace />
    if (hasRole) return <Navigate to={landingForRole(role)} replace />
    return <>{children}</>
  }

  if (!isAuthenticated) return <Navigate to="/auth" replace />
  if (!hasRole) return <Navigate to="/onboarding/role" replace />

  if (requiredRole && role !== requiredRole) {
    return <Navigate to={landingForRole(role)} replace />
  }

  return <>{children}</>
}
