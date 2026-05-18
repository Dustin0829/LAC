import { toast } from 'sonner'
import { getOAuthFacebookPageAuthorizeUrl } from '@/api/services/oauth'

/**
 * Opens Meta Page-app OAuth only (`GET /oauth/facebook/page/start`).
 * Use when login is done but Pages still need to be granted/selected.
 */
export async function startFacebookPageOAuth(onWillRedirect?: () => void): Promise<void> {
  try {
    onWillRedirect?.()
    const authorizeUrl = await getOAuthFacebookPageAuthorizeUrl()
    requestAnimationFrame(() => {
      window.location.assign(authorizeUrl)
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not start Facebook Page OAuth.'
    toast.error(message)
    throw e
  }
}
