import type { CampaignStatus } from '@/api/types/shared'

/** Brand-facing label for campaign status chips. */
export function campaignStatusLabel(status: CampaignStatus): string {
  if (status === 'funding_pending') return 'Activating'
  return status
}
