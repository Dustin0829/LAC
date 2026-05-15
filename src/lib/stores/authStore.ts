import { create } from 'zustand'
import { registerAuthAccessTokenGetter } from '@/api/client'
import { getMe } from '@/api/services/me'
import type { MeResponseData } from '@/api/types/me.types'
import { consumeOAuthSessionSearchParams } from '@/lib/auth/oauthSession'

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
  accessToken: string | null
  profileOnboardingComplete: Record<string, boolean>
  loading: boolean
  signIn: (user: AuthUser) => void
  setAccessToken: (token: string | null) => void
  setRefreshToken: (token: string | null) => void
  setRole: (role: UserRole | null) => void
  clearRole: () => void
  resetUserAndRole: () => void
  updateUser: (patch: Partial<Pick<AuthUser, 'name' | 'avatarUrl'>>) => void
  signOut: () => void
  hydrate: () => Promise<void>
}

const USER_KEY = 'vidu.user'
const ROLE_KEY = 'vidu.role'
const TOKEN_KEY = 'vidu.access_token'
const REFRESH_KEY = 'vidu.refresh_token'
const LEGACY_USER_KEY = 'arpify.user'
const LEGACY_ROLE_KEY = 'arpify.role'

function readStored(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

function writeStored(key: string, value: string): void {
  localStorage.setItem(key, value)
  sessionStorage.setItem(key, value)
}

function removeStored(key: string): void {
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

/** Copy session-only auth into localStorage; pull legacy arpify keys. */
function migrateAuthStorage(): void {
  if (typeof window === 'undefined') return
  for (const key of [TOKEN_KEY, REFRESH_KEY, USER_KEY, ROLE_KEY]) {
    if (!localStorage.getItem(key) && sessionStorage.getItem(key)) {
      localStorage.setItem(key, sessionStorage.getItem(key)!)
    }
  }
  if (!readStored(USER_KEY) && localStorage.getItem(LEGACY_USER_KEY)) {
    writeStored(USER_KEY, localStorage.getItem(LEGACY_USER_KEY)!)
    localStorage.removeItem(LEGACY_USER_KEY)
  }
  if (!readStored(ROLE_KEY) && localStorage.getItem(LEGACY_ROLE_KEY)) {
    writeStored(ROLE_KEY, localStorage.getItem(LEGACY_ROLE_KEY)!)
    localStorage.removeItem(LEGACY_ROLE_KEY)
  }
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  accessToken: null,
  profileOnboardingComplete: {},
  loading: true,
  signIn: (user) => {
    if (typeof window !== 'undefined') {
      writeStored(USER_KEY, JSON.stringify(user))
    }
    set({ user })
  },
  setAccessToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) writeStored(TOKEN_KEY, token)
      else removeStored(TOKEN_KEY)
    }
    set({ accessToken: token })
  },
  setRefreshToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) writeStored(REFRESH_KEY, token)
      else removeStored(REFRESH_KEY)
    }
  },
  setRole: (role) => {
    if (typeof window !== 'undefined') {
      if (role) writeStored(ROLE_KEY, role)
      else removeStored(ROLE_KEY)
    }
    set({ role })
  },
  clearRole: () => {
    if (typeof window !== 'undefined') {
      removeStored(ROLE_KEY)
    }
    set({ role: null })
  },
  resetUserAndRole: () => {
    if (typeof window !== 'undefined') {
      removeStored(USER_KEY)
      removeStored(ROLE_KEY)
    }
    set({ user: null, role: null })
  },
  updateUser: (patch) => {
    set((state) => {
      const prev = state.user
      if (!prev) return state
      const user = { ...prev, ...patch }
      if (typeof window !== 'undefined') {
        writeStored(USER_KEY, JSON.stringify(user))
      }
      return { user }
    })
  },
  signOut: () => {
    if (typeof window !== 'undefined') {
      removeStored(USER_KEY)
      removeStored(ROLE_KEY)
      removeStored(TOKEN_KEY)
      removeStored(REFRESH_KEY)
      localStorage.removeItem(LEGACY_USER_KEY)
      localStorage.removeItem(LEGACY_ROLE_KEY)
    }
    set({ user: null, role: null, accessToken: null, profileOnboardingComplete: {} })
  },
  hydrate: async () => {
    if (typeof window === 'undefined') {
      set({ loading: false })
      return
    }
    try {
      set({ loading: true })
      migrateAuthStorage()
      const { setAccessToken, resetUserAndRole } = get()
      consumeOAuthSessionSearchParams({
        setAccessToken,
        resetUserAndRole,
      })
      const token = readStored(TOKEN_KEY)
      const userRaw = readStored(USER_KEY)
      const role = readStored(ROLE_KEY) as UserRole | null
      const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null
      set({
        user,
        role: role === 'creator' || role === 'brand' ? role : null,
        accessToken: token,
      })
      if (token) {
        try {
          const me = await getMe()
          applyMePayload(me, get(), (flags) => set({ profileOnboardingComplete: flags }))
        } catch {
          get().signOut()
        }
      }
    } catch {
      get().signOut()
    } finally {
      set({ loading: false })
    }
  },
}))

/** Call after `/auth/email/verify` succeeds (token already persisted). */
export async function syncAuthMe(): Promise<void> {
  const snapshot = useAuthStore.getState()
  if (!snapshot.accessToken) return
  try {
    const me = await getMe()
    applyMePayload(me, snapshot, (flags) =>
      useAuthStore.setState({ profileOnboardingComplete: flags }),
    )
  } catch {
    useAuthStore.getState().signOut()
  }
}

registerAuthAccessTokenGetter(() => useAuthStore.getState().accessToken)
