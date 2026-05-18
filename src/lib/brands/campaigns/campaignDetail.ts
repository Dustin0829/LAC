/** Business days to wait before refund / release payout (GCash T+2 estimate). */
export const CAMPAIGN_SETTLEMENT_BUSINESS_DAYS = 2

const CAMPAIGN_REFUND_SETTLING_BASE =
  'Refund will be available at least 2 business days after campaign creation.'

const CAMPAIGN_PAYOUT_RELEASE_SETTLING_BASE =
  'Release payout will be available at least 2 business days after campaign creation.'

const CAMPAIGN_REFUND_SETTLING_PAST_WINDOW =
  'Your payment is still settling with our provider. Refund will be available shortly — please try again later.'

const CAMPAIGN_PAYOUT_RELEASE_SETTLING_PAST_WINDOW =
  'Your payment is still settling with our provider. Release payout will be available shortly — please try again later.'

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/** Adds calendar days, skipping Saturday and Sunday. */
export function addBusinessDays(from: Date, businessDays: number): Date {
  const result = new Date(from)
  let added = 0
  while (added < businessDays) {
    result.setDate(result.getDate() + 1)
    if (!isWeekend(result)) added++
  }
  return result
}

export function campaignSettlementAvailableAt(createdAt: string | Date): Date {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt
  return addBusinessDays(created, CAMPAIGN_SETTLEMENT_BUSINESS_DAYS)
}

export function isPastCampaignSettlementWindow(
  createdAt: string | Date,
  now: Date = new Date()
): boolean {
  return now.getTime() >= campaignSettlementAvailableAt(createdAt).getTime()
}

function formatCampaignSettlingToast(
  base: string,
  pastWindow: string,
  createdAt?: string | Date,
  now: Date = new Date()
): string {
  if (!createdAt) return base
  if (isPastCampaignSettlementWindow(createdAt, now)) return pastWindow
  return base
}

export function formatCampaignRefundSettlingToast(createdAt?: string | Date): string {
  return formatCampaignSettlingToast(
    CAMPAIGN_REFUND_SETTLING_BASE,
    CAMPAIGN_REFUND_SETTLING_PAST_WINDOW,
    createdAt
  )
}

export function formatCampaignPayoutReleaseSettlingToast(createdAt?: string | Date): string {
  return formatCampaignSettlingToast(
    CAMPAIGN_PAYOUT_RELEASE_SETTLING_BASE,
    CAMPAIGN_PAYOUT_RELEASE_SETTLING_PAST_WINDOW,
    createdAt
  )
}

function isTechnicalErrorMessage(message: string): boolean {
  if (!message || message.length > 120) return true
  return (
    /xendit/i.test(message) ||
    /api key/i.test(message) ||
    /invalid_api_key/i.test(message) ||
    /prisma/i.test(message) ||
    /invocation/i.test(message) ||
    message.includes('{') ||
    message.includes('http')
  )
}

export type BrandCampaignApiErrorContext = {
  createdAt?: string
  /** Which settling action triggered the error (defaults to refund copy). */
  settlingAction?: 'refund' | 'payout'
}

/** Maps backend conflict / validation messages to user-facing copy. */
export function brandCampaignApiErrorMessage(
  err: unknown,
  context?: BrandCampaignApiErrorContext
): string {
  const message = err instanceof Error ? err.message : ''
  switch (message) {
    case 'campaign_details_locked':
      return 'Campaign details can only be edited while the campaign is a draft or has no submissions yet.'
    case 'nothing_to_pay':
      return 'Nothing to pay — there are no pending submissions ready for payout.'
    case 'No available balance':
      return 'There is no available balance to refund.'
    case 'payment_method_required':
      return 'Add a refund receiving account on Brand account before refunding.'
    case 'refund_in_progress':
      return 'A refund is already in progress for this campaign. Wait for it to finish before trying again.'
    case 'below_minimum_payout':
      return 'The available balance is below the minimum amount for a bank or e-wallet transfer.'
    case 'above_maximum_payout':
      return 'The refund amount exceeds the limit for your selected payout channel.'
    case 'insufficient_pool':
      return 'Not enough campaign balance to release these payouts.'
    case 'xendit_settlement_pending':
      return context?.settlingAction === 'payout'
        ? formatCampaignPayoutReleaseSettlingToast(context?.createdAt)
        : formatCampaignRefundSettlingToast(context?.createdAt)
    case 'already_paying':
      return 'A payout is already in progress for this submission.'
    case 'submission_not_rejected':
      return 'Only rejected submissions can be restored.'
    case 'duplicate_submission':
      return 'This creator already has another active submission for the same content.'
    case 'Cannot reject paid submission':
      return 'Paid submissions cannot be rejected.'
    case 'We could not reach the payment provider. Try again in a moment.':
      return 'Could not verify payment. Try again in a moment.'
    default:
      if (isTechnicalErrorMessage(message)) {
        return 'Something went wrong. Please try again.'
      }
      return message || 'Something went wrong. Please try again.'
  }
}
