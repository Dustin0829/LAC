import type { PaginationMeta } from '@/api/types/global.types'
import type { ContentStatus, Platform } from '@/api/types/shared'

export type { PaginationMeta }

export type BrandSubmissionStatus = 'pending' | 'paying' | 'paid' | 'payout_failed' | 'rejected'

export type BrandSubmissionDto = {
  id: string
  campaignId: string
  campaignTitle: string
  creatorId: string
  creatorName: string
  creatorAvatarUrl: string | null
  normalizedUrl: string
  postUrl: string
  platform: Platform
  viewsLocked: string
  fundedViews: string
  grossAmount: string
  creatorNet: string
  partialReason: 'pool_exhausted' | 'channel_max' | null
  status: BrandSubmissionStatus
  submittedAt: string
}

export type BrandSubmissionRow = {
  id: string
  campaignId: string
  campaignTitle: string
  creatorId: string
  creatorName: string
  creatorAvatarUrl?: string
  url: string
  platform: Platform
  views: number
  payoutGross: number
  status: ContentStatus
  submittedAt: string
}

export type BrandCampaignSubmissionsData = {
  items: BrandSubmissionDto[]
}

export type BrandRecentSubmissionsData = {
  items: BrandSubmissionDto[]
}

export type ListBrandRecentSubmissionsParams = {
  page?: number
  limit?: number
  status?: BrandSubmissionStatus
}

export type ListBrandCampaignSubmissionsParams = {
  status?: BrandSubmissionStatus
}

export type RejectBrandSubmissionBody = {
  reason: string
}
