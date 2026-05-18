import type {
  BrandCampaignCardDto,
  BrandCampaignDetailDto,
} from '@/api/types/brands/campaigns.types'
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

/** Maps list card DTO → `Campaign` shape for `CampaignCard` (brand list). */
export function brandCampaignCardFromApi(dto: BrandCampaignCardDto, brandUserId: string): Campaign {
  const campaignViews = Number(dto.fundedViewsTotal) || 0
  const estimatedReach = dto.status === 'draft' ? 0 : Number(dto.goalViews) || 0

  return {
    id: dto.id,
    brandId: brandUserId,
    brandName: dto.brandName,
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
    coverImageFallbackUrl: dto.coverImageFallbackUrl ?? undefined,
  }
}

/** Maps detail DTO → `Campaign` shape for brand campaign detail UI. */
export function brandCampaignDetailFromApi(
  dto: BrandCampaignDetailDto,
  brandUserId: string
): Campaign {
  const gross = Number(dto.grossBudget) || 0
  const net = Number(dto.netBudget) || 0
  const spent = Number(dto.spentBudget) || 0
  const reserved = Number(dto.reservedBudget) || 0
  const rate = Number(dto.ratePer1k) || 0
  const plannedGross = Number(dto.plannedGrossBudget) || 0
  const goalViews = Number(dto.goalViews) || 0
  const isFunded = gross > 0

  return {
    id: dto.id,
    brandId: brandUserId,
    brandName: dto.brandName,
    title: dto.title,
    description: dto.description,
    ratePer1k: rate,
    budget: net,
    grossBudget: gross,
    plannedGrossBudget: plannedGross > 0 ? plannedGross : undefined,
    spent,
    reservedBalance: reserved,
    campaignViews: 0,
    estimatedReach: isFunded ? goalViews : 0,
    platforms: dto.platforms,
    status: dto.status,
    startDate: dto.createdAt,
    endDate: dto.updatedAt,
    rules: dto.rules,
    referenceLinks: dto.referenceLinks ?? undefined,
    assetUrl: dto.assetUrls?.[0],
    coverColor: coverColorForId(`${dto.id}-cover`),
    coverImageUrl: dto.coverImageUrl ?? undefined,
    coverImageFallbackUrl: dto.coverImageFallbackUrl ?? undefined,
  }
}
