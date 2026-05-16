import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getBrandCampaignSubmissions,
  getBrandRecentSubmissions,
  rejectBrandCampaignSubmission,
} from '@/api/services/brands/submissions'
import type { RejectBrandSubmissionBody } from '@/api/types/brands/submissions.types'
import { brandCampaignsQueryKeys } from '@/api/queries/brands/use-campaigns'
import type {
  ListBrandCampaignSubmissionsParams,
  ListBrandRecentSubmissionsParams,
} from '@/api/types/brands/submissions.types'
import { brandCampaignApiErrorMessage } from '@/lib/brands/campaigns/campaignDetail'
import { brandSubmissionRowFromApi } from '@/lib/brands/submissions/brandSubmissionRows'
import { toast } from 'sonner'
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

/** Reject a submission (`POST …/submissions/:submissionId/reject`). */
export function useRejectBrandCampaignSubmission(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...brandSubmissionsQueryKeys.all, 'reject', campaignId] as const,
    mutationFn: (vars: { submissionId: string; body: RejectBrandSubmissionBody }) =>
      rejectBrandCampaignSubmission(campaignId, vars.submissionId, vars.body),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: brandSubmissionsQueryKeys.campaign(campaignId, {}),
      })
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.detail(campaignId) })
      toast.success('Submission rejected.')
    },
    onError: (err) => toast.error(brandCampaignApiErrorMessage(err)),
  })
}
