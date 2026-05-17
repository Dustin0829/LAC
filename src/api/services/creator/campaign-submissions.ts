import api from '@/api/client'
import type {
  CampaignSubmissionBody,
  CampaignSubmissionConfirmData,
  CampaignSubmissionPreviewData,
} from '@/api/types/creator/campaign-submissions.types'

export async function postCampaignSubmissionPreview(
  campaignId: string,
  body: CampaignSubmissionBody
): Promise<CampaignSubmissionPreviewData> {
  const res = await api.post<CampaignSubmissionPreviewData>(
    `/campaigns/${campaignId}/submissions/preview`,
    body
  )
  return res.data
}

export async function postCampaignSubmission(
  campaignId: string,
  body: CampaignSubmissionBody
): Promise<CampaignSubmissionConfirmData> {
  const res = await api.post<CampaignSubmissionConfirmData>(
    `/campaigns/${campaignId}/submissions`,
    body
  )
  return res.data
}
