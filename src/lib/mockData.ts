/**
 * Arpify mock data — UI-only MVP prototype.
 * - Brands set gross ₱/1k (`brandRatePer1k`); sample mocks use ~₱54–70/1k gross (≤₱75); brand UI shows that headline rate.
 * - Creator UI shows net ₱/1k after the 20% platform fee (`ratePer1k` / `creatorHeadlineRatePer1k`).
 * - Creators submit `contents` (URLs); earnings use the net rate × verified views / 1,000.
 */

export type Platform = 'tiktok' | 'facebook'
export type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft'
export type ContentStatus = 'pending' | 'rejected' | 'paid'
export type MonthlyPackageStatus = 'ready' | 'released' | 'paying' | 'done'

export const CREATOR_PAYOUT_PERCENT = 0.8
export const INTAKE_FEE_PERCENT = 0.15
export const PERFORMANCE_FEE_PERCENT = 0.2
export const DEFAULT_REFUNDABLE_PERCENT = 1

export function getPlatformFeePercent(): number {
  return INTAKE_FEE_PERCENT
}

/** Minimum gross funding (₱) for checkout — matches create-campaign / publish validation. */
export const MIN_GROSS_CAMPAIGN_BUDGET = 10_000

/**
 * Gross budget to pre-fill Fund & Publish (create page “Total budget”).
 * Uses `plannedGrossBudget` when set; otherwise infers from net `budget` and intake fee.
 */
export function getPlannedGrossBudgetForFunding(campaign: Pick<
  Campaign,
  'plannedGrossBudget' | 'budget' | 'platformFeePercent'
>): number {
  if (
    typeof campaign.plannedGrossBudget === 'number' &&
    Number.isFinite(campaign.plannedGrossBudget) &&
    campaign.plannedGrossBudget > 0
  ) {
    return Math.round(campaign.plannedGrossBudget)
  }
  const fee = campaign.platformFeePercent ?? getPlatformFeePercent()
  const net = Math.max(0, campaign.budget)
  if (fee >= 1) return MIN_GROSS_CAMPAIGN_BUDGET
  const inferred = Math.round(net / (1 - fee))
  return Math.max(MIN_GROSS_CAMPAIGN_BUDGET, inferred || MIN_GROSS_CAMPAIGN_BUDGET)
}

export function getCreatorRatePer1k(brandRatePer1k: number): number {
  return Math.round(brandRatePer1k * CREATOR_PAYOUT_PERCENT * 100) / 100
}

/** Brand-facing ₱/1k on cards/detail: gross rate the brand configured at creation (before creator net split). */
export function brandHeadlineRatePer1k(
  campaign: Pick<Campaign, 'brandRatePer1k' | 'ratePer1k'>
): number {
  return campaign.brandRatePer1k ?? campaign.ratePer1k
}

