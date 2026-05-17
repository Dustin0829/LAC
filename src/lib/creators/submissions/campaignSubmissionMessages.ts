import { ApiRequestError } from '@/api/client'
import { PLATFORM_RECONNECT_MESSAGE } from '@/lib/auth/sessionExpired'
import {
  SUBMISSION_MIN_VIEWS,
  SUBMISSION_VIEWS_FLOOR_API_SNIPPET,
} from '@/lib/constants'
import type { Platform } from '@/api/types/shared'
import { PLATFORM_LABEL } from '@/lib/platforms/labels'

export function campaignSubmissionBelowMinViewsMessage(): string {
  return `This post needs more than ${SUBMISSION_MIN_VIEWS.toLocaleString('en-PH')} views to submit for this campaign.`
}

export function isCampaignSubmissionViewsFloorError(err: unknown): boolean {
  return (
    err instanceof ApiRequestError &&
    err.statusCode === 400 &&
    err.message.includes(SUBMISSION_VIEWS_FLOOR_API_SNIPPET)
  )
}

export function campaignSubmissionPreviewErrorMessage(
  err: unknown,
  platform?: Platform
): string {
  if (err instanceof ApiRequestError) {
    switch (err.message) {
      case 'creator_default_payment_method_required':
        return 'Add a payout method before previewing or submitting content.'
      case PLATFORM_RECONNECT_MESSAGE:
        return platform
          ? `Reconnect ${PLATFORM_LABEL[platform]} to fetch live post stats.`
          : 'Reconnect your platform account to fetch live post stats.'
      case 'campaign_not_active':
        return 'This campaign is not accepting submissions right now.'
      default:
        if (isCampaignSubmissionViewsFloorError(err)) {
          return campaignSubmissionBelowMinViewsMessage()
        }
        return err.message
    }
  }
  return err instanceof Error ? err.message : 'Could not fetch post stats.'
}

export function campaignSubmissionConfirmErrorMessage(err: unknown, platform?: Platform): string {
  if (err instanceof ApiRequestError) {
    switch (err.message) {
      case 'creator_default_payment_method_required':
        return 'Add a default payout method before submitting content.'
      case PLATFORM_RECONNECT_MESSAGE:
        return platform
          ? `Reconnect ${PLATFORM_LABEL[platform]} before submitting.`
          : 'Reconnect your platform account before submitting.'
      case 'campaign_not_active':
        return 'This campaign is not accepting submissions right now.'
      case 'duplicate_submission':
        return 'You already submitted this content for a campaign.'
      case 'below_minimum_payout':
        return 'Estimated payout is below the minimum for your payout channel. Try a post with more views.'
      case 'campaign_pool_exhausted':
        return 'This campaign has run out of budget for new submissions.'
      default:
        if (isCampaignSubmissionViewsFloorError(err)) {
          return campaignSubmissionBelowMinViewsMessage()
        }
        return err.message
    }
  }
  return err instanceof Error ? err.message : 'Could not submit content.'
}

export function campaignSubmissionSuccessMessage() {
  return 'Content submitted.'
}

export function campaignSubmissionUrlErrorMessage() {
  return 'Enter a valid content URL.'
}
