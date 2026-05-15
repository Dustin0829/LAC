import type { Platform } from '@/lib/mockData'

export const TERMS_OF_SERVICE_URL = 'https://www.vid-u.com/terms'
export const PRIVACY_POLICY_URL = 'https://www.vid-u.com/privacy'

export const RECENT_PAGE_SIZE = 10

/**
 * Profile wizard at `/onboarding/profile` (platforms, payouts, brand profile).
 * Set to `false` to skip and send users to the dashboard after role selection.
 */
export const PROFILE_ONBOARDING_ENABLED = false

/** Toggle creator OAuth connect per platform (account + onboarding). */
export const CREATOR_PLATFORM_CONNECT_ENABLED: Record<Platform, boolean> = {
  tiktok: true,
  facebook: false,
}

export function isCreatorPlatformConnectEnabled(platform: Platform): boolean {
  return CREATOR_PLATFORM_CONNECT_ENABLED[platform]
}
