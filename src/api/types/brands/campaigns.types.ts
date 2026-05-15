import type { CampaignStatus, Platform } from '@/lib/mockData'

export type BrandCampaignCardDto = {
  id: string
  status: CampaignStatus
  brandName: string
  title: string
  description: string
  coverImageObjectKey: string | null
  coverImageUrl: string | null
  goalViews: string
  fundedViewsTotal: string
  platforms: Platform[]
  updatedAt: string
}

export type BrandCampaignsListData = {
  items: BrandCampaignCardDto[]
}
