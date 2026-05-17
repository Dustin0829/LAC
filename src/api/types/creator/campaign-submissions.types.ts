import type { Platform } from '@/api/types/shared'

export interface CampaignSubmissionBody {
  url: string
  platform: Platform
}

export interface CampaignSubmissionPreviewData {
  eligible: boolean
  views: string
  likes?: string
  comments?: string
  issues: string[]
  cached?: boolean
}

export interface CampaignSubmissionConfirmData {
  submission: {
    id: string
    status: string
  }
}
