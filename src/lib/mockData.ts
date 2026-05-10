/**
 * Arpify mock data — UI-only MVP prototype.
 * - Brands set gross ₱/1k (`brandRatePer1k`); sample mocks use ~₱54–70/1k gross (≤₱75); brand UI shows that headline rate.
 * - Creator UI shows net ₱/1k after the 20% platform fee (`ratePer1k` / `creatorHeadlineRatePer1k`).
 * - Creators submit `clips` (URLs); earnings use the net rate × verified views / 1,000.
 */

export type Platform = 'tiktok' | 'facebook'
export type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft'
export type ClipStatus = 'pending' | 'rejected' | 'paid'
export type WeeklyPackageStatus = 'ready' | 'released' | 'paying' | 'done'

export const CLIPPER_PAYOUT_PERCENT = 0.8
export const CREATOR_PAYOUT_PERCENT = CLIPPER_PAYOUT_PERCENT
export const INTAKE_FEE_PERCENT = 0.15
export const PERFORMANCE_FEE_PERCENT = 0.2
export const DEFAULT_REFUNDABLE_PERCENT = 1

export function getPlatformFeePercent(): number {
  return INTAKE_FEE_PERCENT
}

export function getClipperRatePer1k(brandRatePer1k: number): number {
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
    return getClipperRatePer1k(campaign.brandRatePer1k)
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
  /** Cumulative views across all clips on this campaign (mock aggregate). */
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

export interface Clip {
  id: string
  campaignId: string
  campaignTitle: string
  brandName: string
  clipperId: string
  clipperName: string
  /** Submitted clip URL (TikTok/Facebook only in MVP) */
  url: string
  platform: Platform
  /** TikTok-only: creator declared yellow basket (shop/commerce) on this post */
  hasTikTokYellowBasket?: boolean
  /** Current view count (mocked) */
  views: number
  viewsPaidThrough?: number
  deltaViews?: number
  trustFlag?: string
  rejectionReason?: string
  /** Earnings = views/1000 * ratePer1k. */
  earnings: number
  status: ClipStatus
  submittedAt: string
  reviewedAt?: string
  paidAt?: string
  thumbnailColor: string
}

export interface CreatorPlatformLink {
  platform: Platform
  label: string
  handle: string
  status: 'connected' | 'reconnect'
  connectedAt?: string
}

export interface WeeklyPayoutLine {
  id: string
  clipId: string
  creatorName: string
  campaignId: string
  campaignTitle: string
  platform: Platform
  openingViews: number
  verifiedAtCutoff: number
  deltaViews: number
  grossAccrual: number
  creatorNet: number
  platformFee: number
  flag?: string
  status: 'ready' | 'held' | 'released' | 'paid' | 'failed'
}

export interface WeeklyPayoutPackage {
  id: string
  campaignId: string
  periodLabel: string
  status: WeeklyPackageStatus
  lines: WeeklyPayoutLine[]
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

/** Creator net earnings from verified views × campaign net ₱/1k (matches `computeEarnings`). */
function mockClipEarnings(views: number, ratePer1k: number): number {
  return Math.round((views / 1000) * ratePer1k * 100) / 100
}

/** Sample gross ₱/1k by campaign — brands stay within ₱50–75; creators see `getClipperRatePer1k` net. */
const DEMO_CMP001_BRAND = 62
const DEMO_CMP001_CREATOR = getClipperRatePer1k(DEMO_CMP001_BRAND)
const DEMO_CMP002_BRAND = 58
const DEMO_CMP002_CREATOR = getClipperRatePer1k(DEMO_CMP002_BRAND)
const DEMO_CMP003_BRAND = 54
const DEMO_CMP003_CREATOR = getClipperRatePer1k(DEMO_CMP003_BRAND)
const DEMO_CMP004_BRAND = 70
const DEMO_CMP004_CREATOR = getClipperRatePer1k(DEMO_CMP004_BRAND)
const DEMO_CMP005_BRAND = 66
const DEMO_CMP005_CREATOR = getClipperRatePer1k(DEMO_CMP005_BRAND)

/** Weekly accrual slice: brand gross vs creator net vs remainder as platform fee (demo only). */
function demoWeeklySlice(deltaViews: number, brandPer1k: number, creatorPer1k: number) {
  const grossAccrual = mockClipEarnings(deltaViews, brandPer1k)
  const creatorNet = mockClipEarnings(deltaViews, creatorPer1k)
  const platformFee = Math.round((grossAccrual - creatorNet) * 100) / 100
  return { grossAccrual, creatorNet, platformFee }
}

export const mockCampaigns: Campaign[] = [
  {
    id: 'cmp-001',
    brandId: 'brand-1',
    brandName: 'Wok Bang',
    brandLogoColor: 'from-orange-950 to-amber-800',
    title: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    description:
      'Show how Wok Bang upgrades everyday cooking. Clip recipe videos, satisfying cooking moments, kitchen transformations, or create your own cooking UGC. Higher engagement = higher payout.\n\n' +
      'Help us make cooking content more exciting with Wok Bang. Create short-form clips featuring our cookware, satisfying cooking shots, recipe videos, before-and-after kitchen moments, or lifestyle cooking content.\n\n' +
      'We reward creators based on performance — the more views and engagement your clips get, the higher your earnings.\n\n' +
      'Post on TikTok, Facebook, or Instagram Reels.\n\n' +
      'Creator notes — strong clips usually include fast-paced editing, satisfying cooking shots, steam or sizzle moments, before vs after cooking scenes, family and home vibes, and relatable Filipino cooking moments.',
    brandRatePer1k: DEMO_CMP001_BRAND,
    ratePer1k: DEMO_CMP001_CREATOR,
    budget: 78_950,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 48_200,
    reservedBalance: 12_400,
    minimumPublishBalance: 10_000,
    campaignViews: 412_000,
    estimatedReach: 700_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(10),
    endDate: daysFromNow(26),
    sampleUrl: 'https://www.tiktok.com/@wokbangph/video/sample',
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
      'Clip must be at least 15 seconds long',
      'Tag @wokbangph in the caption',
      'Use #WokBangKitchen #LutoWithWokBang',
      'No stolen or reused clips',
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
    spent: 38_600,
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
      'Clip must be at least 10 seconds long',
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
      'Strong angles include room transformations, clean girl / cozy aesthetics, product organization, daily routine videos, ASMR cleaning clips, and minimal lifestyle edits.',
    brandRatePer1k: DEMO_CMP003_BRAND,
    ratePer1k: DEMO_CMP003_CREATOR,
    budget: 49_800,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 21_800,
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
    title: 'Cafe Vibes — Coffee Lifestyle Clips',
    description:
      'Capture cozy coffee moments, aesthetic cafe shots, and relatable caffeine content. Real moments perform best.\n\n' +
      'Create engaging coffee content for Brew Theory. Showcase drinks, cafe atmosphere, study sessions, work setups, coffee runs, or relaxing lifestyle edits.\n\n' +
      'UGC, cinematic shots, and relatable humor are highly encouraged. Post on TikTok, Facebook, or Instagram Reels.',
    brandRatePer1k: DEMO_CMP004_BRAND,
    ratePer1k: DEMO_CMP004_CREATOR,
    budget: 107_400,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 61_400,
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
      'Clip must be at least 15 seconds long',
      'Use #BrewTheoryCafe',
      'Tag @brewtheoryph',
      'No reused clips',
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
    spent: 33_500,
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
      'Original clips only',
    ],
    coverColor: COVER_COLORS[4],
    coverImageUrl:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
  },
]

export const mockClips: Clip[] = [
  {
    id: 'clip-001',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'me',
    clipperName: 'You',
    url: 'https://www.tiktok.com/@you/video/01',
    platform: 'tiktok',
    views: 142_300,
    viewsPaidThrough: 120_000,
    deltaViews: 22_300,
    earnings: mockClipEarnings(142_300, DEMO_CMP001_CREATOR),
    status: 'paid',
    submittedAt: daysAgo(7),
    reviewedAt: daysAgo(6),
    paidAt: daysAgo(2),
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'clip-002',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'me',
    clipperName: 'You',
    url: 'https://www.tiktok.com/@you/video/02',
    platform: 'tiktok',
    views: 41_000,
    viewsPaidThrough: 0,
    deltaViews: 41_000,
    earnings: mockClipEarnings(41_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    thumbnailColor: COVER_COLORS[5],
  },
  {
    id: 'clip-003',
    campaignId: 'cmp-002',
    campaignTitle: 'Protection & Energy — UGC Story Campaign',
    brandName: 'Likha',
    clipperId: 'me',
    clipperName: 'You',
    url: 'https://www.facebook.com/reel/abc',
    platform: 'facebook',
    views: 9_400,
    viewsPaidThrough: 0,
    deltaViews: 9_400,
    trustFlag: 'Metrics pending: waiting for first verified cutoff.',
    earnings: mockClipEarnings(9_400, DEMO_CMP002_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(1),
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'clip-004',
    campaignId: 'cmp-003',
    campaignTitle: 'Aesthetic Home Finds — Everyday UGC Campaign',
    brandName: 'Casa Daily',
    clipperId: 'me',
    clipperName: 'You',
    url: 'https://www.tiktok.com/@you/video/04',
    platform: 'tiktok',
    views: 21_500,
    viewsPaidThrough: 12_000,
    deltaViews: 9_500,
    earnings: mockClipEarnings(21_500, DEMO_CMP003_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'clip-005',
    campaignId: 'cmp-004',
    campaignTitle: 'Cafe Vibes — Coffee Lifestyle Clips',
    brandName: 'Brew Theory',
    clipperId: 'me',
    clipperName: 'You',
    url: 'https://www.tiktok.com/@you/video/05',
    platform: 'tiktok',
    views: 1_200,
    viewsPaidThrough: 0,
    deltaViews: 0,
    rejectionReason: 'Post was uploaded before the campaign became active.',
    earnings: 0,
    status: 'rejected',
    submittedAt: daysAgo(10),
    reviewedAt: daysAgo(9),
    thumbnailColor: COVER_COLORS[3],
  },
]

/** Brand POV: simulated creator submissions on this brand’s campaigns. */
export const mockBrandClips: Clip[] = [
  {
    id: 'bclip-001',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-1',
    clipperName: 'Mika R.',
    url: 'https://www.tiktok.com/@mika/video/01',
    platform: 'tiktok',
    views: 234_000,
    viewsPaidThrough: 188_000,
    deltaViews: 46_000,
    earnings: mockClipEarnings(234_000, DEMO_CMP001_CREATOR),
    status: 'paid',
    submittedAt: daysAgo(8),
    reviewedAt: daysAgo(7),
    paidAt: daysAgo(3),
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'bclip-002',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-2',
    clipperName: 'Diego C.',
    url: 'https://www.tiktok.com/@diego/video/01',
    platform: 'tiktok',
    views: 92_000,
    viewsPaidThrough: 50_000,
    deltaViews: 42_000,
    trustFlag: 'Unusual view spike: review engagement before release.',
    earnings: mockClipEarnings(92_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'bclip-003',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-3',
    clipperName: 'Anna L.',
    url: 'https://www.facebook.com/reel/xyz',
    platform: 'facebook',
    views: 6_400,
    viewsPaidThrough: 0,
    deltaViews: 6_400,
    earnings: mockClipEarnings(6_400, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(1),
    thumbnailColor: COVER_COLORS[3],
  },
  {
    id: 'bclip-004',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-4',
    clipperName: 'Rico P.',
    url: 'https://www.tiktok.com/@rico/video/01',
    platform: 'tiktok',
    views: 1_100,
    viewsPaidThrough: 0,
    deltaViews: 0,
    rejectionReason: 'Creator submitted from an account that does not match their linked profile.',
    earnings: 0,
    status: 'rejected',
    submittedAt: daysAgo(2),
    reviewedAt: daysAgo(1),
    thumbnailColor: COVER_COLORS[4],
  },
  {
    id: 'bclip-005',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-5',
    clipperName: 'Sofia T.',
    url: 'https://www.tiktok.com/@sofia/video/kape-01',
    platform: 'tiktok',
    views: 45_000,
    viewsPaidThrough: 33_000,
    deltaViews: 12_000,
    earnings: mockClipEarnings(45_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(6),
    reviewedAt: daysAgo(5),
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'bclip-006',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-6',
    clipperName: 'Jay M.',
    url: 'https://www.facebook.com/reel/jay-kape-latte',
    platform: 'facebook',
    views: 24_200,
    viewsPaidThrough: 16_200,
    deltaViews: 8_000,
    earnings: mockClipEarnings(24_200, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(4),
    reviewedAt: daysAgo(3),
    thumbnailColor: COVER_COLORS[3],
  },
  {
    id: 'bclip-007',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-7',
    clipperName: 'Lena K.',
    url: 'https://www.tiktok.com/@lena/video/latte-ugc',
    platform: 'tiktok',
    views: 118_000,
    viewsPaidThrough: 96_000,
    deltaViews: 22_000,
    earnings: mockClipEarnings(118_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(7),
    reviewedAt: daysAgo(6),
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'bclip-008',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-8',
    clipperName: 'Marco D.',
    url: 'https://www.facebook.com/reel/marco-kape',
    platform: 'facebook',
    views: 11_500,
    viewsPaidThrough: 8_300,
    deltaViews: 3_200,
    earnings: mockClipEarnings(11_500, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    thumbnailColor: COVER_COLORS[5],
  },
  {
    id: 'bclip-009',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-9',
    clipperName: 'Nina S.',
    url: 'https://www.tiktok.com/@nina/video/kape-reel',
    platform: 'tiktok',
    views: 88_000,
    viewsPaidThrough: 73_000,
    deltaViews: 15_000,
    earnings: mockClipEarnings(88_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'bclip-010',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-10',
    clipperName: 'Paolo V.',
    url: 'https://www.tiktok.com/@paolo/video/latte-hops',
    platform: 'tiktok',
    views: 41_000,
    viewsPaidThrough: 32_000,
    deltaViews: 9_000,
    earnings: mockClipEarnings(41_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(2),
    reviewedAt: daysAgo(1),
    thumbnailColor: COVER_COLORS[4],
  },
  {
    id: 'bclip-011',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-11',
    clipperName: 'Carla B.',
    url: 'https://www.facebook.com/reel/carla-spanish-latte',
    platform: 'facebook',
    views: 17_800,
    viewsPaidThrough: 12_800,
    deltaViews: 5_000,
    earnings: mockClipEarnings(17_800, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(6),
    reviewedAt: daysAgo(5),
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'bclip-012',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-12',
    clipperName: 'Erin G.',
    url: 'https://www.tiktok.com/@erin/video/kape-manila',
    platform: 'tiktok',
    views: 76_000,
    viewsPaidThrough: 58_000,
    deltaViews: 18_000,
    earnings: mockClipEarnings(76_000, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(4),
    reviewedAt: daysAgo(3),
    thumbnailColor: COVER_COLORS[3],
  },
  {
    id: 'bclip-013',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-13',
    clipperName: 'Tom R.',
    url: 'https://www.tiktok.com/@tom/video/latte-challenge',
    platform: 'tiktok',
    views: 52_400,
    viewsPaidThrough: 38_400,
    deltaViews: 14_000,
    earnings: mockClipEarnings(52_400, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'bclip-014',
    campaignId: 'cmp-001',
    campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
    brandName: 'Wok Bang',
    clipperId: 'clipper-14',
    clipperName: 'Ivy W.',
    url: 'https://www.facebook.com/reel/ivy-kape-drop',
    platform: 'facebook',
    views: 9_600,
    viewsPaidThrough: 5_100,
    deltaViews: 4_500,
    earnings: mockClipEarnings(9_600, DEMO_CMP001_CREATOR),
    status: 'pending',
    submittedAt: daysAgo(1),
    reviewedAt: daysAgo(1),
    thumbnailColor: COVER_COLORS[5],
  },
]

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

/** Brand dashboard chart — views & creator payout per calendar month (recent six months). */
export const mockBrandPerformanceMonthly = [
  { period: 'July', views: 72_000, payout: mockClipEarnings(72_000, DEMO_CMP001_CREATOR) },
  { period: 'August', views: 81_000, payout: mockClipEarnings(81_000, DEMO_CMP001_CREATOR) },
  { period: 'September', views: 94_000, payout: mockClipEarnings(94_000, DEMO_CMP001_CREATOR) },
  { period: 'October', views: 102_000, payout: mockClipEarnings(102_000, DEMO_CMP001_CREATOR) },
  { period: 'November', views: 118_000, payout: mockClipEarnings(118_000, DEMO_CMP001_CREATOR) },
  { period: 'December', views: 156_000, payout: mockClipEarnings(156_000, DEMO_CMP001_CREATOR) },
]

/** Brand dashboard chart — views & creator payout totals per calendar year. */
export const mockBrandPerformanceYearly = [
  { period: '2022', views: 820_000, payout: mockClipEarnings(820_000, DEMO_CMP001_CREATOR) },
  { period: '2023', views: 1_240_000, payout: mockClipEarnings(1_240_000, DEMO_CMP001_CREATOR) },
  { period: '2024', views: 1_680_000, payout: mockClipEarnings(1_680_000, DEMO_CMP001_CREATOR) },
  { period: '2025', views: 2_050_000, payout: mockClipEarnings(2_050_000, DEMO_CMP001_CREATOR) },
  { period: '2026', views: 2_340_000, payout: mockClipEarnings(2_340_000, DEMO_CMP001_CREATOR) },
]

export const mockCreatorPlatformLinks: CreatorPlatformLink[] = [
  {
    platform: 'tiktok',
    label: 'TikTok',
    handle: '@demo_creator',
    status: 'connected',
    connectedAt: daysAgo(18),
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    handle: 'facebook.com/demo.creator',
    status: 'reconnect',
    connectedAt: daysAgo(41),
  },
]

export const mockWeeklyPayoutPackages: WeeklyPayoutPackage[] = [
  {
    id: 'pkg-001',
    campaignId: 'cmp-001',
    periodLabel: 'May 1-7, 2026',
    status: 'ready',
    lines: [
      {
        id: 'line-001',
        clipId: 'bclip-002',
        creatorName: 'Diego C.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'tiktok',
        openingViews: 50_000,
        verifiedAtCutoff: 92_000,
        deltaViews: 42_000,
        ...demoWeeklySlice(42_000, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        flag: 'Unusual view spike: low engagement ratio.',
        status: 'ready',
      },
      {
        id: 'line-002',
        clipId: 'bclip-003',
        creatorName: 'Anna L.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'facebook',
        openingViews: 0,
        verifiedAtCutoff: 6_400,
        deltaViews: 6_400,
        ...demoWeeklySlice(6_400, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-003',
        clipId: 'bclip-005',
        creatorName: 'Sofia T.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'tiktok',
        openingViews: 33_000,
        verifiedAtCutoff: 45_000,
        deltaViews: 12_000,
        ...demoWeeklySlice(12_000, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-004',
        clipId: 'bclip-006',
        creatorName: 'Jay M.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'facebook',
        openingViews: 16_200,
        verifiedAtCutoff: 24_200,
        deltaViews: 8_000,
        ...demoWeeklySlice(8_000, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-005',
        clipId: 'bclip-007',
        creatorName: 'Lena K.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'tiktok',
        openingViews: 96_000,
        verifiedAtCutoff: 118_000,
        deltaViews: 22_000,
        ...demoWeeklySlice(22_000, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-006',
        clipId: 'bclip-008',
        creatorName: 'Marco D.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'facebook',
        openingViews: 8_300,
        verifiedAtCutoff: 11_500,
        deltaViews: 3_200,
        ...demoWeeklySlice(3_200, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-007',
        clipId: 'bclip-009',
        creatorName: 'Nina S.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'tiktok',
        openingViews: 73_000,
        verifiedAtCutoff: 88_000,
        deltaViews: 15_000,
        ...demoWeeklySlice(15_000, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-008',
        clipId: 'bclip-010',
        creatorName: 'Paolo V.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'tiktok',
        openingViews: 32_000,
        verifiedAtCutoff: 41_000,
        deltaViews: 9_000,
        ...demoWeeklySlice(9_000, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-009',
        clipId: 'bclip-011',
        creatorName: 'Carla B.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'facebook',
        openingViews: 12_800,
        verifiedAtCutoff: 17_800,
        deltaViews: 5_000,
        ...demoWeeklySlice(5_000, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-010',
        clipId: 'bclip-012',
        creatorName: 'Erin G.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'tiktok',
        openingViews: 58_000,
        verifiedAtCutoff: 76_000,
        deltaViews: 18_000,
        ...demoWeeklySlice(18_000, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-011',
        clipId: 'bclip-013',
        creatorName: 'Tom R.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'tiktok',
        openingViews: 38_400,
        verifiedAtCutoff: 52_400,
        deltaViews: 14_000,
        ...demoWeeklySlice(14_000, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
      {
        id: 'line-012',
        clipId: 'bclip-014',
        creatorName: 'Ivy W.',
        campaignId: 'cmp-001',
        campaignTitle: 'Kitchen Glow-Up — Viral Cooking Clips Campaign',
        platform: 'facebook',
        openingViews: 5_100,
        verifiedAtCutoff: 9_600,
        deltaViews: 4_500,
        ...demoWeeklySlice(4_500, DEMO_CMP001_BRAND, DEMO_CMP001_CREATOR),
        status: 'ready',
      },
    ],
  },
]

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
}
