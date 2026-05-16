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

/** Maps backend conflict / validation messages to user-facing copy. */
export function brandCampaignApiErrorMessage(err: unknown): string {
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
    case 'already_paying':
      return 'A payout is already in progress for this submission.'
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
