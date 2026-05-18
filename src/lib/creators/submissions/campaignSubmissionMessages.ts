import { ApiRequestError } from '@/api/client'
import { PLATFORM_RECONNECT_MESSAGE } from '@/lib/auth/sessionExpired'
import { SUBMISSION_MIN_VIEWS, SUBMISSION_VIEWS_FLOOR_API_SNIPPET } from '@/lib/constants'
import type { Platform } from '@/api/types/shared'
import { PLATFORM_LABEL } from '@/lib/platforms/labels'
import { formatViews } from '@/lib/utils'

/** Maps stable API error codes to creator-facing copy (preview + submit). */
const SUBMISSION_API_ERROR_MESSAGES: Record<string, string> = {
  tiktok_video_not_owned_or_missing:
    "This TikTok video isn't on your connected account. Use a link to a video you posted with the TikTok account you connected to VidU.",
  invalid_tiktok_url:
    'Enter a valid TikTok video link (for example, tiktok.com/@username/video/...).',
  instagram_urls_not_supported_for_facebook_connect:
    "Instagram links aren't supported when you connected Facebook. Use a Facebook Reel or video link instead.",
  unsupported_facebook_content_url:
    "We don't recognize that Facebook link. Try a Reel or facebook.com/watch link from your connected account.",
  unsupported_platform: "This platform isn't supported for campaign submissions.",
  facebook_object_not_found:
    "This Reel isn't on your connected Facebook account, or we can't access it. Paste a link to a Reel you posted with the account you connected to VidU.",
  facebook_reel_not_owned:
    "This Reel isn't on your connected Facebook account, or we can't access it. Paste a link to a Reel you posted with the account you connected to VidU.",
  facebook_reel_not_accessible:
    "This Reel isn't on your connected Facebook account, or we can't access it. Paste a link to a Reel you posted with the account you connected to VidU.",
  facebook_reel_not_on_connected_page:
    "This Reel isn't on your connected Facebook account, or we can't access it. Paste a link to a Reel you posted with the account you connected to VidU.",
  facebook_no_pages_linked:
    'No Facebook Page is linked to your account. Connect Facebook and grant access to the Page where you publish Reels.',
  facebook_page_required_for_reels:
    'No Facebook Page is linked to your account. Connect Facebook and grant access to the Page where you publish Reels.',
  meta_read_insights_required:
    'Reconnect Facebook in Account settings so we can read view stats (read insights permission).',
  facebook_video_insights_unavailable:
    "We found your Reel, but Meta didn't return view counts for it. Page Reels need Page permissions in our Facebook app; personal Reels may not expose views via Meta's API yet.",
  creator_platform_not_connected: 'Connect this platform in Account settings before submitting.',
  campaign_not_active: 'This campaign is not accepting submissions right now.',
  duplicate_submission: 'You already submitted this content for a campaign.',
  below_minimum_payout:
    'Estimated payout is below the minimum for your payout channel. Try a post with more views.',
  campaign_pool_exhausted: 'This campaign has run out of budget for new submissions.',
}

function humanizeSubmissionApiError(
  message: string,
  platform?: Platform,
  context: 'preview' | 'confirm' = 'preview'
): string {
  if (message === 'creator_default_payment_method_required') {
    return context === 'preview'
      ? 'Add a payout method before previewing or submitting content.'
      : 'Add a default payout method before submitting content.'
  }

  if (message === PLATFORM_RECONNECT_MESSAGE) {
    return context === 'confirm'
      ? platform
        ? `Reconnect ${PLATFORM_LABEL[platform]} before submitting.`
        : 'Reconnect your platform account before submitting.'
      : platform
        ? `Reconnect ${PLATFORM_LABEL[platform]} to fetch live post stats.`
        : 'Reconnect your platform account to fetch live post stats.'
  }

  const mapped = SUBMISSION_API_ERROR_MESSAGES[message]
  if (mapped) return mapped

  if (message.includes('read_insights')) {
    return SUBMISSION_API_ERROR_MESSAGES.meta_read_insights_required
  }
  if (message.includes('Unsupported get request') || message.includes('does not exist')) {
    return SUBMISSION_API_ERROR_MESSAGES.facebook_reel_not_owned
  }

  if (/^[a-z][a-z0-9_]+$/.test(message)) {
    return 'We could not verify this link. Check the URL and try again.'
  }

  return message
}

export function campaignSubmissionBelowMinViewsMessage(currentViews?: number): string {
  const minLabel = SUBMISSION_MIN_VIEWS.toLocaleString('en-PH')
  if (currentViews != null && Number.isFinite(currentViews)) {
    return `This post has ${formatViews(currentViews)} views. You need more than ${minLabel} views to submit for this campaign.`
  }
  return `This post needs more than ${minLabel} views to submit for this campaign.`
}

export function isCampaignSubmissionViewsFloorError(err: unknown): boolean {
  return (
    err instanceof ApiRequestError &&
    err.statusCode === 400 &&
    err.message.includes(SUBMISSION_VIEWS_FLOOR_API_SNIPPET)
  )
}

export function campaignSubmissionPreviewErrorMessage(err: unknown, platform?: Platform): string {
  if (err instanceof ApiRequestError) {
    if (isCampaignSubmissionViewsFloorError(err)) {
      return campaignSubmissionBelowMinViewsMessage()
    }
    return humanizeSubmissionApiError(err.message, platform, 'preview')
  }
  return err instanceof Error ? err.message : 'Could not fetch post stats.'
}

export function campaignSubmissionConfirmErrorMessage(err: unknown, platform?: Platform): string {
  if (err instanceof ApiRequestError) {
    if (isCampaignSubmissionViewsFloorError(err)) {
      return campaignSubmissionBelowMinViewsMessage()
    }
    return humanizeSubmissionApiError(err.message, platform, 'confirm')
  }
  return err instanceof Error ? err.message : 'Could not submit content.'
}

export function campaignSubmissionSuccessMessage() {
  return 'Content submitted.'
}

export function campaignSubmissionUrlErrorMessage() {
  return 'Enter a valid content URL.'
}
