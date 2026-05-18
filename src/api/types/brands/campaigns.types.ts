import type { CampaignStatus, Platform } from '@/api/types/shared'

export type BrandCampaignCardDto = {
  id: string
  status: CampaignStatus
  brandName: string
  title: string
  description: string
  coverImageObjectKey: string | null
  coverImageUrl: string | null
  coverImageFallbackUrl?: string | null
  goalViews: string
  fundedViewsTotal: string
  platforms: Platform[]
  updatedAt: string
}

export type BrandCampaignsListData = {
  items: BrandCampaignCardDto[]
}

/** `POST /brands/campaigns` request body. */
export type CreateBrandCampaignBody = {
  title: string
  description: string
  ratePer1k: number
  plannedGrossBudget: number
  platforms: Platform[]
  rules: string[]
  referenceLinks?: string[]
  assetUrls?: string[]
  coverImageObjectKey?: string
}

export type BrandCampaignDetailDto = {
  id: string
  brandUserId: string
  brandName: string
  title: string
  description: string
  ratePer1k: string
  grossBudget: string
  spentBudget: string
  plannedGrossBudget: string
  goalViews: string
  platforms: Platform[]
  rules: string[]
  status: CampaignStatus
  referenceLinks: string[] | null
  assetUrls: string[] | null
  coverImageObjectKey: string | null
  coverImageUrl: string | null
  coverImageFallbackUrl?: string | null
  netBudget: string
  reservedBudget: string
  availableBudget: string
  /** Net pool minus amount locked in a pending brand refund. */
  payoutPoolBudget: string
  /** Net amount held while a brand refund payout is in flight. */
  pendingRefundBudget: string
  /** True while a brand balance refund payout is in flight (Xendit disbursement pending). */
  refundInProgress: boolean
  /** False while a paid deposit is waiting for Xendit split to the brand sub-account. */
  xenditPoolSettled: boolean
  createdAt: string
  updatedAt: string
}

export type CreateBrandCampaignData = {
  campaign: BrandCampaignDetailDto
}

export type PatchBrandCampaignBody = {
  title?: string
  description?: string
  platforms?: Platform[]
  ratePer1k?: number
  plannedGrossBudget?: number
  rules?: string[]
  referenceLinks?: string[] | null
  assetUrls?: string[] | null
  coverImageObjectKey?: string | null
  status?: CampaignStatus
}

export type BrandCampaignCheckoutBody = {
  grossAmount: number
  intent?: 'add_funds' | 'initial_publish'
}

export type BrandCampaignCheckoutData = {
  checkoutUrl: string
  sessionId: string
  invoiceId: string
}

export type BrandCampaignReleasePayoutData = {
  released: number
}

export type BrandCampaignRefundData = {
  refunded: string
  /** Xendit payout id when disbursement was initiated (omitted in some error paths). */
  payoutId?: string
}

export type BrandCampaignTransactionKind =
  | 'initial_fund'
  | 'top_up'
  | 'refund'
  | 'refund_processing'
  | 'creator_payout'
  | 'payout_failed'

export type BrandCampaignTransactionStatus =
  | 'completed'
  | 'pending'
  | 'failed'
  | 'expired'
  | 'awaiting_payment'
  | 'awaiting_credit'

export type BrandCampaignTransaction = {
  id: string
  kind: BrandCampaignTransactionKind
  status: BrandCampaignTransactionStatus
  /** Signed gross PHP (campaign pool ledger). */
  amountGross: string
  /** Signed PHP for display — net credited/sent where applicable; checkout gross while unpaid. */
  amountDisplay: string
  createdAt: string
  description: string
  externalId?: string
  canSync: boolean
  checkoutUrl?: string
  failureReason?: string
}

export type BrandCampaignTransactionsData = {
  items: BrandCampaignTransaction[]
}

export type BrandCampaignSyncCheckoutData = BrandCampaignTransactionsData & {
  applied: boolean
}
