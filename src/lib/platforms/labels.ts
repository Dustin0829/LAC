import type { Platform } from '@/api/types/shared'

export const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
}

/** Example content URL shown in the submit-content dialog placeholder. */
export const PLATFORM_CONTENT_URL_PLACEHOLDER: Record<Platform, string> = {
  tiktok: 'https://www.tiktok.com/@you/video/...',
  facebook: 'https://www.facebook.com/reel/...',
}
