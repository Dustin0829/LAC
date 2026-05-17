import type { Platform } from '@/api/types/shared'

/** Details tab per-section Edit / Save (ghost + primary text). */
export const DETAILS_SECTION_ACTION_BTN_CLASS =
  'h-auto shrink-0 gap-1.5 px-2 py-1.5 font-semibold text-primary hover:bg-primary/10 hover:text-primary'

export const PLATFORM_OPTIONS: { id: Platform; label: string }[] = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
]

export const BRAND_REJECT_PRESETS = [
  { id: 'fraud', label: 'Suspicious or fraudulent activity' },
  { id: 'duplicate', label: 'Duplicate or recycled content' },
  { id: 'requirements', label: 'Campaign requirements not met' },
  { id: 'policy', label: 'Policy or brand-safety concern' },
  { id: 'other', label: 'Other' },
] as const

/** Rejected table row — submissions, payout accordion, release modal. */
export const BRAND_REJECTED_ROW_CLASS = 'bg-red-50/90 dark:bg-red-950/35'

/** Red-outlined Reject CTA (outline variant + destructive border/text). */
export const BRAND_REJECT_OUTLINE_BTN_CLASS =
  'border-destructive text-destructive shadow-none hover:border-destructive hover:bg-destructive/10 hover:text-destructive'

export type BrandRejectPresetId = (typeof BRAND_REJECT_PRESETS)[number]['id']

export type BrandRejectTarget = { submissionId: string; creatorName: string }

export type DetailsEditSection = 'copy' | 'platforms' | 'grossRate' | 'rules' | 'assets' | 'references'

export type CampaignTab = 'details' | 'submissions-payout' | 'budget'

const CAMPAIGN_TABS = new Set<CampaignTab>(['details', 'submissions-payout', 'budget'])

export function parseCampaignTabParam(raw: string | null): CampaignTab {
  if (raw === 'submissions' || raw === 'payout') return 'submissions-payout'
  if (raw && CAMPAIGN_TABS.has(raw as CampaignTab)) return raw as CampaignTab
  return 'details'
}
