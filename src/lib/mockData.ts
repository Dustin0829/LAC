/**
 * VidU mock data — UI-only MVP prototype.
 * - `Campaign.ratePer1k` = **brand gross** ₱/1k (single canonical rate; locked at publish in product).
 * - Creator headline = 80% of gross via `getCreatorRatePer1k` / `creatorHeadlineRatePer1k`.
 * - Submissions: `grossAmount` / `creatorNet` / `platformFee` optional until payout release; status `pending` | `rejected` | `paid`.
 */

export type Platform = 'tiktok' | 'facebook'
export type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft'
export type ContentStatus =
  | 'pending'
  | 'paying'
  | 'paid'
  | 'payout_failed'
  | 'rejected'
export type MonthlyPackageStatus = 'ready' | 'released' | 'paying' | 'done'

import { MIN_PUBLISH_PHP } from '@/lib/constants'

export const CREATOR_PAYOUT_PERCENT = 0.8
export const INTAKE_FEE_PERCENT = 0.15
export const PERFORMANCE_FEE_PERCENT = 0.2
export const DEFAULT_REFUNDABLE_PERCENT = 1

export function getPlatformFeePercent(): number {
  return INTAKE_FEE_PERCENT
}

export { MIN_PUBLISH_PHP }

/**
 * Gross budget to pre-fill Fund & Publish (create page “Total budget”).
 * Uses `plannedGrossBudget` when set; otherwise infers from net `budget` and intake fee.
 */
export function getPlannedGrossBudgetForFunding(
  campaign: Pick<Campaign, 'plannedGrossBudget' | 'budget' | 'grossBudget' | 'platformFeePercent'>
): number {
  if (
    typeof campaign.plannedGrossBudget === 'number' &&
    Number.isFinite(campaign.plannedGrossBudget) &&
    campaign.plannedGrossBudget > 0
  ) {
    return Math.round(campaign.plannedGrossBudget)
  }
  const fee = campaign.platformFeePercent ?? getPlatformFeePercent()
  const net = Math.max(0, campaign.budget)
  if (fee >= 1) return MIN_PUBLISH_PHP
  const inferred = Math.round(net / (1 - fee))
  return Math.max(MIN_PUBLISH_PHP, inferred || MIN_PUBLISH_PHP)
}

export function getCreatorRatePer1k(brandGrossPer1k: number): number {
  return Math.round(brandGrossPer1k * CREATOR_PAYOUT_PERCENT * 100) / 100
}

/** Brand-facing ₱/1k on cards/detail — same as stored `campaign.ratePer1k` (gross). */
export function brandHeadlineRatePer1k(campaign: Pick<Campaign, 'ratePer1k'>): number {
  return campaign.ratePer1k
}

/** Creator-facing ₱/1k on discover/detail — 80% of brand gross (default performance split; no yellow basket in MVP schema). */
export function creatorHeadlineRatePer1k(campaign: Pick<Campaign, 'ratePer1k'>): number {
  return getCreatorRatePer1k(campaign.ratePer1k)
}

export function getNetSpendable(grossFunding: number): number {
  return Math.round(grossFunding * (1 - INTAKE_FEE_PERCENT))
}

/** Uncommitted funds in the campaign pool (same currency as `budget`, `spent`, and `reservedBalance`). */
export function getAvailableBalance(
  campaign: Pick<Campaign, 'budget' | 'spent' | 'reservedBalance'>
): number {
  const reserved = campaign.reservedBalance ?? 0
  return Math.max(0, campaign.budget - campaign.spent - reserved)
}

/** Reach bar denominator: pinned post-refund goal when set, otherwise `estimatedReach`. */
export function getCampaignReachViewGoal(
  campaign: Pick<
    Campaign,
    'estimatedReach' | 'postRefundReachGoalViews' | 'status' | 'grossBudget'
  >
): number {
  const gross = campaign.grossBudget ?? 0
  if (campaign.status === 'draft' && gross <= 0) return 0
  const pinned = campaign.postRefundReachGoalViews
  if (typeof pinned === 'number' && pinned > 0) return pinned
  return Math.max(0, campaign.estimatedReach)
}

