import type { UserRole } from '@/lib/stores/authStore'

/** Per-user + per-role completion (fixes global v1 flag skipping onboarding for new accounts). */
const STORAGE_KEY = 'vidu.profileOnboarding.v2'

function entryKey(userId: string, role: UserRole): string {
  return `${userId}::${role}`
}

function readCompleted(): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const data = JSON.parse(raw) as { completed?: Record<string, boolean> }
    return data.completed ?? {}
  } catch {
    return {}
  }
}

export function isProfileOnboardingComplete(
  userId: string | undefined | null,
  role: UserRole | null
): boolean {
  if (!role || !userId) return false
  return readCompleted()[entryKey(userId, role)] === true
}

export function markProfileOnboardingComplete(userId: string, role: UserRole): void {
  if (typeof window === 'undefined') return
  const completed = { ...readCompleted(), [entryKey(userId, role)]: true }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed }))
}
