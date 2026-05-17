import api from '@/api/client'
import type {
  GetCampaignData,
  ListCampaignsData,
  ListCampaignsParams,
} from '@/api/types/campaigns.types'

/** Public campaign discover list (`GET /campaigns`). No auth required. */
export async function getCampaigns(params: ListCampaignsParams): Promise<ListCampaignsData> {
  const res = await api.get<ListCampaignsData>('/campaigns', { params })
  return res.data
}

/** Public campaign discover detail (`GET /campaigns/:id`). No auth required. */
export async function getCampaign(campaignId: string): Promise<GetCampaignData> {
  const res = await api.get<GetCampaignData>(`/campaigns/${campaignId}`)
  return res.data
}
