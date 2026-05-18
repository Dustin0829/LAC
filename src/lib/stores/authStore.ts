import { create } from 'zustand'
import { ApiRequestError, registerHasAuthenticatedSession } from '@/api/client'
import { postAuthSignOut } from '@/api/services/auth'
import { getMe } from '@/api/services/me'
import type { MeResponseData } from '@/api/types/me.types'
import { authLog } from '@/lib/auth/authLog'
import {
  consumePendingPostLoginSplash,
  isDashboardReady,
  postLoginMinLoadMs,
  runBootstrapSplashMinimum,
} from '@/lib/auth/postLoginSplash'
import { prefetchDashboardData } from '@/lib/dashboard/prefetchDashboard'
import { purgeLegacyAuthStorage } from '@/lib/auth/purgeLegacyAuthStorage'
import { getQueryClient } from '@/lib/queryClientRef'
import {
  expireSession,
  isAuthSessionUnauthorized,
  registerSessionExpiredSideEffects,
  SessionExpiredError,
  useSessionExpiredStore,
} from '@/lib/auth/sessionExpired'

/** React Strict Mode runs `AuthProvider` effects twice in dev — dedupe `GET /me` + stale-cookie sign-out. */
let initialBrowserHydrateDone = false
let hydrateInFlight: Promise<void> | null = null
let bootstrapSplashInFlight: Promise<void> | null = null

export type UserRole = 'creator' | 'brand'

export type AuthUser = {
  id: string
  email: string
  name?: string
  avatarUrl?: string
}

interface AuthState {
  user: AuthUser | null
  role: UserRole | null
  profileOnboardingComplete: Record<string, boolean>
  loading: boolean
  /** Full-screen VidU loader when entering the dashboard (not during onboarding). */
  bootstrapSplash: boolean
  signIn: (user: AuthUser) => void
  setRole: (role: UserRole | null) => void
  clearRole: () => void
  updateUser: (patch: Partial<Pick<AuthUser, 'name' | 'avatarUrl'>>) => void
  /** Clears in-memory session only (cookie cleared via `POST /auth/sign-out`). */
  clearLocalSession: () => void
  hydrate: () => Promise<void>
  /** Minimum-duration logo splash before showing dashboard content. */
  startBootstrapSplash: () => Promise<void>
}

type AuthActions = Pick<AuthState, 'signIn' | 'setRole' | 'clearRole'>

function applyMePayload(
  me: MeResponseData,
  actions: AuthActions,
  setProfileFlags: (flags: Record<string, boolean>) => void,
): void {
  const u = me.user
  const user: AuthUser = {
    id: u.id,
    email: u.email,
    name: u.name ?? undefined,
    avatarUrl: u.avatarUrl ?? undefined,
  }
  actions.signIn(user)
  setProfileFlags(me.profileOnboardingComplete ?? {})
  if (
    !me.requiresRoleSelection &&
    me.primaryRole &&
    (me.primaryRole === 'creator' || me.primaryRole === 'brand')
  ) {
    actions.setRole(me.primaryRole)
  } else {
    actions.clearRole()
  }
}

