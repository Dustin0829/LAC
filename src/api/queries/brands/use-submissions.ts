import { useQuery } from '@tanstack/react-query'
import { getBrandCampaignSubmissions, getBrandRecentSubmissions } from '@/api/services/brands/submissions'
import type {
  ListBrandCampaignSubmissionsParams,
  ListBrandRecentSubmissionsParams,
} from '@/api/types/brands/submissions.types'
import { brandSubmissionRowFromApi } from '@/lib/brandSubmissions/brandSubmissionRows'
import { useBrandAuthEnabled } from '@/api/queries/brands/auth'

export const brandSubmissionsQueryKeys = {
  all: ['brands', 'submissions'] as const,
  recent: (params: ListBrandRecentSubmissionsParams) =>
    [...brandSubmissionsQueryKeys.all, 'recent', params] as const,
  campaign: (campaignId: string, params: ListBrandCampaignSubmissionsParams) =>
    [...brandSubmissionsQueryKeys.all, 'campaign', campaignId, params] as const,
}

/** Brand dashboard — recent submissions across all campaigns (`GET /brands/submissions`). */
export function useBrandRecentSubmissions(params: ListBrandRecentSubmissionsParams) {
  const enabled = useBrandAuthEnabled()

  return useQuery({
    queryKey: brandSubmissionsQueryKeys.recent(params),
    queryFn: async () => {
      const { items, meta } = await getBrandRecentSubmissions(params)
      return {
        rows: items.map(brandSubmissionRowFromApi),
        meta,
      }
    },
    enabled,
  })
}

/** Campaign detail — submissions for one campaign (`GET /brands/campaigns/:id/submissions`). */
export function useBrandCampaignSubmissions(
  campaignId: string,
  params: ListBrandCampaignSubmissionsParams = {},
  enabled = true
) {
  const brandEnabled = useBrandAuthEnabled()

  return useQuery({
    queryKey: brandSubmissionsQueryKeys.campaign(campaignId, params),
    queryFn: async () => {
      const data = await getBrandCampaignSubmissions(campaignId, params)
      return data.items.map(brandSubmissionRowFromApi)
    },
    enabled: enabled && brandEnabled && Boolean(campaignId),
  })
}
