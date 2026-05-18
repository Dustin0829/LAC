import type { CampaignSubmissionPreviewData } from '@/api/types/creator/campaign-submissions.types'
import type { Platform } from '@/api/types/shared'
import { SUBMISSION_MIN_VIEWS } from '@/lib/constants'

export type CampaignSubmissionPreviewSnapshot = {
  views: number
  /** TikTok likes or Facebook reactions */
  engagementPrimary: number
  /** TikTok comments or Facebook engagements */
  engagementSecondary: number
}

export function submissionPreviewSnapshotFromApi(
  data: CampaignSubmissionPreviewData,
  platform: Platform,
): CampaignSubmissionPreviewSnapshot {
  if (platform === 'facebook') {
    return {
      views: Number(data.views) || 0,
      engagementPrimary: Number(data.reactions ?? 0) || 0,
      engagementSecondary: Number(data.engagements ?? 0) || 0,
    }
  }
  return {
    views: Number(data.views) || 0,
    engagementPrimary: Number(data.likes ?? 0) || 0,
    engagementSecondary: Number(data.comments ?? 0) || 0,
  }
}

/** Matches backend: views must be **greater than** `SUBMISSION_MIN_VIEWS` to submit. */
export function isSubmissionBelowMinViews(views: number): boolean {
  return views < SUBMISSION_MIN_VIEWS
}