export interface Campaign {
  id: string
  brandId: string
  brandName: string
  brandLogoColor: string
  title: string
  description: string
  /** Brand gross ₱ per 1,000 views (single stored rate; creator headline = 80% for default split). */
  ratePer1k: number
  /**
   * Total campaign fund pool (₱): available + spent + reserved.
   * This is the net amount in the campaign after intake fee at funding time.
   */
  budget: number
  /** Gross deposits minus refunds (0 until first checkout is paid). */
  grossBudget?: number
  /** VidU intake fee from confirmed campaign funding. */
  platformFeePercent?: number
  /** Maximum refundable portion of the total campaign budget. */
  refundablePercent?: number
  /** ₱ already paid out to creators (accrual / released payouts). */
  spent: number
  reservedBalance?: number
  /**
   * When true (e.g. after refunding uncommitted balance), the brand must add funds until
   * spendable balance reaches the publish floor before Resume can turn the campaign active.
   */
  resumeRequiresAddFunds?: boolean
  minimumPublishBalance?: number
  /** Brand’s intended gross funding (₱) from create / fund dialog — pre-fills checkout. */
  plannedGrossBudget?: number
  /** Cumulative views across all content on this campaign (mock aggregate). */
  campaignViews: number
  /**
   * View cap used for the reach bar: max views the current **net** campaign pool can fund at
   * `brandRatePer1k` (see `estimatedReachViewsFromNetPool`), unless `postRefundReachGoalViews` pins
   * the denominator after a refund.
   */
  estimatedReach: number
  /**
   * After refunding all spendable balance, fixed view goal for the reach bar (counted views at
   * refund). New spendable headroom does not raise this until new funds clear the pin. Rejecting
   * submissions lowers counted views but does not change this cap. **Add funds** clears the pin and
   * bumps `estimatedReach` by at least the pool-backed view ceiling so restores stay consistent
   * with budget.
   */
  postRefundReachGoalViews?: number
  platforms: Platform[]
  status: CampaignStatus
  startDate: string
  endDate: string
  /** When true, the brand runs the campaign until budget / reach goal is exhausted (no fixed calendar end). */
  runsUntilGoal?: boolean
  goalLabel?: string
  /** Sample/reference URL */
  sampleUrl?: string
  /** Asset/raw footage source URL */
  assetUrl?: string
  /** Reference URLs only (JSON in DB) — e.g. Drive folders, sample posts; no separate asset table. */
  referenceLinks?: string[]
  rules: string[]
  /** Cover image / thumbnail color seed */
  coverColor: string
  /** Real campaign cover image shown on cards and detail pages. */
  coverImageUrl?: string
  /** Optional brand logo image. Falls back to the brand initial. */
  brandLogoUrl?: string
}

export type RuleCheckResult = 'pass' | 'soft_flag' | 'hard_block'
export type LivenessStatus = 'live' | 'failing' | 'voided'

export interface Content {
  id: string
  campaignId: string
  campaignTitle: string
  brandName: string
  creatorId: string
  creatorName: string
  /** Optional avatar URL for tables (initials fallback via PersonAvatar). */
  creatorAvatarUrl?: string
  /** Submitted content URL (TikTok/Facebook only in MVP) */
  url: string
  platform: Platform
  /**
   * TikTok Yellow Basket (post–v1): optional flag on `Content`. UI & payout splits disabled for v1.
   */
  hasTikTokYellowBasket?: boolean
  /** Views locked at submit (stats frozen at this moment per policy). */
  views: number
  /** Views the campaign pool funded (may be less than `views` on partial allocation). */
  fundedViews?: number
  /** True when `fundedViews` is set and below `views`. */
  partialAllocation?: boolean
  partialReason?: 'pool_exhausted' | 'channel_max' | null
  /** Rule check result captured at submit. */
  ruleCheckResult?: RuleCheckResult
  /** Brand-visible note for soft-flag rule checks. */
  ruleCheckNote?: string
  /** Daily liveness probe result for non-rejected submissions during retention window. */
  livenessStatus?: LivenessStatus
  trustFlag?: string
  rejectionReason?: string
  /** Earnings = views/1000 * effective creator rate (locked at submit). */
  earnings: number
  status: ContentStatus
  submittedAt: string
  reviewedAt?: string
  paidAt?: string
  /** Latest of (campaign end) or (submittedAt + 30 days) — creators must keep post live until this. */
  retentionEndAt?: string
  thumbnailColor: string
}

