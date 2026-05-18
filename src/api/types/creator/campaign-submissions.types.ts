import type { Platform } from '@/api/types/shared'

export interface CampaignSubmissionBody {
  url: string
  platform: Platform
}

export interface CampaignSubmissionPreviewData {
  eligible: boolean
  views: string
  /** TikTok */
  likes?: string
  comments?: string
  /** Facebook Reels (`post_video_likes_by_reaction_type`, `post_video_social_actions`) */
  reactions?: string
  engagements?: string
  issues: string[]
  cached?: boolean
}

export interface CampaignSubmissionConfirmData {
  submission: {
    id: string
    status: string
  }
}
