export type DocumentMeta = {
  title: string
  description: string
  /** Path only, e.g. `/auth` — combined with `window.location.origin` for canonical and Open Graph URL. */
  path?: string
  /** Relative (from site root) or absolute image URL for social previews. */
  ogImage?: string
  robots?: string
}

export const DEFAULT_DOCUMENT_META: DocumentMeta = {
  title: 'VidU | Earn from your content',
  description:
    'VidU is a content marketplace where brands launch campaigns and creators earn per 1,000 views.',
  path: '/',
  ogImage: '/vidu-logo/lockup.png',
}

export const AUTH_DOCUMENT_META: DocumentMeta = {
  title: 'Sign in | VidU',
  description:
    'Sign in to VidU with Google. The content marketplace where brands run campaigns and creators earn per 1,000 views.',
  path: '/auth',
  ogImage: '/vidu-logo/lockup.png',
}

function siteOrigin(): string {
  if (typeof window === 'undefined') return ''
  return window.location.origin.replace(/\/$/, '')
}

function resolveUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const origin = siteOrigin()
  return `${origin}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`
}

function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function setLinkRel(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

/** Apply title, description, canonical, Open Graph, and Twitter tags. */
export function applyDocumentMeta(meta: DocumentMeta): void {
  const pageUrl = resolveUrl(meta.path ?? window.location.pathname)
  const imageUrl = resolveUrl(meta.ogImage ?? DEFAULT_DOCUMENT_META.ogImage!)

  document.title = meta.title

  setMeta('name', 'title', meta.title)
  setMeta('name', 'description', meta.description)
  if (meta.robots) setMeta('name', 'robots', meta.robots)

  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:url', pageUrl)
  setMeta('property', 'og:title', meta.title)
  setMeta('property', 'og:description', meta.description)
  setMeta('property', 'og:image', imageUrl)

  setMeta('property', 'twitter:card', 'summary_large_image')
  setMeta('property', 'twitter:url', pageUrl)
  setMeta('property', 'twitter:title', meta.title)
  setMeta('property', 'twitter:description', meta.description)
  setMeta('property', 'twitter:image', imageUrl)

  setLinkRel('canonical', pageUrl)
}
