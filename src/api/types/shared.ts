/** Social platforms supported on campaigns and submissions (matches backend enum). */
export type Platform = 'tiktok' | 'facebook'

/** Campaign lifecycle status from the API. */
export type CampaignStatus =
  | 'active'
  | 'paused'
  | 'ended'
  | 'draft'
  | 'funding_pending'

/** Submission / content payout status from the API. */
export type ContentStatus =
  | 'pending'
  | 'paying'
  | 'paid'
  | 'payout_failed'
  | 'rejected'
