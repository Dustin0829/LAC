import type { Platform } from '@/api/types/shared'

/**
 * Best-effort creator profile URL from a submission post/reel URL.
 * Falls back to `null` when the hostname/path cannot be parsed (caller can use post URL).
 */
export function socialProfileUrlFromSubmission(postUrl: string, platform: Platform): string | null {
  try {
    const u = new URL(postUrl)

    if (platform === 'tiktok') {
      const m = u.pathname.match(/^\/@([^/]+)/)
      if (m?.[1]) return `https://www.tiktok.com/@${m[1]}`
      return null
    }

    if (platform === 'facebook') {
      const skip = new Set([
        'watch',
        'reel',
        'reels',
        'share',
        'groups',
        'stories',
        'login',
        'tr',
        'plugins',
      ])
      const segments = u.pathname.split('/').filter(Boolean)
      const first = segments[0]
      if (first && !skip.has(first.toLowerCase()) && !/^\d+$/.test(first)) {
        return `${u.origin}/${first}`
      }
      return null
    }
  } catch {
    return null
  }
  return null
}

export function creatorSocialHrefOrPost(postUrl: string, platform: Platform): string {
  return socialProfileUrlFromSubmission(postUrl, platform) ?? postUrl
}
