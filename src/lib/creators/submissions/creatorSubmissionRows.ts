import type { CreatorSubmissionRow, MeSubmissionDto } from '@/api/types/creator/submissions.types'

export function creatorSubmissionRowFromApi(dto: MeSubmissionDto): CreatorSubmissionRow {
  return {
    id: dto.id,
    campaignId: dto.campaignId,
    campaignTitle: dto.campaignTitle,
    brandName: dto.brandName,
    url: dto.postUrl,
    platform: dto.platform,
    views: Number(dto.viewsLocked) || 0,
    earnings: Number(dto.payout) || 0,
    status: dto.status,
    submittedAt: dto.submittedAt,
  }
}
