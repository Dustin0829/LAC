import type {
  BrandCampaignCheckoutBody,
  BrandCampaignDetailDto,
  BrandCampaignRefundData,
  BrandCampaignReleasePayoutData,
  BrandCampaignSyncCheckoutData,
  PatchBrandCampaignBody,
} from '@/api/types/brands/campaigns.types'
import { formatPHP } from '@/lib/utils'

export function brandCampaignTransactionsRefreshSuccessMessage() {
  return 'Transactions updated.'
}

export function brandCampaignTransactionsRefreshErrorMessage() {
  return 'Could not refresh transactions.'
}

export function brandCampaignCheckoutLinkCopiedMessage() {
  return 'Checkout link copied.'
}

export function brandCampaignCheckoutLinkCopyFailedMessage() {
  return 'Could not copy link.'
}

export function brandCampaignReleasePayoutSuccessMessage(result: BrandCampaignReleasePayoutData) {
  return `Payout released for ${result.released} submission${result.released === 1 ? '' : 's'}. Disbursements are in flight.`
}

export function brandCampaignSubmitCreateCheckoutOpenMessage() {
  return 'Redirecting to checkout…'
}

export function brandCampaignSubmitCreateDraftSavedMessage(hadExistingDraft: boolean) {
  return hadExistingDraft ? 'Draft updated.' : 'Draft saved.'
}

export function brandCampaignSubmitCreatePartialErrorMessage(errorMessage: string) {
  return `${errorMessage} Your draft was saved — fix the issue and submit again.`
}

export function patchBrandCampaignSuccessMessage(body: PatchBrandCampaignBody): string | null {
  if (body.status !== undefined) {
    return body.status === 'paused' ? 'Campaign paused' : 'Campaign resumed'
  }
  if (body.title !== undefined || body.description !== undefined) {
    return 'Title and description saved.'
  }
  if (body.platforms !== undefined) return 'Platforms updated.'
  if (body.rules !== undefined) return 'Campaign rules saved.'
  if (body.assetUrls !== undefined) return 'Asset link saved.'
  if (body.referenceLinks !== undefined) return 'Reference links saved.'
  if (body.ratePer1k !== undefined) return 'Gross rate updated.'
  return 'Campaign updated.'
}

export function brandCampaignCheckoutToastMessage(intent: BrandCampaignCheckoutBody['intent']) {
  if (intent === 'initial_publish') {
    return 'Redirecting to checkout. The campaign goes live once payment is confirmed.'
  }
  return 'Redirecting to checkout. You will return to this page when payment finishes.'
}

export function brandCampaignRefundSuccessMessage(
  result: BrandCampaignRefundData,
  campaign?: BrandCampaignDetailDto
) {
  const refunded = Number(result.refunded) || 0
  let message = `${formatPHP(refunded, { decimals: false })} refund initiated.`

  if (campaign?.status === 'active') {
    message
  }
  return message
}

export function brandCampaignSyncCheckoutToast(
  data: BrandCampaignSyncCheckoutData,
  externalId: string
): { type: 'success' | 'info' | 'error'; message: string } | null {
  if (data.applied) {
    return { type: 'success', message: 'Added to campaign budget.' }
  }

  const row = data.items.find((t) => t.externalId === externalId)
  if (!row) return { type: 'error', message: 'Could not apply credit.' }

  if (row.status === 'completed') {
    return { type: 'success', message: 'Already credited.' }
  }
  if (
    row.status === 'awaiting_credit' ||
    row.status === 'awaiting_payment' ||
    row.status === 'pending'
  ) {
    return { type: 'info', message: 'Not paid yet. Finish checkout or try again shortly.' }
  }
  return { type: 'error', message: 'Could not apply credit.' }
}
