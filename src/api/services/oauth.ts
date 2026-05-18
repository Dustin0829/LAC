import api from '@/api/client'
import type { OAuthAuthorizeStartData } from '@/api/types/oauth.types'

async function oauthAuthorizeUrlFromStart(path: string, fallbackError: string): Promise<string> {
  const res = await api.get<OAuthAuthorizeStartData>(path, {
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

  throw new Error(fallbackError)
}

/**
 * `GET /oauth/tiktok/start` (Bearer). Returns TikTok authorize URL (JSON body or 302 Location).
 */
export async function getOAuthTikTokAuthorizeUrl(): Promise<string> {
  return oauthAuthorizeUrlFromStart('/oauth/tiktok/start', 'Could not start TikTok OAuth.')
}

/**
 * `GET /oauth/facebook/start` (Bearer). Returns Meta authorize URL (302 Location).
 */
export async function getOAuthFacebookAuthorizeUrl(): Promise<string> {
  return oauthAuthorizeUrlFromStart('/oauth/facebook/start', 'Could not start Facebook OAuth.')
}

/** `GET /oauth/facebook/page/start` — Page app only (re-grant Pages). */
export async function getOAuthFacebookPageAuthorizeUrl(): Promise<string> {
  return oauthAuthorizeUrlFromStart(
    '/oauth/facebook/page/start',
    'Could not start Facebook Page OAuth.'
  )
}
