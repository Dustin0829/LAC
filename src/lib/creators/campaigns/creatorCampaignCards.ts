import type {
  DiscoverCampaignDetailDto,
  DiscoverCampaignPreviewCardDto,
} from '@/api/types/campaigns.types'
import type { Campaign } from '@/lib/campaigns/types'

const COVER_GRADIENTS = [
  'from-orange-950 to-amber-800',
  'from-blue-900 to-indigo-950',
  'from-emerald-950 to-teal-800',
  'from-rose-950 to-pink-900',
  'from-violet-950 to-purple-900',
] as const

function coverColorForId(id: string): string {
  let index = 0
  for (let i = 0; i < id.length; i++) {
    index = (index + id.charCodeAt(i)) % COVER_GRADIENTS.length
  }
  return COVER_GRADIENTS[index]!
}

/** Maps public discover card → `Campaign` for creator `CampaignCard`. */
export function creatorCampaignCardFromApi(dto: DiscoverCampaignPreviewCardDto): Campaign {
  return {
    id: dto.id,
    brandId: '',
    brandName: dto.brandName,
    title: dto.title,
    description: dto.description,
    ratePer1k: 0,
    budget: Number(dto.totalBudget) || 0,
    spent: Number(dto.consumedBudget) || 0,
    campaignViews: 0,
    estimatedReach: 0,
    platforms: dto.platforms,
    status: dto.status,
    startDate: dto.updatedAt,
    endDate: dto.updatedAt,
    rules: [],
    coverColor: coverColorForId(dto.id),
    coverImageUrl: dto.coverImageUrl ?? undefined,
    coverImageFallbackUrl: dto.coverImageFallbackUrl ?? undefined,
  }
}

/** Maps public discover detail → `Campaign` for creator campaign detail UI. */
export function creatorCampaignDetailFromApi(dto: DiscoverCampaignDetailDto): Campaign {
  return {
    ...creatorCampaignCardFromApi(dto),
    ratePer1k: Number(dto.ratePer1k) || 0,
    rules: dto.rules ?? [],
    referenceLinks: dto.referenceLinks?.length ? dto.referenceLinks : undefined,
    assetUrl: dto.assetUrls?.[0],
  }
}
