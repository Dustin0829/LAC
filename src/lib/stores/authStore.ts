import { create } from 'zustand'

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
  loading: boolean
  signIn: (user: AuthUser) => void
  setAccessToken: (token: string | null) => void
  setRole: (role: UserRole) => void
  updateUser: (patch: Partial<Pick<AuthUser, 'name' | 'avatarUrl'>>) => void
  signOut: () => void
  hydrate: () => Promise<void>
}

const USER_KEY = 'vidu.user'
const ROLE_KEY = 'vidu.role'
const TOKEN_KEY = 'vidu.access_token'
const LEGACY_USER_KEY = 'arpify.user'
const LEGACY_ROLE_KEY = 'arpify.role'

function migrateLegacyAuthKeys(): void {
  if (typeof window === 'undefined') return
  if (!sessionStorage.getItem(USER_KEY) && localStorage.getItem(LEGACY_USER_KEY)) {
    sessionStorage.setItem(USER_KEY, localStorage.getItem(LEGACY_USER_KEY)!)
    localStorage.removeItem(LEGACY_USER_KEY)
  }
  if (!sessionStorage.getItem(ROLE_KEY) && localStorage.getItem(LEGACY_ROLE_KEY)) {
    sessionStorage.setItem(ROLE_KEY, localStorage.getItem(LEGACY_ROLE_KEY)!)
    localStorage.removeItem(LEGACY_ROLE_KEY)
  }
  if (!sessionStorage.getItem(USER_KEY) && localStorage.getItem(USER_KEY)) {
    sessionStorage.setItem(USER_KEY, localStorage.getItem(USER_KEY)!)
    localStorage.removeItem(USER_KEY)
  }
  if (!sessionStorage.getItem(ROLE_KEY) && localStorage.getItem(ROLE_KEY)) {
    sessionStorage.setItem(ROLE_KEY, localStorage.getItem(ROLE_KEY)!)
    localStorage.removeItem(ROLE_KEY)
  }
  if (!sessionStorage.getItem(TOKEN_KEY) && localStorage.getItem(TOKEN_KEY)) {
    sessionStorage.setItem(TOKEN_KEY, localStorage.getItem(TOKEN_KEY)!)
    localStorage.removeItem(TOKEN_KEY)
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  accessToken: null,
  loading: true,
  signIn: (user) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    set({ user })
  },
  setAccessToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) sessionStorage.setItem(TOKEN_KEY, token)
      else sessionStorage.removeItem(TOKEN_KEY)
    }
    set({ accessToken: token })
  },
  setRole: (role) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(ROLE_KEY, role)
    }
    set({ role })
  },
  updateUser: (patch) => {
    set((state) => {
      const prev = state.user
      if (!prev) return state
      const user = { ...prev, ...patch }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(USER_KEY, JSON.stringify(user))
      }
      return { user }
    })
  },
  signOut: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(USER_KEY)
      sessionStorage.removeItem(ROLE_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(ROLE_KEY)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(LEGACY_USER_KEY)
      localStorage.removeItem(LEGACY_ROLE_KEY)
    }
    set({ user: null, role: null, accessToken: null })
  },
  hydrate: async () => {
    if (typeof window === 'undefined') {
      set({ loading: false })
      return
    }
    try {
      migrateLegacyAuthKeys()
      const token = sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY)
      const userRaw = sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY)
      const role = (sessionStorage.getItem(ROLE_KEY) ?? localStorage.getItem(ROLE_KEY)) as
        | UserRole
        | null
      const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null
      set({
        user,
        role: role === 'creator' || role === 'brand' ? role : null,
        accessToken: token,
        loading: false,
      })
    } catch {
      get().signOut()
      set({ loading: false })
    }
  },
}))
