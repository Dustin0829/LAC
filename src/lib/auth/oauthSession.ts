/** Read Google OAuth redirect query params (backend sets these on `/`). Returns true when a token was applied. */
export function consumeOAuthSessionSearchParams(actions: {
  setAccessToken: (token: string) => void
  resetUserAndRole: () => void
}): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const params = new URLSearchParams(window.location.search)
  const token = params.get('session_token')
  if (!token) {
    return false
  }

  params.delete('session_token')
  params.delete('requires_role')
  const search = params.toString()
  const path = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', path)

  actions.resetUserAndRole()
  actions.setAccessToken(token)
  return true
}
