import api from '@/api/client'
import type { ListCampaignsData, ListCampaignsParams } from '@/api/types/campaigns.types'

/** Public campaign discover list (`GET /campaigns`). No auth required. */
export async function getCampaigns(params: ListCampaignsParams): Promise<ListCampaignsData> {
  const res = await api.get<ListCampaignsData>('/campaigns', { params })
  return res.data
}
