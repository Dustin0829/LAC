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
  loading: boolean
  signIn: (user: AuthUser) => void
  setRole: (role: UserRole) => void
  /** Merge into the signed-in user and persist (e.g. display name on Account). */
  updateUser: (patch: Partial<Pick<AuthUser, 'name' | 'avatarUrl'>>) => void
  signOut: () => void
  hydrate: () => void
}

const USER_KEY = 'arpify.user'
const ROLE_KEY = 'arpify.role'

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  loading: true,
  signIn: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    set({ user })
  },
  setRole: (role) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_KEY, role)
    }
    set({ role })
  },
  updateUser: (patch) => {
    set((state) => {
      const prev = state.user
      if (!prev) return state
      const user = { ...prev, ...patch }
      if (typeof window !== 'undefined') {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      }
      return { user }
    })
  },
  signOut: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(ROLE_KEY)
    }
    set({ user: null, role: null })
  },
  hydrate: () => {
    if (typeof window === 'undefined') {
      set({ loading: false })
      return
    }
    try {
      const userRaw = localStorage.getItem(USER_KEY)
      const role = localStorage.getItem(ROLE_KEY) as UserRole | null
      const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null
      set({
        user,
        role: role === 'creator' || role === 'brand' ? role : null,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },
}))
