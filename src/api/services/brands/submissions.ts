import api from '@/api/client'
import type {
  BrandCampaignSubmissionsData,
  BrandRecentSubmissionsData,
  ListBrandCampaignSubmissionsParams,
  ListBrandRecentSubmissionsParams,
  PaginationMeta,
} from '@/api/types/brands/submissions.types'

export async function getBrandRecentSubmissions(
  params: ListBrandRecentSubmissionsParams = {}
): Promise<{ items: BrandRecentSubmissionsData['items']; meta: PaginationMeta }> {
  const res = await api.get<BrandRecentSubmissionsData>('/brands/submissions', { params })
  const meta = (res as { meta?: PaginationMeta }).meta
  if (!meta) {
    throw new Error('Missing pagination metadata from submissions list.')
  }
  return { items: res.data.items, meta }
}

export async function getBrandCampaignSubmissions(
  campaignId: string,
  params: ListBrandCampaignSubmissionsParams = {}
): Promise<BrandCampaignSubmissionsData> {
  const res = await api.get<BrandCampaignSubmissionsData>(
    `/brands/campaigns/${campaignId}/submissions`,
    { params }
  )
  return res.data
}