export interface CreatorPlatformLink {
  platform: Platform
  label: string
  handle: string
  status: 'connected' | 'reconnect'
  connectedAt?: string
}

export interface MonthlyPayoutLine {
  id: string
  contentId: string
  creatorName: string
  campaignId: string
  campaignTitle: string
  platform: Platform
  /** Views locked at submit. */
  snapshotViews: number
  /** Gross performance value (brandGrossPer1k * snapshotViews / 1000). */
  grossAmount: number
  /** Creator's net share (80% of gross in v1; post–v1 may use 50% for TikTok yellow basket). */
  creatorNet: number
  /** Platform's cut (20% of gross in v1; post–v1 may use 50% for TikTok yellow basket). */
  platformFee: number
  /** Post–v1: whether the source submission used TikTok yellow basket (splits); unused in v1 UI. */
  isYellowBasket?: boolean
  flag?: string
  status: 'ready' | 'held' | 'released' | 'paid' | 'failed'
}

export interface MonthlyPayoutBatch {
  id: string
  campaignId: string
  periodLabel: string
  periodStart: string
  periodEnd: string
  status: MonthlyPackageStatus
  lines: MonthlyPayoutLine[]
}

/**
 * Sum of submission `views` that count toward estimated reach — same rows as the brand
 * Submissions tab (excludes preview rows with `creatorId === 'me'`), minus effectively rejected
 * content: store `rejected`, session submission rejects, and content tied to a session-rejected
 * payout accrual line.
 */
export function countCampaignReachTowardGoal(
  contents: Content[],
  campaignId: string,
  submissionRejectReasons: Record<string, string>,
  monthlyLineRejectedLineIds: Record<string, string>,
  payoutBatches: MonthlyPayoutBatch[]
): number {
  const payoutExcludedContentIds = new Set<string>()
  for (const lineId of Object.keys(monthlyLineRejectedLineIds)) {
    const line = payoutBatches.flatMap((b) => b.lines).find((l) => l.id === lineId)
    if (line?.campaignId === campaignId) payoutExcludedContentIds.add(line.contentId)
  }
  return contents
    .filter((c) => c.campaignId === campaignId)
    .filter((c) => c.creatorId !== 'me')
    .filter((c) => c.status !== 'rejected')
    .filter((c) => !submissionRejectReasons[c.id])
    .filter((c) => !payoutExcludedContentIds.has(c.id))
    .reduce((sum, c) => sum + c.views, 0)
}

export interface PaymentMethod {
  id: string
  type: 'gcash' | 'maya' | 'grabpay' | 'shopeepay' | 'bank'
  /** Provider / bank display title (e.g. "GCash", full bank legal name) */
  label: string
  /** Account number / phone (masked for display) */
  accountNumber: string
  accountName: string
  /** Full bank option label when `type === 'bank'` (matches bank picker). */
  bank?: string
  isDefault: boolean
}

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

/** Creator net earnings from submit-time snapshot views × campaign net ₱/1k. */
function mockContentEarnings(views: number, ratePer1k: number): number {
  return Math.round((views / 1000) * ratePer1k * 100) / 100
}

/** Brand gross ₱ for locked views × brand headline ₱/1k (matches accrual line `grossAmount`). */
export function brandGrossAccrualForViews(views: number, brandPer1k: number): number {
  return Math.round((views / 1000) * brandPer1k * 100) / 100
}

/**
 * View count the given spendable pool can fund at this brand headline CPV (₱ gross per 1k views).
 * Same rule as create / fund flows: `floor(pool / (brandRatePer1k / 1000))`.
 */
export function estimatedReachViewsFromNetPool(poolForCpv: number, brandRatePer1k: number): number {
  const cpv = brandRatePer1k / 1000
  if (!(cpv > 0) || !Number.isFinite(poolForCpv) || poolForCpv <= 0) return 1
  return Math.max(1, Math.floor(poolForCpv / cpv))
}

