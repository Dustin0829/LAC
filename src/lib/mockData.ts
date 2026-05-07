/**
 * Arpify mock data — clipping platform.
 * - Brands create campaigns with a `ratePer1k` (₱ per 1,000 views) and a `budget`.
 * - Clippers submit `clips` (URLs) to a campaign; clips accrue `views` over time.
 * - Earnings = views / 1000 * ratePer1k.
 */

export type Platform = 'tiktok' | 'youtube' | 'instagram' | 'facebook'
export type ContentNiche =
  | 'gaming'
  | 'entertainment'
  | 'lifestyle'
  | 'tech'
  | 'food'
  | 'fashion'
  | 'fitness'
  | 'finance'
  | 'education'
export type CampaignStatus = 'active' | 'paused' | 'ended' | 'draft'
export type ClipStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export const CLIPPER_PAYOUT_PERCENT = 0.8
export const DEFAULT_REFUNDABLE_PERCENT = 0.8

export function getPlatformFeePercent(totalBudget: number): number {
  if (totalBudget >= 200_000) return 0.1
  if (totalBudget >= 50_000) return 0.15
  return 0.2
}

export function getClipperRatePer1k(brandRatePer1k: number): number {
  return Math.round(brandRatePer1k * CLIPPER_PAYOUT_PERCENT * 100) / 100
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
  /** Net ₱ per 1,000 views shown/paid to clippers. */
  ratePer1k: number
  /** Total ₱ campaign budget paid by the brand. */
  budget: number
  /** Arpify platform fee from the campaign budget. */
  platformFeePercent?: number
  /** Maximum refundable portion of the total campaign budget. */
  refundablePercent?: number
  /** ₱ already paid out (computed from approved/paid clips) */
  spent: number
  /** Cumulative views across all clips on this campaign (mock aggregate). */
  campaignViews: number
  /** Target view volume the campaign is aiming for (goal bar). */
  estimatedReach: number
  platforms: Platform[]
  niches: ContentNiche[]
  status: CampaignStatus
  startDate: string
  endDate: string
  /** Sample/reference URL */
  sampleUrl?: string
  /** Asset/raw footage source URL */
  assetUrl?: string
  /** Uploaded campaign files clippers can use in their edits. */
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
  /** Submitted clip URL (TikTok/YouTube/etc) */
  url: string
  platform: Platform
  /** Current view count (mocked) */
  views: number
  /** Earnings = views/1000 * ratePer1k. */
  earnings: number
  status: ClipStatus
  submittedAt: string
  reviewedAt?: string
  paidAt?: string
  thumbnailColor: string
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
    campaignViews: 340_000,
    estimatedReach: 620_000,
    platforms: ['tiktok', 'instagram'],
    niches: ['food', 'lifestyle'],
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
      'Cut highlights from the Hyperion Cup matches. Best plays, hype moments, funny fails. Drop on TikTok or YouTube Shorts.',
    brandRatePer1k: 150,
    ratePer1k: 120,
    budget: 80000,
    platformFeePercent: 0.15,
    refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
    spent: 41200,
    campaignViews: 368_000,
    estimatedReach: 600_000,
    platforms: ['tiktok', 'youtube'],
    niches: ['gaming', 'entertainment'],
    status: 'active',
    startDate: daysAgo(14),
    endDate: daysFromNow(10),
    sampleUrl: 'https://youtube.com/shorts/hyperion-sample',
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
    campaignViews: 118_000,
    estimatedReach: 290_000,
    platforms: ['tiktok', 'instagram'],
    niches: ['lifestyle', 'fashion'],
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
    campaignViews: 198_000,
    estimatedReach: 460_000,
    platforms: ['tiktok', 'youtube', 'instagram'],
    niches: ['finance', 'education'],
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
    campaignViews: 212_000,
    estimatedReach: 228_000,
    platforms: ['tiktok', 'youtube'],
    niches: ['tech', 'entertainment'],
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
    campaignViews: 8_200,
    estimatedReach: 420_000,
    platforms: ['tiktok', 'instagram'],
    niches: ['fitness', 'lifestyle'],
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
    url: 'https://youtube.com/shorts/abc',
    platform: 'youtube',
    views: 9_400,
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
    earnings: 0,
    status: 'rejected',
    submittedAt: daysAgo(10),
    reviewedAt: daysAgo(9),
    thumbnailColor: COVER_COLORS[3],
  },
]

/** Brand POV: simulated submissions from various clippers on this brand’s campaigns. */
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
    url: 'https://www.instagram.com/reel/xyz',
    platform: 'instagram',
    views: 6_400,
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
    earnings: 0,
    status: 'rejected',
    submittedAt: daysAgo(2),
    reviewedAt: daysAgo(1),
    thumbnailColor: COVER_COLORS[4],
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

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  youtube: 'YouTube',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

export const NICHE_LABEL: Record<ContentNiche, string> = {
  gaming: 'Gaming',
  entertainment: 'Entertainment',
  lifestyle: 'Lifestyle',
  tech: 'Tech',
  food: 'Food',
  fashion: 'Fashion',
  fitness: 'Fitness',
  finance: 'Finance',
  education: 'Education',
}