/** Creator-facing ₱/1k on discover/detail: brand gross per 1k minus the 20% platform performance fee (when gross is set). */
export function creatorHeadlineRatePer1k(
  campaign: Pick<Campaign, 'brandRatePer1k' | 'ratePer1k'>
): number {
  if (
    typeof campaign.brandRatePer1k === 'number' &&
    Number.isFinite(campaign.brandRatePer1k) &&
    campaign.brandRatePer1k > 0
  ) {
    return getCreatorRatePer1k(campaign.brandRatePer1k)
  }
  return campaign.ratePer1k
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

export interface CampaignAsset {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export interface Campaign {
  id: string
  brandId: string
  brandName: string
  brandLogoColor: string
  title: string
  description: string
  /** Gross ₱ per 1,000 views paid by the brand. */
  brandRatePer1k?: number
  /** Net ₱ per 1,000 views shown/paid to creators. */
  ratePer1k: number
  /**
   * Total campaign fund pool (₱): available + spent + reserved.
   * This is the net amount in the campaign after intake fee at funding time.
   */
  budget: number
  /** Arpify intake fee from confirmed campaign funding. */
  platformFeePercent?: number
  /** Maximum refundable portion of the total campaign budget. */
  refundablePercent?: number
  /** ₱ already paid out to creators (accrual / released payouts). */
  spent: number
  reservedBalance?: number
  minimumPublishBalance?: number
  /** Brand’s intended gross funding (₱) from create / fund dialog — pre-fills checkout. */
  plannedGrossBudget?: number
  /** Cumulative views across all content on this campaign (mock aggregate). */
  campaignViews: number
  /** Target view volume the campaign is aiming for (goal bar). */
  estimatedReach: number
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
  /** Optional reference posts, product pages, or tracking URLs (show to creators when set). */
  referenceLinks?: string[]
  /** Uploaded campaign files creators can use in their edits. */
  assets?: CampaignAsset[]
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
  /** TikTok-only: creator declared yellow basket (shop/commerce) on this post */
  hasTikTokYellowBasket?: boolean
  /** Views locked at submit (stats frozen at this moment per policy). */
  views: number
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
  /** Creator's net share (80% default, 50% if TikTok yellow basket). */
  creatorNet: number
  /** Platform's cut (20% default, 50% if TikTok yellow basket). */
  platformFee: number
  /** Whether the source submission was declared as TikTok yellow basket. */
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

export interface PaymentMethod {
  id: string
  type: 'gcash' | 'maya' | 'bank'
  /** Display label e.g. "GCash · 0917 ••• 1234" */
  label: string
  /** Account number / phone (masked for display) */
  accountNumber: string
  accountName: string
  /** Bank name when type === 'bank' */
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

/**
 * Retention end (ISO): later of (campaign end) or (submitted + 30 days).
 * Mirrors the policy in docs/06-policies-and-trust.md#content-retention.
 */
export function computeRetentionEnd(
  submittedAtIso: string,
  campaignEndAtIso: string
): string {
  const submittedPlus30 = new Date(submittedAtIso)
  submittedPlus30.setDate(submittedPlus30.getDate() + 30)
  const campaignEnd = new Date(campaignEndAtIso)
  return (
    submittedPlus30.getTime() > campaignEnd.getTime()
      ? submittedPlus30
      : campaignEnd
  ).toISOString()
}

/** Sample gross ₱/1k by campaign — brands stay within ₱50–75; creators see `getCreatorRatePer1k` net. */
const DEMO_CMP001_BRAND = 62
const DEMO_CMP001_CREATOR = getCreatorRatePer1k(DEMO_CMP001_BRAND)
const DEMO_CMP002_BRAND = 58
const DEMO_CMP002_CREATOR = getCreatorRatePer1k(DEMO_CMP002_BRAND)
const DEMO_CMP003_BRAND = 54
const DEMO_CMP003_CREATOR = getCreatorRatePer1k(DEMO_CMP003_BRAND)
const DEMO_CMP004_BRAND = 70
const DEMO_CMP004_CREATOR = getCreatorRatePer1k(DEMO_CMP004_BRAND)
const DEMO_CMP005_BRAND = 66
const DEMO_CMP005_CREATOR = getCreatorRatePer1k(DEMO_CMP005_BRAND)

/**
 * Per-line payout slice from locked snapshot views.
 * Default split: 80% creator / 20% platform on gross performance.
 * TikTok yellow basket: 50% / 50% on that line.
 */
function demoPayoutSlice(
  snapshotViews: number,
  brandPer1k: number,
  options: { isYellowBasket?: boolean } = {}
) {
  const grossAmount = mockContentEarnings(snapshotViews, brandPer1k)
  const creatorShare = options.isYellowBasket ? 0.5 : CREATOR_PAYOUT_PERCENT
  const creatorNet = Math.round(grossAmount * creatorShare * 100) / 100
  const platformFee = Math.round((grossAmount - creatorNet) * 100) / 100
  return { snapshotViews, grossAmount, creatorNet, platformFee }
}

export const mockCampaigns: Campaign[] = [
  {
    id: 'cmp-001',
    brandId: 'brand-1',
    brandName: 'Wok Bang',
    brandLogoColor: 'from-orange-950 to-amber-800',
    title: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    description:
      'Show how Wok Bang upgrades everyday cooking. Content recipe videos, satisfying cooking moments, kitchen transformations, or create your own cooking UGC. Higher engagement = higher payout.\n\n' +
      'Help us make cooking content more exciting with Wok Bang. Create short-form content featuring our cookware, satisfying cooking shots, recipe videos, before-and-after kitchen moments, or lifestyle cooking content.\n\n' +
      'We reward creators based on performance — the more views and engagement your content gets, the higher your earnings.\n\n' +
      'Post on TikTok, Facebook, or Instagram Reels.\n\n' +
      'Creator notes — strong content usually includes fast-paced editing, satisfying cooking shots, steam or sizzle moments, before vs after cooking scenes, family and home vibes, and relatable Filipino cooking moments.',
    brandRatePer1k: DEMO_CMP001_BRAND,
    ratePer1k: DEMO_CMP001_CREATOR,
    budget: 78_950,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 13_000,
    reservedBalance: 12_400,
    minimumPublishBalance: 10_000,
    campaignViews: 412_000,
    estimatedReach: 700_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(10),
    endDate: daysFromNow(26),
    sampleUrl: 'https://www.tiktok.com/@wokbangph/video/sample',
    referenceLinks: ['https://wokbang.com/products/kitchen-glow'],
    assetUrl: 'https://drive.google.com/folder/wokbang-assets',
    assets: [
      {
        id: 'asset-wb-001',
        name: 'wokbang-product-photos.zip',
        size: 52_000_000,
        type: 'application/zip',
        url: 'https://drive.google.com/file/wokbang-product-photos',
      },
      {
        id: 'asset-wb-002',
        name: 'kitchen-broll-sizzle.mp4',
        size: 118_000_000,
        type: 'video/mp4',
        url: 'https://drive.google.com/file/wokbang-kitchen-broll',
      },
    ],
    rules: [
      'Content must be at least 15 seconds long',
      'Tag @wokbangph in the caption',
      'Use #WokBangKitchen #LutoWithWokBang',
      'No stolen or reused content',
      'Use original voiceover or licensed audio only',
      'Product must be visible within first 5 seconds',
      'Avoid blurry or low-quality uploads',
    ],
    coverColor: COVER_COLORS[0],
    coverImageUrl:
      'https://cdn.shopify.com/s/files/1/0573/6022/0319/products/01BlackCS_1.jpg?v=1645414098&width=1200',
  },
  {
    id: 'cmp-002',
    brandId: 'brand-2',
    brandName: 'Likha',
    brandLogoColor: 'from-violet-950 to-purple-800',
    title: 'Protection & Energy — UGC Story Campaign',
    description:
      'Share your personal story, daily routine, or aesthetic content featuring Likha pieces. Authentic emotional content performs best.\n\n' +
      'Create emotional, aesthetic, or storytelling content featuring Likha accessories. Talk about energy, confidence, protection, spirituality, manifestation, or everyday routines.\n\n' +
      'Creators can make POV content, lifestyle edits, outfit videos, daily rituals, voiceover storytelling, or soft aesthetic edits. Higher watch time and engagement unlock higher payouts.\n\n' +
      'Post on TikTok, Facebook, or Instagram Reels.\n\n' +
      'Top-performing styles include emotional storytelling, calm cinematic edits, POV hooks, relatable life moments, “this changed my energy” angles, and minimal luxury aesthetic.',
    brandRatePer1k: DEMO_CMP002_BRAND,
    ratePer1k: DEMO_CMP002_CREATOR,
    budget: 68_900,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 11_500,
    reservedBalance: 9_200,
    minimumPublishBalance: 10_000,
    campaignViews: 278_000,
    estimatedReach: 500_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(12),
    endDate: daysFromNow(18),
    sampleUrl: 'https://www.tiktok.com/@likhaofficial/video/sample',
    assetUrl: 'https://drive.google.com/folder/likha-assets',
    assets: [
      {
        id: 'asset-lk-001',
        name: 'likha-lookbook-stills.zip',
        size: 41_000_000,
        type: 'application/zip',
        url: 'https://drive.google.com/file/likha-lookbook-stills',
      },
    ],
    rules: [
      'Content must be at least 10 seconds long',
      'Use #LikhaLifestyle and tag @likhaofficial',
      'No misleading spiritual claims',
      'Original edits only',
      'Use trending or licensed sounds only',
      'Avoid political or offensive content',
    ],
    coverColor: COVER_COLORS[5],
    coverImageUrl:
      'https://cdn.shopify.com/s/files/1/0884/2434/9860/files/dsc04316.jpg?v=1758188112&width=1200',
  },
  {
    id: 'cmp-003',
    brandId: 'brand-3',
    brandName: 'Casa Daily',
    brandLogoColor: 'from-stone-900 to-neutral-700',
    title: 'Aesthetic Home Finds — Everyday UGC Campaign',
    description:
      'Create cozy, aesthetic, and relatable home content featuring Casa Daily products. Clean visuals and authentic routines perform best.\n\n' +
      'Help us promote Casa Daily through relatable home lifestyle content. Showcase product setups, room organization, cleaning routines, desk aesthetics, or everyday home moments.\n\n' +
      'Simple but authentic content often performs best.\n\n' +
      'Post on TikTok, Facebook, or Instagram Reels.\n\n' +
      'Strong angles include room transformations, clean girl / cozy aesthetics, product organization, daily routine videos, ASMR cleaning content, and minimal lifestyle edits.',
    brandRatePer1k: DEMO_CMP003_BRAND,
    ratePer1k: DEMO_CMP003_CREATOR,
    budget: 49_800,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 9_000,
    reservedBalance: 5_600,
    minimumPublishBalance: 10_000,
    campaignViews: 189_000,
    estimatedReach: 420_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(6),
    endDate: daysFromNow(34),
    sampleUrl: 'https://www.tiktok.com/@casadailyph/video/sample',
    assetUrl: 'https://drive.google.com/folder/casadaily-assets',
    assets: [
      {
        id: 'asset-cd-001',
        name: 'casa-daily-product-flatlays.zip',
        size: 36_500_000,
        type: 'application/zip',
        url: 'https://drive.google.com/file/casadaily-flatlays',
      },
    ],
    rules: [
      'Minimum video length: 12 seconds',
      'Use #CasaDailyHome and tag @casadailyph',
      'No reposted content',
      'Product should be clearly visible',
      'Avoid copyrighted audio',
    ],
    coverColor: COVER_COLORS[1],
    coverImageUrl:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cmp-004',
    brandId: 'brand-4',
    brandName: 'Brew Theory',
    brandLogoColor: 'from-amber-950 to-yellow-900',
    title: 'Cafe Vibes — Coffee Lifestyle Content',
    description:
      'Capture cozy coffee moments, aesthetic cafe shots, and relatable caffeine content. Real moments perform best.\n\n' +
      'Create engaging coffee content for Brew Theory. Showcase drinks, cafe atmosphere, study sessions, work setups, coffee runs, or relaxing lifestyle edits.\n\n' +
      'UGC, cinematic shots, and relatable humor are highly encouraged. Post on TikTok, Facebook, or Instagram Reels.',
    brandRatePer1k: DEMO_CMP004_BRAND,
    ratePer1k: DEMO_CMP004_CREATOR,
    budget: 107_400,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 11_000,
    reservedBalance: 14_800,
    minimumPublishBalance: 10_000,
    campaignViews: 501_000,
    estimatedReach: 800_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(16),
    endDate: daysFromNow(44),
    sampleUrl: 'https://www.tiktok.com/@brewtheoryph/video/sample',
    assetUrl: 'https://drive.google.com/folder/brewtheory-assets',
    assets: [
      {
        id: 'asset-br-001',
        name: 'brew-theory-menu-lifestyle.zip',
        size: 44_800_000,
        type: 'application/zip',
        url: 'https://drive.google.com/file/brewtheory-menu-lifestyle',
      },
    ],
    rules: [
      'Content must be at least 15 seconds long',
      'Use #BrewTheoryCafe',
      'Tag @brewtheoryph',
      'No reused content',
      'Original edits only',
    ],
    coverColor: COVER_COLORS[3],
    coverImageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cmp-005',
    brandId: 'brand-5',
    brandName: 'Luna Skin',
    brandLogoColor: 'from-rose-950 to-pink-900',
    title: 'Real Skin Journey — Honest UGC Campaign',
    description:
      'Share your skincare routine, honest reactions, or aesthetic self-care content featuring Luna Skin products.\n\n' +
      'Create authentic skincare content using Luna Skin products. Show routines, before/after glow-ups, reactions, GRWM content, or relatable skincare struggles.\n\n' +
      'Natural and relatable videos perform best. Post on TikTok, Facebook, or Instagram Reels.',
    brandRatePer1k: DEMO_CMP005_BRAND,
    ratePer1k: DEMO_CMP005_CREATOR,
    budget: 61_200,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 5_500,
    reservedBalance: 9_100,
    minimumPublishBalance: 10_000,
    campaignViews: 246_000,
    estimatedReach: 530_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(9),
    endDate: daysFromNow(52),
    sampleUrl: 'https://www.tiktok.com/@lunaskinph/video/sample',
    assetUrl: 'https://drive.google.com/folder/lunaskin-assets',
    assets: [
      {
        id: 'asset-ls-001',
        name: 'luna-skin-routine-broll.mp4',
        size: 92_000_000,
        type: 'video/mp4',
        url: 'https://drive.google.com/file/luna-skin-routine-broll',
      },
    ],
    rules: [
      'Minimum video length: 10 seconds',
      'Use #LunaSkinPH',
      'Tag @lunaskinph',
      'No fake claims or filters hiding results',
      'Original content only',
    ],
    coverColor: COVER_COLORS[4],
    coverImageUrl:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
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
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'me',
    creatorName: 'You',
    url: 'https://www.tiktok.com/@you/video/01',
    platform: 'tiktok',
    views: 142_300,
    earnings: mockContentEarnings(142_300, DEMO_CMP001_CREATOR),
    status: 'paid',
    submittedAt: daysAgo(7),
    reviewedAt: daysAgo(6),
    paidAt: daysAgo(2),
    retentionEndAt: daysFromNow(30 - 7),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'content-002',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'me',
    creatorName: 'You',
    url: 'https://www.tiktok.com/@you/video/02',
    platform: 'tiktok',
    views: 41_000,
    earnings: mockContentEarnings(41_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    retentionEndAt: daysFromNow(30 - 3),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[5],
  },
  {
    id: 'content-003',
    campaignId: 'cmp-002',
    campaignTitle: 'Protection & Energy — UGC Story Campaign',
    brandName: 'Likha',
    creatorId: 'me',
    creatorName: 'You',
    url: 'https://www.facebook.com/reel/abc',
    platform: 'facebook',
    views: 9_400,
    earnings: mockContentEarnings(9_400, DEMO_CMP002_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(1),
    retentionEndAt: daysFromNow(30 - 1),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'content-004',
    campaignId: 'cmp-003',
    campaignTitle: 'Aesthetic Home Finds — Everyday UGC Campaign',
    brandName: 'Casa Daily',
    creatorId: 'me',
    creatorName: 'You',
    url: 'https://www.tiktok.com/@you/video/04',
    platform: 'tiktok',
    views: 21_500,
    earnings: mockContentEarnings(21_500, DEMO_CMP003_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    retentionEndAt: daysFromNow(30 - 5),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'content-005',
    campaignId: 'cmp-004',
    campaignTitle: 'Cafe Vibes — Coffee Lifestyle Content',
    brandName: 'Brew Theory',
    creatorId: 'me',
    creatorName: 'You',
    url: 'https://www.tiktok.com/@you/video/05',
    platform: 'tiktok',
    views: 1_200,
    rejectionReason: 'Post was uploaded before the campaign became active.',
    earnings: 0,
    status: 'rejected',
    submittedAt: daysAgo(10),
    reviewedAt: daysAgo(9),
    retentionEndAt: daysFromNow(30 - 10),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[3],
  },
]

export const mockContent: Content[] = withCreatorDemoAvatars(rawMockContent)

/** Brand POV: simulated creator submissions on this brand’s campaigns. */
const rawMockBrandContent: Content[] = [
  {
    id: 'bcontent-001',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-1',
    creatorName: 'Mika Reyes',
    url: 'https://www.tiktok.com/@mika/video/01',
    platform: 'tiktok',
    views: 234_000,
    earnings: mockContentEarnings(234_000, DEMO_CMP001_CREATOR),
    status: 'paid',
    submittedAt: daysAgo(8),
    reviewedAt: daysAgo(7),
    paidAt: daysAgo(3),
    retentionEndAt: daysFromNow(30 - 8),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'bcontent-002',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-2',
    creatorName: 'Diego Cruz',
    url: 'https://www.tiktok.com/@diego/video/01',
    platform: 'tiktok',
    hasTikTokYellowBasket: true,
    views: 92_000,
    trustFlag: 'Unusual view spike: review engagement before release.',
    earnings: Math.round((92_000 / 1000) * DEMO_CMP001_BRAND * 0.5 * 100) / 100,
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
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-3',
    creatorName: 'Anna Lim',
    url: 'https://www.facebook.com/reel/xyz',
    platform: 'facebook',
    views: 6_400,
    earnings: mockContentEarnings(6_400, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(1),
    retentionEndAt: daysFromNow(30 - 1),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[3],
  },
  {
    id: 'bcontent-004',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-4',
    creatorName: 'Rico Perez',
    url: 'https://www.tiktok.com/@rico/video/01',
    platform: 'tiktok',
    views: 1_100,
    rejectionReason: 'Creator submitted from an account that does not match their linked profile.',
    earnings: 0,
    status: 'rejected',
    submittedAt: daysAgo(2),
    reviewedAt: daysAgo(1),
    retentionEndAt: daysFromNow(30 - 2),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[4],
  },
  {
    id: 'bcontent-005',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-5',
    creatorName: 'Sofia Torres',
    url: 'https://www.tiktok.com/@sofia/video/kape-01',
    platform: 'tiktok',
    views: 45_000,
    earnings: mockContentEarnings(45_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(6),
    reviewedAt: daysAgo(5),
    retentionEndAt: daysFromNow(30 - 6),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'bcontent-006',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-6',
    creatorName: 'Jay Mendoza',
    url: 'https://www.facebook.com/reel/jay-kape-latte',
    platform: 'facebook',
    views: 24_200,
    earnings: mockContentEarnings(24_200, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(4),
    reviewedAt: daysAgo(3),
    retentionEndAt: daysFromNow(30 - 4),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[3],
  },
  {
    id: 'bcontent-007',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-7',
    creatorName: 'Lena Kim',
    url: 'https://www.tiktok.com/@lena/video/latte-ugc',
    platform: 'tiktok',
    views: 118_000,
    earnings: mockContentEarnings(118_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(7),
    reviewedAt: daysAgo(6),
    retentionEndAt: daysFromNow(30 - 7),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'bcontent-008',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-8',
    creatorName: 'Marco Diaz',
    url: 'https://www.facebook.com/reel/marco-kape',
    platform: 'facebook',
    views: 11_500,
    earnings: mockContentEarnings(11_500, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    retentionEndAt: daysFromNow(30 - 3),
    ruleCheckResult: 'soft_flag',
    ruleCheckNote: 'Caption uses #wokbang but #WokBangKitchen and #LutoWithWokBang were missing from the rules list. Brand can still leave included.',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[5],
  },
  {
    id: 'bcontent-009',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-9',
    creatorName: 'Nina Santos',
    url: 'https://www.tiktok.com/@nina/video/kape-reel',
    platform: 'tiktok',
    views: 88_000,
    earnings: mockContentEarnings(88_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    retentionEndAt: daysFromNow(30 - 5),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'bcontent-010',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-10',
    creatorName: 'Paolo Villanueva',
    url: 'https://www.tiktok.com/@paolo/video/latte-hops',
    platform: 'tiktok',
    hasTikTokYellowBasket: true,
    views: 41_000,
    trustFlag: 'TikTok yellow basket — 50/50 split locked at submit.',
    earnings: Math.round((41_000 / 1000) * DEMO_CMP001_BRAND * 0.5 * 100) / 100,
    status: 'pending',
    submittedAt: daysAgo(2),
    reviewedAt: daysAgo(1),
    retentionEndAt: daysFromNow(30 - 2),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[4],
  },
  {
    id: 'bcontent-011',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-11',
    creatorName: 'Carla Bautista',
    url: 'https://www.facebook.com/reel/carla-spanish-latte',
    platform: 'facebook',
    views: 17_800,
    earnings: mockContentEarnings(17_800, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(6),
    reviewedAt: daysAgo(5),
    retentionEndAt: daysFromNow(30 - 6),
    ruleCheckResult: 'pass',
    livenessStatus: 'failing',
    trustFlag: 'Liveness probe failed in the last 12 hours — post may be private or removed.',
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'bcontent-012',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-12',
    creatorName: 'Erin Garcia',
    url: 'https://www.tiktok.com/@erin/video/kape-manila',
    platform: 'tiktok',
    views: 76_000,
    earnings: mockContentEarnings(76_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(4),
    reviewedAt: daysAgo(3),
    retentionEndAt: daysFromNow(30 - 4),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[3],
  },
  {
    id: 'bcontent-013',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-13',
    creatorName: 'Tom Ramos',
    url: 'https://www.tiktok.com/@tom/video/latte-challenge',
    platform: 'tiktok',
    hasTikTokYellowBasket: true,
    views: 52_400,
    trustFlag: 'TikTok yellow basket — 50/50 split locked at submit.',
    earnings: Math.round((52_400 / 1000) * DEMO_CMP001_BRAND * 0.5 * 100) / 100,
    status: 'pending',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    retentionEndAt: daysFromNow(30 - 3),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'bcontent-014',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
    brandName: 'Wok Bang',
    creatorId: 'creator-14',
    creatorName: 'Ivy Wong',
    url: 'https://www.facebook.com/reel/ivy-kape-drop',
    platform: 'facebook',
    views: 9_600,
    earnings: mockContentEarnings(9_600, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(1),
    reviewedAt: daysAgo(1),
    retentionEndAt: daysFromNow(30 - 1),
    ruleCheckResult: 'pass',
    livenessStatus: 'live',
    thumbnailColor: COVER_COLORS[5],
  },
]

export const mockBrandContent = withCreatorDemoAvatars(rawMockBrandContent)

export const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm-1',
    type: 'gcash',
    label: 'GCash · 0917 ••• 1234',
    accountNumber: '09171234567',
    accountName: 'Juan Dela Cruz',
    isDefault: true,
  },
  {
    id: 'pm-2',
    type: 'bank',
    label: 'BPI · ••• 4421',
    accountNumber: '1234564421',
    accountName: 'Juan Dela Cruz',
    bank: 'BPI',
    isDefault: false,
  },
]

/** Former demo creator net ₱/1k — scales legacy earnings-chart fixtures proportionally to new sample rates. */
const LEGACY_DEMO_CREATOR_NET_REF = 94.4

export const mockEarningsTrend = [
  { week: 'Week 1', earnings: Math.round((1240 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF) },
  { week: 'Week 2', earnings: Math.round((2100 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF) },
  { week: 'Week 3', earnings: Math.round((3580 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF) },
  { week: 'Week 4', earnings: Math.round((2980 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF) },
  { week: 'Week 5', earnings: Math.round((4520 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF) },
  { week: 'Week 6', earnings: Math.round((6210 * DEMO_CMP001_CREATOR) / LEGACY_DEMO_CREATOR_NET_REF) },
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
    handle: '@mika.creates',
    status: 'connected',
    connectedAt: daysAgo(18),
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    handle: 'facebook.com/mika.creates',
    status: 'reconnect',
    connectedAt: daysAgo(41),
  },
]

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
        contentId: 'bcontent-002',
        creatorName: 'Diego Cruz',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        isYellowBasket: true,
        ...demoPayoutSlice(92_000, DEMO_CMP001_BRAND, { isYellowBasket: true }),
        flag: 'TikTok yellow basket — 50/50 split locked at submit.',
        status: 'ready',
      },
      {
        id: 'line-002',
        contentId: 'bcontent-003',
        creatorName: 'Anna Lim',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'facebook',
        ...demoPayoutSlice(6_400, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-003',
        contentId: 'bcontent-005',
        creatorName: 'Sofia Torres',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        ...demoPayoutSlice(45_000, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-004',
        contentId: 'bcontent-006',
        creatorName: 'Jay Mendoza',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'facebook',
        ...demoPayoutSlice(24_200, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-005',
        contentId: 'bcontent-007',
        creatorName: 'Lena Kim',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        ...demoPayoutSlice(118_000, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-006',
        contentId: 'bcontent-008',
        creatorName: 'Marco Diaz',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'facebook',
        ...demoPayoutSlice(11_500, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-007',
        contentId: 'bcontent-009',
        creatorName: 'Nina Santos',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        ...demoPayoutSlice(88_000, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-008',
        contentId: 'bcontent-010',
        creatorName: 'Paolo Villanueva',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        isYellowBasket: true,
        flag: 'TikTok yellow basket — 50/50 split locked at submit.',
        ...demoPayoutSlice(41_000, DEMO_CMP001_BRAND, { isYellowBasket: true }),
        status: 'ready',
      },
      {
        id: 'line-009',
        contentId: 'bcontent-011',
        creatorName: 'Carla Bautista',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'facebook',
        ...demoPayoutSlice(17_800, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-010',
        contentId: 'bcontent-012',
        creatorName: 'Erin Garcia',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        ...demoPayoutSlice(76_000, DEMO_CMP001_BRAND),
        status: 'ready',
      },
      {
        id: 'line-011',
        contentId: 'bcontent-013',
        creatorName: 'Tom Ramos',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        isYellowBasket: true,
        flag: 'TikTok yellow basket — 50/50 split locked at submit.',
        ...demoPayoutSlice(52_400, DEMO_CMP001_BRAND, { isYellowBasket: true }),
        status: 'ready',
      },
      {
        id: 'line-012',
        contentId: 'bcontent-014',
        creatorName: 'Ivy Wong',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'facebook',
        ...demoPayoutSlice(9_600, DEMO_CMP001_BRAND),
        status: 'ready',
      },
    ],
  },
  {
    id: 'pkg-002',
    campaignId: 'cmp-001',
    periodLabel: 'April 1 – May 1, 2026',
    periodStart: '2026-04-01',
    periodEnd: '2026-05-01',
    status: 'released',
    lines: [
      {
        id: 'line-201',
        contentId: 'bcontent-001',
        creatorName: 'Mika Reyes',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        ...demoPayoutSlice(188_000, DEMO_CMP001_BRAND),
        status: 'paid',
      },
      {
        id: 'line-202',
        contentId: 'bcontent-002',
        creatorName: 'Diego Cruz',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        ...demoPayoutSlice(50_000, DEMO_CMP001_BRAND),
        status: 'paid',
      },
      {
        id: 'line-203',
        contentId: 'bcontent-005',
        creatorName: 'Sofia Torres',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        ...demoPayoutSlice(33_000, DEMO_CMP001_BRAND),
        status: 'paid',
      },
      {
        id: 'line-204',
        contentId: 'bcontent-007',
        creatorName: 'Lena Kim',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        ...demoPayoutSlice(96_000, DEMO_CMP001_BRAND),
        status: 'paid',
      },
      {
        id: 'line-205',
        contentId: 'bcontent-009',
        creatorName: 'Nina Santos',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Content Campaign',
        platform: 'tiktok',
        ...demoPayoutSlice(73_000, DEMO_CMP001_BRAND),
        status: 'paid',
      },
    ],
  },
]

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
}
