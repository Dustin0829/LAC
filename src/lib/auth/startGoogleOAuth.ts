import { toast } from 'sonner'
import { getApiBaseUrl } from '@/api/config'
import { authLog } from '@/lib/auth/authLog'
import { markPendingPostLoginSplash } from '@/lib/auth/postLoginSplash'

/**
 * Full-page redirect to backend `GET /auth/google/start`.
 * Call `onWillRedirect` synchronously after the API base URL is valid (e.g. set loading UI before navigation).
 */
export function startGoogleOAuth(onWillRedirect?: () => void): void {
  const base = getApiBaseUrl()
  if (!base) {
    authLog('google_oauth_start_failed', { reason: 'missing_api_base_url' })
    toast.error('An error occurred while starting Google OAuth.')
    return
  }
  const startUrl = `${base}/auth/google/start`
  authLog('google_oauth_start', {
    apiBase: base,
    startUrl,
    pageOrigin: window.location.origin,
    pagePath: window.location.pathname,
  })
  markPendingPostLoginSplash()
  onWillRedirect?.()
  requestAnimationFrame(() => {
    window.location.assign(startUrl)
  })
}
