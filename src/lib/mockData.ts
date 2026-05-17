/**
 * Prototype fixtures for creator flows not yet on live API.
 * Brand surfaces use API data — import from `@/api/types`, `@/lib/campaigns/*`, `@/lib/constants`.
 */

export type { Platform, CampaignStatus, ContentStatus } from '@/api/types/shared'
export { PLATFORM_LABEL } from '@/lib/platforms/labels'
export { campaignStatusLabel } from '@/lib/campaigns/status'
export type { PaymentMethod } from '@/lib/paymentMethods/types'
export type { Campaign, Content, CreatorPlatformLink } from '@/lib/campaigns/types'

export {
  CREATOR_PAYOUT_SHARE as CREATOR_PAYOUT_PERCENT,
  CREATOR_PAYOUT_FEE_PERCENT as PERFORMANCE_FEE_PERCENT,
  PLATFORM_DEPOSIT_FEE_PERCENT as INTAKE_FEE_PERCENT,
  getPlatformFeePercent,
  MIN_PUBLISH_PHP,
} from '@/lib/constants'

export {
  getPlannedGrossBudgetForFunding,
  getCreatorRatePer1k,
  brandHeadlineRatePer1k,
  creatorHeadlineRatePer1k,
  getNetSpendable,
  getCampaignReachViewGoal,
  estimatedReachViewsFromNetPool,
} from '@/lib/campaigns/utils'

export type { CampaignReachGoalContext } from '@/lib/campaigns/utils'

import { getCreatorRatePer1k, estimatedReachViewsFromNetPool } from '@/lib/campaigns/utils'
import type { Campaign, Content, CreatorPlatformLink } from '@/lib/campaigns/types'

const COVER_COLORS = [
  'from-zinc-950 to-zinc-700',
  'from-neutral-900 to-stone-600',
  'from-slate-950 to-slate-600',
  'from-zinc-800 to-neutral-500',
  'from-stone-900 to-zinc-600',
  'from-neutral-950 to-zinc-800',
]

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function mockContentEarnings(views: number, ratePer1k: number): number {
  return Math.round((views / 1000) * ratePer1k * 100) / 100
}

const DEMO_CMP001_BRAND = 62
const DEMO_CMP001_CREATOR = getCreatorRatePer1k(DEMO_CMP001_BRAND)
const DEMO_CMP002_BRAND = 58
const DEMO_CMP002_CREATOR = getCreatorRatePer1k(DEMO_CMP002_BRAND)

export const mockCampaigns: Campaign[] = [
  {
    id: 'cmp-001',
    brandId: 'brand-1',
    brandName: 'Wok Bang',
    title: 'Kitchen Glow-Up ',
    description:
      'We want to show our new kitchen products in real cooking videos so people see what they look like on a stove and in a normal kitchen.',
    ratePer1k: DEMO_CMP001_BRAND,
    budget: 50_000,
    grossBudget: 58_824,
    platformFeePercent: 0.15,
    spent: 0,
    reservedBalance: 12_400,
    campaignViews: 100_000,
    estimatedReach: estimatedReachViewsFromNetPool(50_000, DEMO_CMP001_BRAND),
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(10),
    endDate: daysFromNow(26),
    referenceLinks: ['https://wokbang.com/products/kitchen-glow'],
    assetUrl: 'https://drive.google.com/folder/wokbang-assets',
    rules: [
      'Content must be at least 15 seconds long',
      'Tag @wokbangph in the caption',
      'Use #WokBangKitchen #LutoWithWokBang',
    ],
    coverColor: COVER_COLORS[0]!,
    coverImageUrl:
      'https://cdn.shopify.com/s/files/1/0573/6022/0319/products/01BlackCS_1.jpg?v=1645414098&width=1200',
  },
  {
    id: 'cmp-002',
    brandId: 'brand-2',
    brandName: 'Brew Theory',
    title: 'Cafe Vibes',
    description:
      'Short videos of drinks and food we serve, filmed in or in front of our cafes, with the branch name or link.',
    ratePer1k: DEMO_CMP002_BRAND,
    budget: 50_000,
    grossBudget: 58_824,
    platformFeePercent: 0.15,
    spent: 0,
    reservedBalance: 0,
    campaignViews: 0,
    estimatedReach: estimatedReachViewsFromNetPool(50_000, DEMO_CMP002_BRAND),
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(16),
    endDate: daysFromNow(44),
    assetUrl: 'https://drive.google.com/folder/brewtheory-assets',
    rules: ['Content must be at least 15 seconds long', 'Use #BrewTheoryCafe', 'Tag @brewtheoryph'],
    coverColor: COVER_COLORS[3]!,
    coverImageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  },
]

