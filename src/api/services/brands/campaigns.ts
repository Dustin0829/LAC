import api from '@/api/client'
import type { BrandCampaignsListData } from '@/api/types/brands/campaigns.types'

export async function getBrandCampaigns(): Promise<BrandCampaignsListData> {
  const res = await api.get<BrandCampaignsListData>('/brands/campaigns')
  return res.data
}
