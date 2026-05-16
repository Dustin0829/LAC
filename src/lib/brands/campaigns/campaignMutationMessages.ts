import type {
  BrandCampaignCheckoutBody,
  BrandCampaignDetailDto,
  BrandCampaignRefundData,
  BrandCampaignSyncCheckoutData,
  PatchBrandCampaignBody,
} from '@/api/types/brands/campaigns.types'
import { formatPHP } from '@/lib/utils'

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
    return 'Complete payment in the checkout window. The campaign goes live once Xendit confirms payment.'
  }
  return 'Complete payment in the checkout window. This page will refresh when you return.'
}

export function brandCampaignRefundSuccessMessage(
  result: BrandCampaignRefundData,
  campaign?: BrandCampaignDetailDto
) {
  const refunded = Number(result.refunded) || 0
  let message =
    `${formatPHP(refunded, { decimals: false })} refund initiated.` +
    (result.payoutId
      ? ' You will receive it once Xendit confirms the transfer (usually within minutes).'
      : '')
  if (campaign?.status === 'active') {
    message += ' Campaign may auto-pause if spendable drops below the publish floor.'
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
