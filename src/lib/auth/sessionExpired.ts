import { create } from 'zustand'

/** Backend 401 for TikTok/Meta token issues — not a VidU login session expiry. */
export const PLATFORM_RECONNECT_MESSAGE = 'platform_reconnect_required'

export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please sign in again.')
    this.name = 'SessionExpiredError'
  }
}

export function isAuthSessionUnauthorized(status: number | undefined, message: string): boolean {
  if (status !== 401) return false
  if (message === PLATFORM_RECONNECT_MESSAGE) return false
  return true
}

type SessionExpiredState = {
  expired: boolean
  markExpired: () => void
  clearExpired: () => void
}

export const useSessionExpiredStore = create<SessionExpiredState>((set, get) => ({
  expired: false,
  markExpired: () => {
    if (get().expired) return
    set({ expired: true })
  },
  clearExpired: () => set({ expired: false }),
}))

let clearAuthSession: () => void = () => {}
let requestSignOut: () => void = () => {}

export function registerSessionExpiredSideEffects(effects: {
  clearAuthSession: () => void
  requestSignOut: () => void
}): void {
  clearAuthSession = effects.clearAuthSession
  requestSignOut = effects.requestSignOut
}

/** Clear httpOnly cookie server-side, drop client session, show modal (idempotent). */
export function expireSession(): void {
  const { expired, markExpired } = useSessionExpiredStore.getState()
  if (expired) return
  // Sign out first while `expired` is still false — the API client blocks other requests once
  // `expired` is true, which would prevent `POST /auth/sign-out` from clearing the cookie.
  requestSignOut()
  clearAuthSession()
  markExpired()
}
