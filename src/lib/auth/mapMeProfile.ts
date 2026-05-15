import type { BrandMeProfileData, CreatorMeProfileData, PutMeBrandProfileBody } from '@/api/types/me.types'
import type { BrandProfile } from '@/lib/stores/brandProfileStore'
import { mockCreatorPlatformLinks, type CreatorPlatformLink, type Platform } from '@/lib/mockData'

export function isBrandMeProfile(data: unknown): data is BrandMeProfileData {
  return typeof data === 'object' && data !== null && 'brandName' in data
}

const PLATFORM_LABELS: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
}

export function brandProfileFromApi(data: BrandMeProfileData): BrandProfile {
  return {
    brandName: data.brandName ?? '',
    logoDataUrl: data.logoUrl,
    website: data.website ?? '',
    instagram: data.instagram ?? '',
    facebook: data.facebook ?? '',
    tiktok: data.tiktok ?? '',
  }
}

export function creatorLinksFromApi(data: CreatorMeProfileData): CreatorPlatformLink[] {
  const byPlatform = new Map(
    data.platformLinks.map((link) => [link.platform as Platform, link])
  )
  return mockCreatorPlatformLinks.map((defaults) => {
    const api = byPlatform.get(defaults.platform)
    if (!api) return defaults
    const connected = api.linkStatus === 'connected'
    return {
      platform: defaults.platform,
      label: PLATFORM_LABELS[defaults.platform] ?? defaults.platform,
      handle: api.displayHandle || 'Not connected',
      status: connected ? 'connected' : 'reconnect',
      connectedAt: api.connectedAt ?? undefined,
    }
  })
}

export function buildPutMeBrandProfileBody(profile: BrandProfile): PutMeBrandProfileBody {
  const body: PutMeBrandProfileBody = {}
  const name = profile.brandName.trim()
  if (name) body.brandName = name
  const website = profile.website.trim()
  if (website) body.website = website
  const instagram = profile.instagram.trim()
  if (instagram) body.instagram = instagram
  const facebook = profile.facebook.trim()
  if (facebook) body.facebook = facebook
  const tiktok = profile.tiktok.trim()
  if (tiktok) body.tiktok = tiktok
  return body
}
