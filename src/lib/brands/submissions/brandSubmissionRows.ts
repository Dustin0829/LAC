import type { BrandSubmissionDto, BrandSubmissionRow } from '@/api/types/brands/submissions.types'

/** Row shape for brand dashboard / campaign submission tables. */
export function brandSubmissionRowFromApi(dto: BrandSubmissionDto): BrandSubmissionRow {
  return {
    id: dto.id,
    campaignId: dto.campaignId,
    campaignTitle: dto.campaignTitle,
    creatorId: dto.creatorId,
    creatorName: dto.creatorName,
    creatorAvatarUrl: dto.creatorAvatarUrl ?? undefined,
    url: dto.postUrl,
    platform: dto.platform,
    views: Number(dto.viewsLocked) || 0,
    payoutGross: Number(dto.grossAmount) || 0,
    status: dto.status,
    submittedAt: dto.submittedAt,
  }
}