function defaultCreatorDemoAvatarUrl(creatorName: string): string {
  return `https://api.dicebear.com/7.x/notionists/png?seed=${encodeURIComponent(creatorName)}&size=128`
}

function withCreatorDemoAvatars(items: Content[]): Content[] {
  return items.map((c) => ({
    ...c,
    creatorAvatarUrl: c.creatorAvatarUrl ?? defaultCreatorDemoAvatarUrl(c.creatorName),
  }))
}

const rawMockContent: Content[] = [
  {
    id: 'content-001',
    campaignId: 'cmp-002',
    campaignTitle: 'Cafe Vibes',
    brandName: 'Brew Theory',
    creatorId: 'me',
    creatorName: 'You',
    url: 'https://www.tiktok.com/@you/video/cafe-01',
    platform: 'tiktok',
    views: 12_000,
    earnings: mockContentEarnings(12_000, DEMO_CMP002_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(7),
    thumbnailColor: COVER_COLORS[3]!,
  },
  {
    id: 'content-002',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up',
    brandName: 'Wok Bang',
    creatorId: 'me',
    creatorName: 'You',
    url: 'https://www.tiktok.com/@you/video/wokbang-approved',
    platform: 'tiktok',
    views: 8_500,
    earnings: mockContentEarnings(8_500, DEMO_CMP001_CREATOR),
    status: 'paid',
    submittedAt: daysAgo(45),
    thumbnailColor: COVER_COLORS[0]!,
  },
]

export const mockContent: Content[] = withCreatorDemoAvatars(rawMockContent)

/** Creator dashboard earnings chart placeholder until creator analytics API exists. */
export const mockCreatorPerformanceMonthly = [
  { period: 'January', views: 22_000, payout: mockContentEarnings(22_000, DEMO_CMP001_CREATOR) },
  { period: 'February', views: 28_000, payout: mockContentEarnings(28_000, DEMO_CMP001_CREATOR) },
  { period: 'March', views: 35_000, payout: mockContentEarnings(35_000, DEMO_CMP001_CREATOR) },
  { period: 'April', views: 42_000, payout: mockContentEarnings(42_000, DEMO_CMP001_CREATOR) },
  { period: 'May', views: 50_000, payout: mockContentEarnings(50_000, DEMO_CMP001_CREATOR) },
  { period: 'June', views: 54_000, payout: mockContentEarnings(54_000, DEMO_CMP001_CREATOR) },
  { period: 'July', views: 58_000, payout: mockContentEarnings(58_000, DEMO_CMP001_CREATOR) },
  { period: 'August', views: 67_000, payout: mockContentEarnings(67_000, DEMO_CMP001_CREATOR) },
  { period: 'September', views: 82_000, payout: mockContentEarnings(82_000, DEMO_CMP001_CREATOR) },
  { period: 'October', views: 98_000, payout: mockContentEarnings(98_000, DEMO_CMP001_CREATOR) },
  { period: 'November', views: 112_000, payout: mockContentEarnings(112_000, DEMO_CMP001_CREATOR) },
  { period: 'December', views: 103_000, payout: mockContentEarnings(103_000, DEMO_CMP001_CREATOR) },
]

export const mockCreatorPerformanceYearly = [
  { period: '2022', views: 820_000, payout: mockContentEarnings(820_000, DEMO_CMP001_CREATOR) },
  { period: '2023', views: 1_240_000, payout: mockContentEarnings(1_240_000, DEMO_CMP001_CREATOR) },
  { period: '2024', views: 1_680_000, payout: mockContentEarnings(1_680_000, DEMO_CMP001_CREATOR) },
  { period: '2025', views: 2_050_000, payout: mockContentEarnings(2_050_000, DEMO_CMP001_CREATOR) },
  { period: '2026', views: 2_340_000, payout: mockContentEarnings(2_340_000, DEMO_CMP001_CREATOR) },
]

export const mockCreatorPlatformLinks: CreatorPlatformLink[] = [
  { platform: 'tiktok', label: 'TikTok', handle: 'Not connected', status: 'reconnect' },
  { platform: 'facebook', label: 'Facebook', handle: 'Not connected', status: 'reconnect' },
]
