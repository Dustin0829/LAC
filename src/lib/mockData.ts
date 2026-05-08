/**
 * Arpify mock data — UI-only MVP prototype.
 * - Brands set gross ₱/1k (`brandRatePer1k`); brand UI shows that headline rate.
 * - Creator UI shows net ₱/1k after the 20% platform fee (`ratePer1k` / `creatorHeadlineRatePer1k`).
 * - Creators submit `clips` (URLs); earnings use the net rate × verified views / 1,000.
 */

export type Platform = 'tiktok' | 'facebook'
export type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft'
export type ClipStatus = 'pending' | 'approved' | 'rejected' | 'paid'
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

export function getAvailableBalance(campaign: Pick<Campaign, 'budget' | 'spent' | 'reservedBalance' | 'availableBalance'>): number {
  if (typeof campaign.availableBalance === 'number') return campaign.availableBalance
  return Math.max(0, getNetSpendable(campaign.budget) - campaign.spent - (campaign.reservedBalance ?? 0))
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
  /** Total ₱ campaign budget paid by the brand. */
  budget: number
  /** Arpify intake fee from confirmed campaign funding. */
  platformFeePercent?: number
  /** Maximum refundable portion of the total campaign budget. */
  refundablePercent?: number
  /** ₱ already paid out (computed from approved/paid clips) */
  spent: number
  availableBalance?: number
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

export const mockCampaigns: Campaign[] = [
  {
    id: 'cmp-001',
    brandId: 'brand-1',
    brandName: 'Kape Manila',
    brandLogoColor: 'from-zinc-950 to-zinc-700',
    title: 'Bagong Latte Drop — TikTok Clipping Campaign',
    description:
      'Help us launch our new Spanish Latte! Clip our brand reels, in-store moments, or create your own UGC. Higher views = higher payout.',
    brandRatePer1k: 112.5,
    ratePer1k: 90,
    budget: 50000,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 18230,
    availableBalance: 12520,
    reservedBalance: 11650,
    minimumPublishBalance: 10000,
    campaignViews: 340_000,
    estimatedReach: 620_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(8),
    endDate: daysFromNow(22),
    sampleUrl: 'https://www.tiktok.com/@kapemanila/video/sample',
    assetUrl: 'https://drive.google.com/folder/kape-manila-assets',
    assets: [
      {
        id: 'asset-001',
        name: 'kape-manila-product-shots.zip',
        size: 48_200_000,
        type: 'application/zip',
        url: 'https://drive.google.com/file/kape-manila-product-shots',
      },
      {
        id: 'asset-002',
        name: 'spanish-latte-broll.mp4',
        size: 126_400_000,
        type: 'video/mp4',
        url: 'https://drive.google.com/file/spanish-latte-broll',
      },
    ],
    rules: [
      'Clip must be at least 15 seconds long',
      'Use #KapeManila and tag @kapemanila',
      'No reused/duplicate clips',
      'Original audio or licensed music only',
    ],
    coverColor: COVER_COLORS[0],
    coverImageUrl:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cmp-002',
    brandId: 'brand-2',
    brandName: 'Hyperion Esports',
    brandLogoColor: 'from-neutral-950 to-zinc-700',
    title: 'MLBB Tournament Highlights — Earn per 1k views',
    description:
      'Cut highlights from the Hyperion Cup matches. Best plays, hype moments, funny fails. Drop on TikTok or Facebook Reels.',
    brandRatePer1k: 150,
    ratePer1k: 120,
    budget: 80000,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 41200,
    availableBalance: 18600,
    reservedBalance: 8200,
    minimumPublishBalance: 10000,
    campaignViews: 368_000,
    estimatedReach: 600_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(14),
    endDate: daysFromNow(10),
    sampleUrl: 'https://www.facebook.com/reel/hyperion-sample',
    assetUrl: 'https://drive.google.com/folder/hyperion-vods',
    assets: [
      {
        id: 'asset-003',
        name: 'hyperion-cup-vod-highlights.zip',
        size: 214_000_000,
        type: 'application/zip',
        url: 'https://drive.google.com/file/hyperion-cup-vod-highlights',
      },
    ],
    rules: [
      'Use raw VODs from our shared drive only',
      'No spoilers in title (matches reveal weekly)',
      'Tag @hyperion_esports and use #HyperionCup',
    ],
    coverColor: COVER_COLORS[5],
    coverImageUrl:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cmp-003',
    brandId: 'brand-3',
    brandName: 'GlowUp Skincare',
    brandLogoColor: 'from-stone-900 to-stone-600',
    title: 'Acne Cleanser Reviews — Honest UGC',
    description:
      'Share your honest review or before/after using our Acne Cleanser. We pay for views — so longer watch time helps you earn more.',
    brandRatePer1k: 93.75,
    ratePer1k: 75,
    budget: 30000,
    platformFeePercent: 0.2,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 8950,
    availableBalance: 15820,
    reservedBalance: 730,
    minimumPublishBalance: 10000,
    campaignViews: 118_000,
    estimatedReach: 290_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(4),
    endDate: daysFromNow(30),
    rules: [
      'Show product clearly in the first 3 seconds',
      'Include a CTA to glowup.ph',
      '#GlowUpPH required',
    ],
    coverColor: COVER_COLORS[1],
    coverImageUrl:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cmp-004',
    brandId: 'brand-4',
    brandName: 'Pesos & Sense',
    brandLogoColor: 'from-slate-950 to-slate-600',
    title: 'Personal Finance Clips for Gen Z',
    description:
      'Clip our long-form podcast into short, punchy advice. Perfect for finance content creators.',
    brandRatePer1k: 125,
    ratePer1k: 100,
    budget: 40000,
    platformFeePercent: 0.2,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 12400,
    availableBalance: 18800,
    reservedBalance: 2800,
    minimumPublishBalance: 10000,
    campaignViews: 198_000,
    estimatedReach: 460_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(20),
    endDate: daysFromNow(40),
    rules: [
      'Add captions',
      'Credit @pesosandsense',
      'Keep clips under 90 seconds for best payout',
    ],
    coverColor: COVER_COLORS[3],
    coverImageUrl:
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cmp-005',
    brandId: 'brand-5',
    brandName: 'Kuya Tech PH',
    brandLogoColor: 'from-zinc-900 to-neutral-600',
    title: 'iPhone vs Android Debate Clips',
    description:
      'Hot take clips from our debate series. Drama, snark, and good editing pays well here.',
    brandRatePer1k: 137.5,
    ratePer1k: 110,
    budget: 25000,
    platformFeePercent: 0.2,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 24500,
    availableBalance: 0,
    reservedBalance: 0,
    minimumPublishBalance: 10000,
    campaignViews: 212_000,
    estimatedReach: 228_000,
    platforms: ['tiktok', 'facebook'],
    status: 'paused',
    startDate: daysAgo(45),
    endDate: daysFromNow(2),
    rules: ['Hook within 2 seconds', 'No misinformation'],
    coverColor: COVER_COLORS[2],
    coverImageUrl:
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'cmp-006',
    brandId: 'brand-6',
    brandName: 'FitMNL Gym',
    brandLogoColor: 'from-neutral-950 to-stone-700',
    title: 'Transformation Stories — 30 Day Challenge',
    description:
      'Real member transformations and gym vibe clips. Looking for high-energy edits.',
    brandRatePer1k: 106.25,
    ratePer1k: 85,
    budget: 35000,
    platformFeePercent: 0.2,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 0,
    availableBalance: 29750,
    reservedBalance: 0,
    minimumPublishBalance: 10000,
    campaignViews: 8_200,
    estimatedReach: 420_000,
    platforms: ['tiktok', 'facebook'],
    status: 'active',
    startDate: daysAgo(2),
    endDate: daysFromNow(60),
    rules: ['Get consent before using member footage', '#FitMNL'],
    coverColor: COVER_COLORS[4],
    coverImageUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
  },
]

export const mockClips: Clip[] = [
  {
    id: 'clip-001',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop — TikTok Clipping Campaign',
    brandName: 'Kape Manila',
    clipperId: 'me',
    clipperName: 'You',
    url: 'https://www.tiktok.com/@you/video/01',
    platform: 'tiktok',
    views: 142_300,
    viewsPaidThrough: 120_000,
    deltaViews: 22_300,
    earnings: 4500,
    status: 'paid',
    submittedAt: daysAgo(7),
    reviewedAt: daysAgo(6),
    paidAt: daysAgo(2),
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'clip-002',
    campaignId: 'cmp-002',
    campaignTitle: 'MLBB Tournament Highlights — Earn per 1k views',
    brandName: 'Hyperion Esports',
    clipperId: 'me',
    clipperName: 'You',
    url: 'https://www.tiktok.com/@you/video/02',
    platform: 'tiktok',
    views: 38_200,
    viewsPaidThrough: 0,
    deltaViews: 38_200,
    earnings: 4584,
    status: 'approved',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    thumbnailColor: COVER_COLORS[5],
  },
  {
    id: 'clip-003',
    campaignId: 'cmp-002',
    campaignTitle: 'MLBB Tournament Highlights — Earn per 1k views',
    brandName: 'Hyperion Esports',
    clipperId: 'me',
    clipperName: 'You',
    url: 'https://www.facebook.com/reel/abc',
    platform: 'facebook',
    views: 9_400,
    viewsPaidThrough: 0,
    deltaViews: 9_400,
    trustFlag: 'Metrics pending: waiting for first verified cutoff.',
    earnings: 1128,
    status: 'pending',
    submittedAt: daysAgo(1),
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'clip-004',
    campaignId: 'cmp-003',
    campaignTitle: 'Acne Cleanser Reviews — Honest UGC',
    brandName: 'GlowUp Skincare',
    clipperId: 'me',
    clipperName: 'You',
    url: 'https://www.tiktok.com/@you/video/04',
    platform: 'tiktok',
    views: 21_500,
    viewsPaidThrough: 12_000,
    deltaViews: 9_500,
    earnings: 1612.5,
    status: 'approved',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'clip-005',
    campaignId: 'cmp-004',
    campaignTitle: 'Personal Finance Clips for Gen Z',
    brandName: 'Pesos & Sense',
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
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-1',
    clipperName: 'Mika R.',
    url: 'https://www.tiktok.com/@mika/video/01',
    platform: 'tiktok',
    views: 234_000,
    viewsPaidThrough: 188_000,
    deltaViews: 46_000,
    earnings: 4500,
    status: 'paid',
    submittedAt: daysAgo(8),
    reviewedAt: daysAgo(7),
    paidAt: daysAgo(3),
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'bclip-002',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-2',
    clipperName: 'Diego C.',
    url: 'https://www.tiktok.com/@diego/video/01',
    platform: 'tiktok',
    views: 92_000,
    viewsPaidThrough: 50_000,
    deltaViews: 42_000,
    trustFlag: 'Unusual view spike: review engagement before release.',
    earnings: 4500,
    status: 'approved',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'bclip-003',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-3',
    clipperName: 'Anna L.',
    url: 'https://www.facebook.com/reel/xyz',
    platform: 'facebook',
    views: 6_400,
    viewsPaidThrough: 0,
    deltaViews: 6_400,
    earnings: 576,
    status: 'pending',
    submittedAt: daysAgo(1),
    thumbnailColor: COVER_COLORS[3],
  },
  {
    id: 'bclip-004',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
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
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-5',
    clipperName: 'Sofia T.',
    url: 'https://www.tiktok.com/@sofia/video/kape-01',
    platform: 'tiktok',
    views: 45_000,
    viewsPaidThrough: 33_000,
    deltaViews: 12_000,
    earnings: 1080,
    status: 'approved',
    submittedAt: daysAgo(6),
    reviewedAt: daysAgo(5),
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'bclip-006',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-6',
    clipperName: 'Jay M.',
    url: 'https://www.facebook.com/reel/jay-kape-latte',
    platform: 'facebook',
    views: 24_200,
    viewsPaidThrough: 16_200,
    deltaViews: 8_000,
    earnings: 720,
    status: 'approved',
    submittedAt: daysAgo(4),
    reviewedAt: daysAgo(3),
    thumbnailColor: COVER_COLORS[3],
  },
  {
    id: 'bclip-007',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-7',
    clipperName: 'Lena K.',
    url: 'https://www.tiktok.com/@lena/video/latte-ugc',
    platform: 'tiktok',
    views: 118_000,
    viewsPaidThrough: 96_000,
    deltaViews: 22_000,
    earnings: 1980,
    status: 'approved',
    submittedAt: daysAgo(7),
    reviewedAt: daysAgo(6),
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'bclip-008',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-8',
    clipperName: 'Marco D.',
    url: 'https://www.facebook.com/reel/marco-kape',
    platform: 'facebook',
    views: 11_500,
    viewsPaidThrough: 8_300,
    deltaViews: 3_200,
    earnings: 288,
    status: 'approved',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    thumbnailColor: COVER_COLORS[5],
  },
  {
    id: 'bclip-009',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-9',
    clipperName: 'Nina S.',
    url: 'https://www.tiktok.com/@nina/video/kape-reel',
    platform: 'tiktok',
    views: 88_000,
    viewsPaidThrough: 73_000,
    deltaViews: 15_000,
    earnings: 1350,
    status: 'approved',
    submittedAt: daysAgo(5),
    reviewedAt: daysAgo(4),
    thumbnailColor: COVER_COLORS[0],
  },
  {
    id: 'bclip-010',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-10',
    clipperName: 'Paolo V.',
    url: 'https://www.tiktok.com/@paolo/video/latte-hops',
    platform: 'tiktok',
    views: 41_000,
    viewsPaidThrough: 32_000,
    deltaViews: 9_000,
    earnings: 810,
    status: 'approved',
    submittedAt: daysAgo(2),
    reviewedAt: daysAgo(1),
    thumbnailColor: COVER_COLORS[4],
  },
  {
    id: 'bclip-011',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-11',
    clipperName: 'Carla B.',
    url: 'https://www.facebook.com/reel/carla-spanish-latte',
    platform: 'facebook',
    views: 17_800,
    viewsPaidThrough: 12_800,
    deltaViews: 5_000,
    earnings: 450,
    status: 'approved',
    submittedAt: daysAgo(6),
    reviewedAt: daysAgo(5),
    thumbnailColor: COVER_COLORS[2],
  },
  {
    id: 'bclip-012',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-12',
    clipperName: 'Erin G.',
    url: 'https://www.tiktok.com/@erin/video/kape-manila',
    platform: 'tiktok',
    views: 76_000,
    viewsPaidThrough: 58_000,
    deltaViews: 18_000,
    earnings: 1620,
    status: 'approved',
    submittedAt: daysAgo(4),
    reviewedAt: daysAgo(3),
    thumbnailColor: COVER_COLORS[3],
  },
  {
    id: 'bclip-013',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-13',
    clipperName: 'Tom R.',
    url: 'https://www.tiktok.com/@tom/video/latte-challenge',
    platform: 'tiktok',
    views: 52_400,
    viewsPaidThrough: 38_400,
    deltaViews: 14_000,
    earnings: 1260,
    status: 'approved',
    submittedAt: daysAgo(3),
    reviewedAt: daysAgo(2),
    thumbnailColor: COVER_COLORS[1],
  },
  {
    id: 'bclip-014',
    campaignId: 'cmp-001',
    campaignTitle: 'Bagong Latte Drop',
    brandName: 'Kape Manila',
    clipperId: 'clipper-14',
    clipperName: 'Ivy W.',
    url: 'https://www.facebook.com/reel/ivy-kape-drop',
    platform: 'facebook',
    views: 9_600,
    viewsPaidThrough: 5_100,
    deltaViews: 4_500,
    earnings: 405,
    status: 'approved',
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

/** Earnings over the last 6 weeks (for clipper dashboard chart). */
export const mockEarningsTrend = [
  { week: 'W1', earnings: 1240 },
  { week: 'W2', earnings: 2100 },
  { week: 'W3', earnings: 3580 },
  { week: 'W4', earnings: 2980 },
  { week: 'W5', earnings: 4520 },
  { week: 'W6', earnings: 6210 },
]

/** Brand campaign performance over time. */
export const mockBrandPerformance = [
  { week: 'W1', views: 18_000, payout: 1620 },
  { week: 'W2', views: 42_000, payout: 3780 },
  { week: 'W3', views: 71_500, payout: 6435 },
  { week: 'W4', views: 88_200, payout: 7938 },
  { week: 'W5', views: 110_000, payout: 9900 },
  { week: 'W6', views: 156_000, payout: 14_040 },
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
        campaignTitle: 'Bagong Latte Drop',
        platform: 'tiktok',
        openingViews: 50_000,
        verifiedAtCutoff: 92_000,
        deltaViews: 42_000,
        grossAccrual: 420,
        creatorNet: 336,
        platformFee: 84,
        flag: 'Unusual view spike: low engagement ratio.',
        status: 'ready',
      },
      {
        id: 'line-002',
        clipId: 'bclip-003',
        creatorName: 'Anna L.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'facebook',
        openingViews: 0,
        verifiedAtCutoff: 6_400,
        deltaViews: 6_400,
        grossAccrual: 64,
        creatorNet: 51.2,
        platformFee: 12.8,
        status: 'ready',
      },
      {
        id: 'line-003',
        clipId: 'bclip-005',
        creatorName: 'Sofia T.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'tiktok',
        openingViews: 33_000,
        verifiedAtCutoff: 45_000,
        deltaViews: 12_000,
        grossAccrual: 1_350,
        creatorNet: 1_080,
        platformFee: 270,
        status: 'ready',
      },
      {
        id: 'line-004',
        clipId: 'bclip-006',
        creatorName: 'Jay M.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'facebook',
        openingViews: 16_200,
        verifiedAtCutoff: 24_200,
        deltaViews: 8_000,
        grossAccrual: 900,
        creatorNet: 720,
        platformFee: 180,
        status: 'ready',
      },
      {
        id: 'line-005',
        clipId: 'bclip-007',
        creatorName: 'Lena K.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'tiktok',
        openingViews: 96_000,
        verifiedAtCutoff: 118_000,
        deltaViews: 22_000,
        grossAccrual: 2_475,
        creatorNet: 1_980,
        platformFee: 495,
        status: 'ready',
      },
      {
        id: 'line-006',
        clipId: 'bclip-008',
        creatorName: 'Marco D.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'facebook',
        openingViews: 8_300,
        verifiedAtCutoff: 11_500,
        deltaViews: 3_200,
        grossAccrual: 360,
        creatorNet: 288,
        platformFee: 72,
        status: 'ready',
      },
      {
        id: 'line-007',
        clipId: 'bclip-009',
        creatorName: 'Nina S.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'tiktok',
        openingViews: 73_000,
        verifiedAtCutoff: 88_000,
        deltaViews: 15_000,
        grossAccrual: 1_688,
        creatorNet: 1_350,
        platformFee: 338,
        status: 'ready',
      },
      {
        id: 'line-008',
        clipId: 'bclip-010',
        creatorName: 'Paolo V.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'tiktok',
        openingViews: 32_000,
        verifiedAtCutoff: 41_000,
        deltaViews: 9_000,
        grossAccrual: 1_013,
        creatorNet: 810,
        platformFee: 203,
        status: 'ready',
      },
      {
        id: 'line-009',
        clipId: 'bclip-011',
        creatorName: 'Carla B.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'facebook',
        openingViews: 12_800,
        verifiedAtCutoff: 17_800,
        deltaViews: 5_000,
        grossAccrual: 563,
        creatorNet: 450,
        platformFee: 113,
        status: 'ready',
      },
      {
        id: 'line-010',
        clipId: 'bclip-012',
        creatorName: 'Erin G.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'tiktok',
        openingViews: 58_000,
        verifiedAtCutoff: 76_000,
        deltaViews: 18_000,
        grossAccrual: 2_025,
        creatorNet: 1_620,
        platformFee: 405,
        status: 'ready',
      },
      {
        id: 'line-011',
        clipId: 'bclip-013',
        creatorName: 'Tom R.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'tiktok',
        openingViews: 38_400,
        verifiedAtCutoff: 52_400,
        deltaViews: 14_000,
        grossAccrual: 1_575,
        creatorNet: 1_260,
        platformFee: 315,
        status: 'ready',
      },
      {
        id: 'line-012',
        clipId: 'bclip-014',
        creatorName: 'Ivy W.',
        campaignId: 'cmp-001',
        campaignTitle: 'Bagong Latte Drop',
        platform: 'facebook',
        openingViews: 5_100,
        verifiedAtCutoff: 9_600,
        deltaViews: 4_500,
        grossAccrual: 506,
        creatorNet: 405,
        platformFee: 101,
        status: 'ready',
      },
    ],
  },
]

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
}
