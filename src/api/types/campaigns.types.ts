import type { CampaignStatus, Platform } from '@/api/types/shared'

/** Query for public `GET /campaigns` (matches backend `listCampaignsQuerySchema`). */
export type DiscoverCampaignStatusFilter = 'all' | Extract<CampaignStatus, 'active' | 'paused' | 'ended'>

export type DiscoverCampaignSort = 'newest' | 'highest_rate'

export interface ListCampaignsParams {
  status?: DiscoverCampaignStatusFilter
  platform?: Platform
  sort?: DiscoverCampaignSort
}

/** Public discover list card (`GET /campaigns` item). */
export interface DiscoverCampaignPreviewCardDto {
  id: string
  brandName: string
  title: string
  description: string
  status: Extract<CampaignStatus, 'active' | 'paused' | 'ended'>
  platforms: Platform[]
  coverImageUrl: string | null
  brandLogoUrl: string | null
  /** Net pool after platform deposit fee. */
  totalBudget: string
  /** Paid out + reserved for in-flight submissions. */
  consumedBudget: string
  updatedAt: string
}

export interface ListCampaignsData {
  items: DiscoverCampaignPreviewCardDto[]
  limit: number
  filters: {
    status: DiscoverCampaignStatusFilter
    platform: Platform | null
    sort: DiscoverCampaignSort
  }
}
