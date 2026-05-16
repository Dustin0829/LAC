export const TERMS_OF_SERVICE_URL = 'https://www.vid-u.com/terms'
export const PRIVACY_POLICY_URL = 'https://www.vid-u.com/privacy'

export const RECENT_PAGE_SIZE = 10

/**
 * Profile wizard at `/onboarding/profile` (platforms, payouts, brand profile).
 * Set to `false` to skip and send users to the dashboard after role selection.
 */
export const PROFILE_ONBOARDING_ENABLED = false

/** Toggle creator OAuth connect per platform (account + onboarding). */
export const CREATOR_PLATFORM_CONNECT_ENABLED = {
  tiktok: true,
  facebook: false,
} as const satisfies Record<'tiktok' | 'facebook', boolean>

export function isCreatorPlatformConnectEnabled(platform: 'tiktok' | 'facebook'): boolean {
  return CREATOR_PLATFORM_CONNECT_ENABLED[platform]
}

/** Platform deposit fee — keep in sync with `vidu-backend` `PLATFORM_DEPOSIT_FEE_PERCENT`. */
const PLATFORM_DEPOSIT_FEE_PERCENT = 0.15

// --- Campaign limits (keep in sync with vidu-backend `campaign-limits.ts` & `fees.ts`) ---

/** Backend `MIN_BRAND_RATE_PER_1K` — minimum brand gross ₱/1k on create/patch. */
export const MIN_BRAND_RATE_PER_1K = 35

/**
 * Minimum ₱ the brand pays to fund / publish (create, checkout).
 * Backend env: `MIN_PUBLISH_PHP`. Net pool floor for auto-pause is derived (after deposit fee).
 */
export const MIN_PUBLISH_PHP = 10_000

/** Matches backend `MIN_PUBLISH_SPENDABLE_FLOOR_PHP` — for comparing API `availableBudget` / net pool. */
export function minPublishAvailableThresholdPhp(): number {
  return Math.round(MIN_PUBLISH_PHP * (1 - PLATFORM_DEPOSIT_FEE_PERCENT))
}

/** Platforms allowed on brand campaigns (matches API `platforms` enum). */
export const CAMPAIGN_PLATFORMS = ['tiktok', 'facebook'] as const

/** Starter rules pre-filled on the create-campaign form. */
export const DEFAULT_CAMPAIGN_RULES = [
  'Content must be at least 15 seconds long',
  'Use your campaign hashtags in the caption (e.g. #YourBrand #YourCampaign)',
  'Tag your official brand account (e.g. @yourbrandph)',
  'No stolen, recycled, or duplicate content',
] as const
