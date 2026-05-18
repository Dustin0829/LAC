import type { UserRole } from '@/lib/stores/authStore'
import { isProfileOnboardingComplete } from '@/lib/profileOnboarding'

const OAUTH_SPLASH_KEY = 'vidu.expectPostLoginSplash'
const ONBOARDING_SPLASH_KEY = 'vidu.expectPostOnboardingSplash'

/** Default minimum full-screen logo loader when entering the dashboard (ms). */
const DEFAULT_POST_LOGIN_MIN_LOAD_MS = 3500

/** Set before redirecting to Google OAuth. */
export function markPendingPostLoginSplash(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(OAUTH_SPLASH_KEY, '1')
}

/** Set before navigating to the dashboard after profile onboarding. */
export function markPostOnboardingSplash(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(ONBOARDING_SPLASH_KEY, '1')
}

export function consumePendingPostLoginSplash(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  const pending = sessionStorage.getItem(OAUTH_SPLASH_KEY) === '1'
  sessionStorage.removeItem(OAUTH_SPLASH_KEY)
  return pending
}

export function consumePostOnboardingSplash(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  const pending = sessionStorage.getItem(ONBOARDING_SPLASH_KEY) === '1'
  sessionStorage.removeItem(ONBOARDING_SPLASH_KEY)
  return pending
}

export function isOnboardingPath(pathname: string): boolean {
  return pathname === '/onboarding/role' || pathname.startsWith('/onboarding/profile')
}

/** User can go straight to the dashboard (role + profile onboarding done). */
export function isDashboardReady(
  userId: string | undefined | null,
  role: UserRole | null
): boolean {
  if (!userId || !role) return false
  return isProfileOnboardingComplete(userId, role)
}

export function postLoginMinLoadMs(): number {
  const raw = import.meta.env.VITE_POST_LOGIN_MIN_LOAD_MS
  if (raw === undefined || raw === '') return DEFAULT_POST_LOGIN_MIN_LOAD_MS
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_POST_LOGIN_MIN_LOAD_MS
  return parsed
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function runBootstrapSplashMinimum(startedAt: number): Promise<void> {
  const minMs = postLoginMinLoadMs()
  if (minMs <= 0) return
  const remaining = minMs - (Date.now() - startedAt)
  if (remaining > 0) await sleep(remaining)
}