/**
 * Retention end (ISO): later of (campaign end) or (submitted + 30 days).
 * Mirrors the policy in docs/06-policies-and-trust.md#content-retention.
 */
export function computeRetentionEnd(submittedAtIso: string, campaignEndAtIso: string): string {
  const submittedPlus30 = new Date(submittedAtIso)
  submittedPlus30.setDate(submittedPlus30.getDate() + 30)
  const campaignEnd = new Date(campaignEndAtIso)
  return (
    submittedPlus30.getTime() > campaignEnd.getTime() ? submittedPlus30 : campaignEnd
  ).toISOString()
}

/** Sample gross ₱/1k by campaign — brands stay within ₱50–75; creators see `getCreatorRatePer1k` net. */
const DEMO_CMP001_BRAND = 62
const DEMO_CMP001_CREATOR = getCreatorRatePer1k(DEMO_CMP001_BRAND)
const DEMO_CMP002_BRAND = 58
const DEMO_CMP002_CREATOR = getCreatorRatePer1k(DEMO_CMP002_BRAND)

export const mockCampaigns: Campaign[] = [
  {
    id: 'cmp-001',
    brandId: 'brand-1',
    brandName: 'Wok Bang',
    brandLogoColor: 'from-orange-950 to-amber-800',
    title: 'Kitchen Glow-Up ',
    description:
      'We want to show our new kitchen products in real cooking videos so people see what they look like on a stove and in a normal kitchen. We want more shoppers to know the Wok Bang name, use our campaign hashtags, and find our site or stores from the post.',
    ratePer1k: DEMO_CMP001_BRAND,
    budget: 50_000,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 0,
    reservedBalance: brandGrossAccrualForViews(100_000, DEMO_CMP001_BRAND),
    minimumPublishBalance: 10_000,
    /** Equals `countCampaignReachTowardGoal` for counting submissions (synced on detail). */
    campaignViews: 100_000,
    estimatedReach: estimatedReachViewsFromNetPool(50_000, DEMO_CMP001_BRAND),
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(10),
    endDate: daysFromNow(26),
    sampleUrl: 'https://www.tiktok.com/@wokbangph/video/sample',
    referenceLinks: ['https://wokbang.com/products/kitchen-glow'],
    assetUrl: 'https://drive.google.com/folder/wokbang-assets',
    rules: [
      'Content must be at least 15 seconds long',
      'Tag @wokbangph in the caption',
      'Use #WokBangKitchen #LutoWithWokBang',
      'No stolen or reused content',
      'Product must be visible within first 5 seconds',
    ],
    coverColor: COVER_COLORS[0],
    coverImageUrl:
      'https://cdn.shopify.com/s/files/1/0573/6022/0319/products/01BlackCS_1.jpg?v=1645414098&width=1200',
  },
  {
    id: 'cmp-002',
    brandId: 'brand-2',
    brandName: 'Brew Theory',
    brandLogoColor: 'from-amber-950 to-yellow-900',
    title: 'Cafe Vibes',
    description:
      'We want more people near our shops to know we are here, what we sell, and what a visit costs. We want short videos of the drinks and food we actually serve, filmed in or in front of our cafes, with the branch name or link so someone who watches can come in or order the same thing.',
    ratePer1k: DEMO_CMP002_BRAND,
    budget: 50_000,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 0,
    reservedBalance: 0,
    minimumPublishBalance: 10_000,
    campaignViews: 0,
    estimatedReach: estimatedReachViewsFromNetPool(50_000, DEMO_CMP002_BRAND),
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(16),
    endDate: daysFromNow(44),
    sampleUrl: 'https://www.tiktok.com/@brewtheoryph/video/sample',
    assetUrl: 'https://drive.google.com/folder/brewtheory-assets',
    rules: [
      'Content must be at least 15 seconds long',
      'Use #BrewTheoryCafe',
      'Tag @brewtheoryph',
      'No reused content',
    ],
    coverColor: COVER_COLORS[3],
    coverImageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  },
]

