import type { PaginationMeta } from '@/api/types/global.types'
import type { ContentStatus, Platform } from '@/api/types/shared'

export type MeSubmissionDto = {
  id: string
  campaignId: string
  campaignTitle: string
  campaignStatus: string
  brandName: string
  normalizedUrl: string
  postUrl: string
  platform: Platform
  viewsLocked: string
  fundedViews: string
  payout: string
  partialReason: string | null
  status: ContentStatus
  rejectionReason: string | null
  submittedAt: string
  paidAt: string | null
}

export type MeSubmissionsListData = {
  items: MeSubmissionDto[]
}

export type ListMeSubmissionsParams = {
  page?: number
  limit?: number
  status?: 'pending' | 'paid' | 'rejected'
  scope?: 'recent'
}

export type CreatorSubmissionRow = {
  id: string
  campaignId: string
  campaignTitle: string
  brandName: string
  url: string
  platform: Platform
  views: number
  earnings: number
  status: ContentStatus
  submittedAt: string
}

export type MeSubmissionsQueryResult = {
  rows: CreatorSubmissionRow[]
  meta: PaginationMeta
}
