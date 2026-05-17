import type { Platform } from '@/api/types/shared'

export type PlatformOAuthCallbackResult =
  | { handled: false }
  | {
      handled: true
      status: 'success' | 'error'
      platform: Platform
      reason?: string
    }

const PLATFORMS: Platform[] = ['tiktok', 'facebook']

function isPlatform(value: string | null): value is Platform {
  return value !== null && PLATFORMS.includes(value as Platform)
}

/** Strip `oauth`, `platform`, and `reason` from the URL after TikTok/Meta redirect to the SPA. */
export function consumeCreatorPlatformOAuthSearchParams(): PlatformOAuthCallbackResult {
  if (typeof window === 'undefined') {
    return { handled: false }
  }

  const params = new URLSearchParams(window.location.search)
  const oauth = params.get('oauth')
  const platformParam = params.get('platform')

  if (!oauth || !isPlatform(platformParam)) {
    return { handled: false }
  }

  const reason = params.get('reason') ?? undefined
  params.delete('oauth')
  params.delete('platform')
  params.delete('reason')

  const search = params.toString()
  const path = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', path)

  if (oauth === 'success') {
    return { handled: true, status: 'success', platform: platformParam }
  }

  return {
    handled: true,
    status: 'error',
    platform: platformParam,
    reason: reason ? decodeURIComponent(reason) : undefined,
  }
}
