import { toast } from 'sonner'
import { getOAuthFacebookAuthorizeUrl } from '@/api/services/oauth'

/**
 * Starts creator Meta/Facebook OAuth (`GET /oauth/facebook/start` with Bearer).
 * Backend returns `{ authorizeUrl }` as JSON so the browser navigates directly to Meta
 * (never follows the OAuth redirect inside XHR, which would cause CORS errors).
 */
export async function startFacebookOAuth(onWillRedirect?: () => void): Promise<void> {
  try {
    onWillRedirect?.()
    const authorizeUrl = await getOAuthFacebookAuthorizeUrl()
    requestAnimationFrame(() => {
      window.location.assign(authorizeUrl)
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not start Facebook OAuth.'
    toast.error(message)
    throw e
  }
}
