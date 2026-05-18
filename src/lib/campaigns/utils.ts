import {
  CREATOR_PAYOUT_SHARE,
  MIN_PUBLISH_PHP,
  PLATFORM_DEPOSIT_FEE_PERCENT,
  getPlatformFeePercent,
} from '@/lib/constants'
import type { Campaign } from '@/lib/campaigns/types'

export { MIN_PUBLISH_PHP } from '@/lib/constants'

/**
 * Gross budget to pre-fill Fund & Publish (create page “Total budget”).
 * Uses `plannedGrossBudget` when set; otherwise infers from net `budget` and intake fee.
 */
export function getPlannedGrossBudgetForFunding(
  campaign: Pick<Campaign, 'plannedGrossBudget' | 'budget' | 'grossBudget' | 'platformFeePercent'>
): number {
  if (
    typeof campaign.plannedGrossBudget === 'number' &&
    Number.isFinite(campaign.plannedGrossBudget) &&
    campaign.plannedGrossBudget > 0
  ) {
    return Math.round(campaign.plannedGrossBudget)
  }
  const fee = campaign.platformFeePercent ?? getPlatformFeePercent()
  const net = Math.max(0, campaign.budget)
  if (fee >= 1) return MIN_PUBLISH_PHP
  const inferred = Math.round(net / (1 - fee))
  return Math.max(MIN_PUBLISH_PHP, inferred || MIN_PUBLISH_PHP)
}

export function getCreatorRatePer1k(brandGrossPer1k: number): number {
  return Math.round(brandGrossPer1k * CREATOR_PAYOUT_SHARE * 100) / 100
}

/** Brand-facing ₱/1k on cards/detail — same as stored `campaign.ratePer1k` (gross). */
export function brandHeadlineRatePer1k(campaign: Pick<Campaign, 'ratePer1k'>): number {
  return campaign.ratePer1k
}

/** Creator-facing ₱/1k on discover/detail — 80% of brand gross (default performance split). */
export function creatorHeadlineRatePer1k(campaign: Pick<Campaign, 'ratePer1k'>): number {
  return getCreatorRatePer1k(campaign.ratePer1k)
}

export function getNetSpendable(grossFunding: number): number {
  return Math.round(grossFunding * (1 - PLATFORM_DEPOSIT_FEE_PERCENT))
}

export type CampaignReachGoalContext = {
  countedViews?: number
  reservedBalance?: number
  paidOut?: number
  /** Net payout pool from API (`payoutPoolBudget`). */
  payoutPool?: number
}

/**
 * Reach bar denominator. Returns 0 (UI shows —) when nothing is funded or consumed;
 * otherwise API `goalViews` or counted views when only views remain.
 */
export function getCampaignReachViewGoal(
  campaign: Pick<Campaign, 'estimatedReach' | 'status' | 'grossBudget'>,
  context?: CampaignReachGoalContext
): number {
  const gross = campaign.grossBudget ?? 0
  if (campaign.status === 'draft' && gross <= 0) return 0

  const apiGoal = Math.max(0, campaign.estimatedReach)
  if (apiGoal > 0) return apiGoal

  const counted = context?.countedViews ?? 0
  const reserved = context?.reservedBalance ?? 0
  const paidOut = context?.paidOut ?? 0
  const payoutPool = context?.payoutPool ?? 0

  const hasFundedBalance = payoutPool > 0 || reserved > 0 || paidOut > 0
  const hasConsumedViews = counted > 0

  if (!hasFundedBalance && !hasConsumedViews) return 0

  if (hasFundedBalance) {
    return counted
  }

  return counted
}

/**
 * View count the given spendable pool can fund at this brand headline CPV (₱ gross per 1k views).
 */
export function estimatedReachViewsFromNetPool(poolForCpv: number, brandRatePer1k: number): number {
  const cpv = brandRatePer1k / 1000
  if (!(cpv > 0) || !Number.isFinite(poolForCpv) || poolForCpv <= 0) return 1
  return Math.max(1, Math.floor(poolForCpv / cpv))
}
