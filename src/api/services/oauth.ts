import api from '@/api/client'
import type { OAuthTikTokStartData } from '@/api/types/oauth.types'

/**
 * `GET /oauth/tiktok/start` (Bearer). Returns TikTok authorize URL (JSON body or 302 Location).
 */
export async function getOAuthTikTokAuthorizeUrl(): Promise<string> {
  const res = await api.get<OAuthTikTokStartData>('/oauth/tiktok/start', {
    headers: { Accept: 'application/json' },
    maxRedirects: 0,
    validateStatus: (status) => status === 200 || status === 302,
    withCredentials: true,
  })

  if (res.status === 200 && res.data?.authorizeUrl) {
    return res.data.authorizeUrl
  }

  if (res.status === 302) {
    const location = res.headers.location
    if (location) return location
  }

  throw new Error('Could not start TikTok OAuth.')
}
