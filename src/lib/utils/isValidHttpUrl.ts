/** Each non-empty line must parse as `http:` or `https:` with a hostname. */
export function isValidHttpOrHttpsUrl(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  try {
    const u = new URL(v)
    return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname)
  } catch {
    return false
  }
}
