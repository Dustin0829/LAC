import type { BrandCampaignCardDto } from '@/api/types/brands/campaigns.types'
import type { Campaign } from '@/lib/mockData'

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

/** Maps list card DTO → `Campaign` shape for `CampaignCard` (brand list). */
export function brandCampaignCardFromApi(dto: BrandCampaignCardDto, brandUserId: string): Campaign {
  const campaignViews = Number(dto.fundedViewsTotal) || 0
  const estimatedReach = Number(dto.goalViews) || 0

  return {
    id: dto.id,
    brandId: brandUserId,
    brandName: dto.brandName,
    brandLogoColor: coverColorForId(dto.id),
    title: dto.title,
    description: dto.description,
    ratePer1k: 0,
    budget: 0,
    spent: 0,
    campaignViews,
    estimatedReach,
    platforms: dto.platforms,
    status: dto.status,
    startDate: dto.updatedAt,
    endDate: dto.updatedAt,
    rules: [],
    coverColor: coverColorForId(`${dto.id}-cover`),
    coverImageUrl: dto.coverImageUrl ?? undefined,
  }
}