function handleHydrateAuthError(err: unknown, clearLocalSession: () => void): void {
  if (err instanceof SessionExpiredError) return
  const status = err instanceof ApiRequestError ? err.statusCode : undefined
  const message = err instanceof Error ? err.message : ''
  if (isAuthSessionUnauthorized(status, message)) {
    /* Hydrate clears `user` before `getMe` — 401 here is a cold/stale cookie, not mid-session expiry. */
    if (useAuthStore.getState().user) {
      authLog('hydrate_me_unauthorized', { status, message, action: 'expire_session' })
      expireSession()
    } else {
      authLog('hydrate_me_unauthorized', {
        status,
        message,
        action: 'clear_local_and_sign_out',
        pageOrigin: window.location.origin,
        pagePath: window.location.pathname,
      })
      clearLocalSession()
      void postAuthSignOut().catch(() => {
        authLog('hydrate_sign_out_failed', { status, message })
      })
    }
    return
  }
  authLog('hydrate_me_error', {
    status,
    message: message || 'unknown',
    action: 'clear_local_session',
  })
  clearLocalSession()
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  profileOnboardingComplete: {},
  loading: true,
  bootstrapSplash: false,
  signIn: (user) => set({ user }),
  setRole: (role) => set({ role }),
  clearRole: () => set({ role: null }),
  updateUser: (patch) => {
    set((state) => {
      const prev = state.user
      if (!prev) return state
      return { user: { ...prev, ...patch } }
    })
  },
  clearLocalSession: () => {
    useSessionExpiredStore.getState().clearExpired()
    set({ user: null, role: null, profileOnboardingComplete: {}, bootstrapSplash: false })
  },
  startBootstrapSplash: async () => {
    if (bootstrapSplashInFlight) return bootstrapSplashInFlight
    if (get().bootstrapSplash) return

    bootstrapSplashInFlight = (async () => {
      const startedAt = Date.now()
      set({ bootstrapSplash: true })
      authLog('bootstrap_splash_start', { minMs: postLoginMinLoadMs() })
      try {
        const role = get().role
        await Promise.all([
          runBootstrapSplashMinimum(startedAt),
          (async () => {
            const qc = getQueryClient()
            if (qc) await prefetchDashboardData(qc, role)
          })(),
        ])
      } finally {
        set({ bootstrapSplash: false })
        authLog('bootstrap_splash_complete', { elapsedMs: Date.now() - startedAt })
        bootstrapSplashInFlight = null
      }
    })()

    return bootstrapSplashInFlight
  },
  hydrate: async () => {
    if (typeof window === 'undefined') {
      set({ loading: false })
      return
    }
    if (initialBrowserHydrateDone) {
      return
    }
    if (hydrateInFlight) {
      return hydrateInFlight
    }

    hydrateInFlight = (async () => {
      const hydrateStartedAt = Date.now()
      let isFreshLogin = false

      try {
        set({ loading: true, user: null, role: null })
        purgeLegacyAuthStorage()

        const params = new URLSearchParams(window.location.search)
        const oauthError = params.get('oauth') === 'error' ? params.get('reason') : null
        if (oauthError) {
          authLog('oauth_return_error', {
            reason: oauthError,
            pageOrigin: window.location.origin,
          })
        }
        const hadRequiresRole = params.has('requires_role')
        const hadSessionToken = params.has('session_token')
        isFreshLogin =
          hadRequiresRole || hadSessionToken || consumePendingPostLoginSplash()
        if (hadRequiresRole || hadSessionToken) {
          authLog('post_login_query_params', {
            requiresRole: hadRequiresRole,
            hadSessionToken: params.has('session_token'),
          })
          params.delete('requires_role')
          params.delete('session_token')
          const search = params.toString()
          const path = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
          window.history.replaceState(null, '', path)
        }

        authLog('hydrate_start', {
          apiBase: import.meta.env.VITE_API_URL ?? '(unset)',
          pageOrigin: window.location.origin,
          pagePath: window.location.pathname,
          hadRequiresRole,
          hadSessionToken,
          isFreshLogin,
          oauthError,
        })

        try {
          const me = await getMe()
          authLog('hydrate_me_ok', {
            userId: me.user.id,
            requiresRoleSelection: me.requiresRoleSelection,
            primaryRole: me.primaryRole ?? null,
          })
          applyMePayload(me, get(), (flags) => set({ profileOnboardingComplete: flags }))
        } catch (err) {
          handleHydrateAuthError(err, get().clearLocalSession)
        }
      } catch {
        get().clearLocalSession()
      } finally {
        const { user, role } = get()
        set({ loading: false })
        initialBrowserHydrateDone = true
        hydrateInFlight = null

        if (user && isFreshLogin && isDashboardReady(user.id, role)) {
          authLog('post_login_dashboard_splash', { userId: user.id, role })
          void get().startBootstrapSplash()
        }

        authLog('hydrate_done', {
          isAuthenticated: Boolean(user),
          hasRole: Boolean(role),
          role,
          isFreshLogin,
          dashboardReady: isDashboardReady(user?.id, role),
          elapsedMs: Date.now() - hydrateStartedAt,
        })
      }
    })()

    return hydrateInFlight
  },
}))

/** Refresh user/role from `GET /me` (session cookie must already be set). */
export async function syncAuthMe(): Promise<void> {
  try {
    const me = await getMe()
    applyMePayload(me, useAuthStore.getState(), (flags) =>
      useAuthStore.setState({ profileOnboardingComplete: flags }),
    )
  } catch (err) {
    handleHydrateAuthError(err, () => useAuthStore.getState().clearLocalSession())
  }
}

registerHasAuthenticatedSession(() => Boolean(useAuthStore.getState().user))

registerSessionExpiredSideEffects({
  clearAuthSession: () => useAuthStore.getState().clearLocalSession(),
  requestSignOut: () => {
    void postAuthSignOut().catch(() => {
      /* cookie may already be gone */
    })
  },
})
