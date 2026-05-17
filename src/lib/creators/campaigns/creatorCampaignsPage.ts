import type { ComponentType } from 'react'
import { Clock, CircleDollarSign } from 'lucide-react'
import type { ListCampaignsParams } from '@/api/types/campaigns.types'
import type { CampaignStatus, Platform } from '@/api/types/shared'
import { PLATFORM_LABEL } from '@/lib/platforms/labels'

export type CreatorCampaignStatusFilter = 'all' | Extract<CampaignStatus, 'active' | 'paused' | 'ended'>

export type CreatorCampaignSortId = 'newest' | 'rate'

export const CREATOR_CAMPAIGN_STATUS_OPTIONS: { value: CreatorCampaignStatusFilter; label: string }[] =
  [
    { value: 'all', label: 'All Campaigns' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'ended', label: 'Ended' },
  ]

export const CREATOR_CAMPAIGN_PLATFORM_OPTIONS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: 'All platforms' },
  { value: 'tiktok', label: PLATFORM_LABEL.tiktok },
  { value: 'facebook', label: PLATFORM_LABEL.facebook },
]

export const CREATOR_CAMPAIGN_SORT_OPTIONS: {
  id: CreatorCampaignSortId
  label: string
  icon: ComponentType<{ className?: string }>
}[] = [
  { id: 'newest', label: 'Newest', icon: Clock },
  { id: 'rate', label: 'Highest Rate', icon: CircleDollarSign },
]

export function creatorCampaignListParams(
  status: CreatorCampaignStatusFilter,
  platform: Platform | 'all',
  sort: CreatorCampaignSortId
): ListCampaignsParams {
  return {
    status,
    ...(platform !== 'all' ? { platform } : {}),
    sort: sort === 'rate' ? 'highest_rate' : 'newest',
  }
}

export function creatorCampaignEmptyFilterTitle() {
  return 'No campaigns match those filters'
}

export function creatorCampaignEmptyFilterDescription() {
  return 'Try adjusting filters.'
}
