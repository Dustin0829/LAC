export const TERMS_OF_SERVICE_URL = 'https://www.vid-u.com/terms'
export const PRIVACY_POLICY_URL = 'https://www.vid-u.com/privacy'

/** Creator submission tables (dashboard recent inbox + submissions page). */
export const CREATOR_SUBMISSIONS_PAGE_SIZE = 10

// --- Creator submissions (keep in sync with vidu-backend `submissions.service.ts`) ---

/** Minimum post views required to submit (backend rejects at or below this). */
export const SUBMISSION_MIN_VIEWS = 1000

/** Substring in backend `ValidationError` when views are below the MVP floor. */
export const SUBMISSION_VIEWS_FLOOR_API_SNIPPET = '1k threshold'

/** Debounce while typing a content URL in the submit-content modal preview. */
export const CREATOR_SUBMISSION_PREVIEW_DEBOUNCE_MS = 550

/** @deprecated Prefer `CREATOR_SUBMISSIONS_PAGE_SIZE`. */
export const RECENT_PAGE_SIZE = CREATOR_SUBMISSIONS_PAGE_SIZE

/**
 * Profile wizard at `/onboarding/profile` (platforms, payouts, brand profile).
 * Set to `false` to skip and send users to the dashboard after role selection.
 */
export const PROFILE_ONBOARDING_ENABLED = false

/** Toggle creator OAuth connect per platform (account + onboarding). */
export const CREATOR_PLATFORM_CONNECT_ENABLED = {
  tiktok: true,
  facebook: true,
} as const satisfies Record<'tiktok' | 'facebook', boolean>

export function isCreatorPlatformConnectEnabled(platform: 'tiktok' | 'facebook'): boolean {
  return CREATOR_PLATFORM_CONNECT_ENABLED[platform]
}

// --- Fees (keep in sync with vidu-backend `config/fees.ts`) ---

/** VidU's cut of every brand deposit (gross). */
export const PLATFORM_DEPOSIT_FEE_PERCENT = 0.15

/** VidU's cut of creator gross performance. Creator share = 1 − this. */
export const CREATOR_PAYOUT_FEE_PERCENT = 0.2

/** Creator share of gross performance (1 − `CREATOR_PAYOUT_FEE_PERCENT`). */
export const CREATOR_PAYOUT_SHARE = 1 - CREATOR_PAYOUT_FEE_PERCENT

/** Brand funding / checkout UI — same as `PLATFORM_DEPOSIT_FEE_PERCENT`. */
export function getPlatformFeePercent(): number {
  return PLATFORM_DEPOSIT_FEE_PERCENT
}

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
  'Use these hashtags in the caption (e.g. #YourBrand #YourCampaign)',
  'Tag our official account (e.g. @yourbrandph)',
  'No stolen, recycled, or duplicate content',
] as const
