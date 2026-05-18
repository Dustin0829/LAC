const PREFIX = '[VidU Auth]'

/** True when auth debug logs should print (dev, or `VITE_AUTH_DEBUG=true` in the build). */
export function isAuthDebugEnabled(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_AUTH_DEBUG === 'true'
}

/** Structured client-side auth logs — enable in prod with `VITE_AUTH_DEBUG=true`. */
export function authLog(event: string, data?: Record<string, unknown>): void {
  if (!isAuthDebugEnabled()) return
  if (data && Object.keys(data).length > 0) {
    console.info(PREFIX, event, data)
  } else {
    console.info(PREFIX, event)
  }
}
