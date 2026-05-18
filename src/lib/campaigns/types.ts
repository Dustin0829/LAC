import type { CampaignStatus, ContentStatus, Platform } from '@/api/types/shared'

/** UI view model for campaign cards and brand detail (mapped from API DTOs). */
export interface Campaign {
  id: string
  brandId: string
  brandName: string
  title: string
  description: string
  /** Brand gross ₱ per 1,000 views. */
  ratePer1k: number
  /** Net campaign pool (₱). */
  budget: number
  grossBudget?: number
  platformFeePercent?: number
  spent: number
  reservedBalance?: number
  plannedGrossBudget?: number
  /** Funded views total (list cards) or 0 on detail until wired. */
  campaignViews: number
  /** Reach bar cap from API `goalViews`. */
  estimatedReach: number
  platforms: Platform[]
  status: CampaignStatus
  /** Creator discover sort key (mock); brand maps from API timestamps. */
  startDate: string
  endDate: string
  rules: string[]
  referenceLinks?: string[]
  assetUrl?: string
  coverColor: string
  coverImageUrl?: string
}

/** Creator submissions mock row until creator submissions API ships. */
export interface Content {
  id: string
  campaignId: string
  campaignTitle: string
  brandName: string
  creatorId: string
  creatorName: string
  creatorAvatarUrl?: string
  url: string
  platform: Platform
  views: number
  earnings: number
  status: ContentStatus
  submittedAt: string
  thumbnailColor: string
}

/** Creator account connected platforms (mapped from `GET /me` + defaults). */
export interface CreatorPlatformLink {
  platform: Platform
  label: string
  handle: string
  status: 'connected' | 'reconnect' | 'pending_page'
  connectedAt?: string
}
