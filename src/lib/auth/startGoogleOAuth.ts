import { toast } from 'sonner'
import { getApiBaseUrl } from '@/api/config'

/**
 * Full-page redirect to backend `GET /auth/google/start`.
 * Call `onWillRedirect` synchronously after the API base URL is valid (e.g. set loading UI before navigation).
 */
export function startGoogleOAuth(onWillRedirect?: () => void): void {
  const base = getApiBaseUrl()
  if (!base) {
    toast.error('An error occurred while starting Google OAuth.')
    return
  }
  onWillRedirect?.()
  requestAnimationFrame(() => {
    window.location.assign(`${base}/auth/google/start`)
  })
}
