import { create } from 'zustand'
import { ApiRequestError, registerHasAuthenticatedSession } from '@/api/client'
import { postAuthSignOut } from '@/api/services/auth'
import { getMe } from '@/api/services/me'
import type { MeResponseData } from '@/api/types/me.types'
import { purgeLegacyAuthStorage } from '@/lib/auth/purgeLegacyAuthStorage'
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
  signIn: (user: AuthUser) => void
  setRole: (role: UserRole | null) => void
  clearRole: () => void
  updateUser: (patch: Partial<Pick<AuthUser, 'name' | 'avatarUrl'>>) => void
  /** Clears in-memory session only (cookie cleared via `POST /auth/sign-out`). */
  clearLocalSession: () => void
  hydrate: () => Promise<void>
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
      expireSession()
    } else {
      clearLocalSession()
      void postAuthSignOut().catch(() => {
        /* cookie may already be gone */
      })
    }
    return
  }
  clearLocalSession()
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  profileOnboardingComplete: {},
  loading: true,
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
    set({ user: null, role: null, profileOnboardingComplete: {} })
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
      try {
        set({ loading: true, user: null, role: null })
        purgeLegacyAuthStorage()

        const params = new URLSearchParams(window.location.search)
        if (params.has('requires_role') || params.has('session_token')) {
          params.delete('requires_role')
          params.delete('session_token')
          const search = params.toString()
          const path = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
          window.history.replaceState(null, '', path)
        }

        try {
          const me = await getMe()
          applyMePayload(me, get(), (flags) => set({ profileOnboardingComplete: flags }))
        } catch (err) {
          handleHydrateAuthError(err, get().clearLocalSession)
        }
      } catch {
        get().clearLocalSession()
      } finally {
        set({ loading: false })
        initialBrowserHydrateDone = true
        hydrateInFlight = null
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