/** Deterministic demo avatars for tables (skipped when `creatorAvatarUrl` is set explicitly). */
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
    reviewedAt: daysAgo(6),
    retentionEndAt: daysFromNow(30 - 7),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[3],
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
    reviewedAt: daysAgo(44),
    paidAt: daysAgo(10),
    retentionEndAt: daysFromNow(60),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[0],
  },
]

export const mockContent: Content[] = withCreatorDemoAvatars(rawMockContent)

/** Brand POV: simulated creator submissions on this brand’s campaigns. */
const rawMockBrandContent: Content[] = [
  {
    id: 'bcontent-001',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up',
    brandName: 'Wok Bang',
    creatorId: 'creator-1',
    creatorName: 'Mika Reyes',
    url: 'https://www.tiktok.com/@mika/video/01',
    platform: 'tiktok',
    // v1 (post-MVP): hasTikTokYellowBasket: true,
    views: 18_000,
    earnings: mockContentEarnings(18_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(8),
    reviewedAt: daysAgo(7),
    retentionEndAt: daysFromNow(30 - 8),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'bcontent-002',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up',
    brandName: 'Wok Bang',
    creatorId: 'creator-2',
    creatorName: 'Diego Cruz',
    url: 'https://www.tiktok.com/@diego/video/01',
    platform: 'tiktok',
    views: 22_000,
    earnings: mockContentEarnings(22_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    retentionEndAt: daysFromNow(30 - 5),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'bcontent-003',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up',
    brandName: 'Wok Bang',
    creatorId: 'creator-3',
    creatorName: 'Lena Ortiz',
    url: 'https://www.facebook.com/reel/lena-kitchen-glow/01',
    platform: 'facebook',
    views: 20_000,
    earnings: mockContentEarnings(20_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(4),
    reviewedAt: daysAgo(3),
    retentionEndAt: daysFromNow(30 - 4),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'bcontent-004',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up',
    brandName: 'Wok Bang',
    creatorId: 'creator-4',
    creatorName: 'Paolo Mendoza',
    url: 'https://www.tiktok.com/@paolo/video/wokbang-basket',
    platform: 'tiktok',
    // v1 (post-MVP): hasTikTokYellowBasket: true,
    views: 22_000,
    earnings: mockContentEarnings(22_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    retentionEndAt: daysFromNow(30 - 3),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'bcontent-005',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up',
    brandName: 'Wok Bang',
    creatorId: 'creator-5',
    creatorName: 'Sam Aquino',
    url: 'https://www.tiktok.com/@sam/video/kitchen-glow',
    platform: 'tiktok',
    views: 18_000,
    earnings: mockContentEarnings(18_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(2),
    reviewedAt: daysAgo(1),
    retentionEndAt: daysFromNow(30 - 2),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[1],
  },
]

export const mockBrandContent = withCreatorDemoAvatars(rawMockBrandContent)

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm-1',
    type: 'gcash',
    label: 'GCash',
    accountNumber: '09171234567',
    accountName: 'Juan Dela Cruz',
    isDefault: true,
  },
  {
    id: 'pm-2',
    type: 'bank',
    label: 'Bank of the Philippine Islands (BPI)',
    accountNumber: '1234564421',
    accountName: 'Juan Dela Cruz',
    bank: 'Bank of the Philippine Islands (BPI)',
    isDefault: false,
  },
]

/** Former demo creator net ₱/1k — scales legacy earnings-chart fixtures proportionally to new sample rates. */
const LEGACY_DEMO_CREATOR_NET_REF = 94.4

export const mockEarningsTrend = [
  {
    week: 'Week 1',
    earnings: Math.round((1240 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF),
  },
  {
    week: 'Week 2',
    earnings: Math.round((2100 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF),
  },
  {
    week: 'Week 3',
    earnings: Math.round((3580 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF),
  },
  {
    week: 'Week 4',
    earnings: Math.round((2980 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF),
  },
  {
    week: 'Week 5',
    earnings: Math.round((4520 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF),
  },
  {
    week: 'Week 6',
    earnings: Math.round((6210 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF),
  },
]

/** Brand dashboard chart — views & creator payout per calendar month (full year). */
export const mockBrandPerformanceMonthly = [
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

/** Brand dashboard chart — views & creator payout totals per calendar year. */
export const mockBrandPerformanceYearly = [
  { period: '2022', views: 820_000, payout: mockContentEarnings(820_000, DEMO_CMP001_CREATOR) },
  { period: '2023', views: 1_240_000, payout: mockContentEarnings(1_240_000, DEMO_CMP001_CREATOR) },
  { period: '2024', views: 1_680_000, payout: mockContentEarnings(1_680_000, DEMO_CMP001_CREATOR) },
  { period: '2025', views: 2_050_000, payout: mockContentEarnings(2_050_000, DEMO_CMP001_CREATOR) },
  { period: '2026', views: 2_340_000, payout: mockContentEarnings(2_340_000, DEMO_CMP001_CREATOR) },
]

export const mockCreatorPlatformLinks: CreatorPlatformLink[] = [
  {
    platform: 'tiktok',
    label: 'TikTok',
    handle: 'Not connected',
    status: 'reconnect',
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    handle: 'Not connected',
    status: 'reconnect',
  },
]

/** Payout accrual line amounts from snapshot views × brand ₱/1k (same formula as brand campaign UI). */
function demoMonthlyLinePayoutSplit(
  snapshotViews: number,
  brandPer1k: number,
  // v1 (post-MVP): pass `{ isYellowBasket: true }` for 50/50 creator vs platform on gross (not shipped).
  // options: { isYellowBasket?: boolean } = {}
  _options: { isYellowBasket?: boolean } = {}
) {
  void _options
  const grossAmount = brandGrossAccrualForViews(snapshotViews, brandPer1k)
  // const creatorShare = options.isYellowBasket ? 0.5 : CREATOR_PAYOUT_PERCENT
  const creatorShare = CREATOR_PAYOUT_PERCENT
  const creatorNet = Math.round(grossAmount * creatorShare * 100) / 100
  const platformFee = Math.round((grossAmount - creatorNet) * 100) / 100
  return { grossAmount, creatorNet, platformFee }
}

export const mockMonthlyPayoutBatches: MonthlyPayoutBatch[] = [
  {
    id: 'pkg-001',
    campaignId: 'cmp-001',
    periodLabel: 'May 1 – June 1, 2026',
    periodStart: '2026-05-01',
    periodEnd: '2026-06-01',
    status: 'ready',
    lines: [
      {
        id: 'line-001',
        contentId: 'bcontent-001',
        creatorName: 'Mika Reyes',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up',
        platform: 'tiktok',
        // v1 (post-MVP): isYellowBasket: true,
        snapshotViews: 18_000,
        ...demoMonthlyLinePayoutSplit(18_000, DEMO_CMP001_BRAND /* , { isYellowBasket: true } */),
        status: 'ready',
      },
      {
        id: 'line-002',
        contentId: 'bcontent-002',
        creatorName: 'Diego Cruz',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up',
        platform: 'tiktok',
        snapshotViews: 22_000,
        ...demoMonthlyLinePayoutSplit(22_000, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-003',
        contentId: 'bcontent-003',
        creatorName: 'Lena Ortiz',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up',
        platform: 'facebook',
        snapshotViews: 20_000,
        ...demoMonthlyLinePayoutSplit(20_000, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-004',
        contentId: 'bcontent-004',
        creatorName: 'Paolo Mendoza',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up',
        platform: 'tiktok',
        // v1 (post-MVP): isYellowBasket: true,
        snapshotViews: 22_000,
        ...demoMonthlyLinePayoutSplit(22_000, DEMO_CMP001_BRAND /* , { isYellowBasket: true } */),
        status: 'ready',
      },
      {
        id: 'line-005',
        contentId: 'bcontent-005',
        creatorName: 'Sam Aquino',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up',
        platform: 'tiktok',
        snapshotViews: 18_000,
        ...demoMonthlyLinePayoutSplit(18_000, DEMO_CMP001_BRAND),
        status: 'ready',
      },
    ],
  },
]

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
}
