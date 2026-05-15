import { toast } from 'sonner'
import { getOAuthTikTokAuthorizeUrl } from '@/api/services/oauth'

/**
 * Starts creator TikTok OAuth (`GET /oauth/tiktok/start` with Bearer), then navigates to TikTok consent.
 */
export async function startTikTokOAuth(onWillRedirect?: () => void): Promise<void> {
  try {
    onWillRedirect?.()
    const authorizeUrl = await getOAuthTikTokAuthorizeUrl()
    requestAnimationFrame(() => {
      window.location.assign(authorizeUrl)
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not start TikTok OAuth.'
    toast.error(message)
    throw e
  }
}
