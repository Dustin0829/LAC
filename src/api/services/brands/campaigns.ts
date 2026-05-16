import api from '@/api/client'
import type {
  BrandCampaignCheckoutBody,
  BrandCampaignCheckoutData,
  BrandCampaignDetailDto,
  BrandCampaignRefundData,
  BrandCampaignReleasePayoutData,
  BrandCampaignSyncCheckoutData,
  BrandCampaignTransactionsData,
  BrandCampaignsListData,
  CreateBrandCampaignBody,
  CreateBrandCampaignData,
  PatchBrandCampaignBody,
} from '@/api/types/brands/campaigns.types'

export async function getBrandCampaigns(): Promise<BrandCampaignsListData> {
  const res = await api.get<BrandCampaignsListData>('/brands/campaigns')
  return res.data
}

export async function getBrandCampaign(campaignId: string): Promise<BrandCampaignDetailDto> {
  const res = await api.get<{ campaign: BrandCampaignDetailDto }>(`/brands/campaigns/${campaignId}`)
  return res.data.campaign
}

export async function createBrandCampaign(
  body: CreateBrandCampaignBody
): Promise<CreateBrandCampaignData> {
  const res = await api.post<CreateBrandCampaignData>('/brands/campaigns', body)
  return res.data
}

export async function patchBrandCampaign(
  campaignId: string,
  body: PatchBrandCampaignBody
): Promise<CreateBrandCampaignData> {
  const res = await api.patch<CreateBrandCampaignData>(`/brands/campaigns/${campaignId}`, body)
  return res.data
}

export async function createBrandCampaignCheckout(
  campaignId: string,
  body: BrandCampaignCheckoutBody
): Promise<BrandCampaignCheckoutData> {
  const res = await api.post<BrandCampaignCheckoutData>(
    `/brands/campaigns/${campaignId}/checkout`,
    body
  )
  return res.data
}

export async function releaseBrandCampaignPayout(
  campaignId: string
): Promise<BrandCampaignReleasePayoutData> {
  const res = await api.post<BrandCampaignReleasePayoutData>(
    `/brands/campaigns/${campaignId}/release-payout`
  )
  return res.data
}

export async function refundBrandCampaign(campaignId: string): Promise<BrandCampaignRefundData> {
  const res = await api.post<BrandCampaignRefundData>(`/brands/campaigns/${campaignId}/refund`)
  return res.data
}

export async function getBrandCampaignTransactions(
  campaignId: string
): Promise<BrandCampaignTransactionsData> {
  const res = await api.get<BrandCampaignTransactionsData>(
    `/brands/campaigns/${campaignId}/transactions`
  )
  return res.data
}

export async function syncBrandCampaignCheckout(
  campaignId: string,
  externalId: string
): Promise<BrandCampaignSyncCheckoutData> {
  const res = await api.post<BrandCampaignSyncCheckoutData>(
    `/brands/campaigns/${campaignId}/checkout/${encodeURIComponent(externalId)}/sync`
  )
  return res.data
}
