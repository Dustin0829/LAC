import type { CampaignSubmissionPreviewData } from '@/api/types/creator/campaign-submissions.types'
import { SUBMISSION_MIN_VIEWS } from '@/lib/constants'

export type CampaignSubmissionPreviewSnapshot = {
  views: number
  likes: number
  comments: number
}

export function submissionPreviewSnapshotFromApi(
  data: CampaignSubmissionPreviewData
): CampaignSubmissionPreviewSnapshot {
  return {
    views: Number(data.views) || 0,
    likes: Number(data.likes ?? 0) || 0,
    comments: Number(data.comments ?? 0) || 0,
  }
}

export function isSubmissionBelowMinViews(views: number): boolean {
  return views <= SUBMISSION_MIN_VIEWS
}
