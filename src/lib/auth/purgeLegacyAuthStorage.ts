/** Remove pre-cookie auth keys (JWT + cached user/role in local/session storage). */
export function purgeLegacyAuthStorage(): void {
  if (typeof window === 'undefined') return
  const keys = [
    'vidu.access_token',
    'vidu.refresh_token',
    'vidu.user',
    'vidu.role',
    'arpify.user',
    'arpify.role',
  ]
  for (const key of keys) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  }
}
