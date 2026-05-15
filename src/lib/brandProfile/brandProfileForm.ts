import {
  brandProfileLinkKeys,
  emptyBrandProfileForm,
  type BrandProfileFormValues,
  type BrandProfileLinkKey,
} from '@/api/schema/brandProfile.schema'
import { brandProfileFromApi, isBrandMeProfile } from '@/lib/auth/mapMeProfile'
import type { BrandProfile } from '@/lib/stores/brandProfileStore'
import type { LucideIcon } from 'lucide-react'
import { Facebook, Globe, Instagram } from 'lucide-react'
export type BrandSocialLinkFieldConfig = {
  key: BrandProfileLinkKey
  label: string
  placeholder: string
  icon: LucideIcon | 'tiktok'
}

export const BRAND_SOCIAL_LINK_FIELDS: readonly BrandSocialLinkFieldConfig[] = [
  {
    key: 'website',
    label: 'Website',
    placeholder: 'https://yourbrand.com',
    icon: Globe,
  },
  {
    key: 'instagram',
    label: 'Instagram',
    placeholder: 'https://instagram.com/yourbrand',
    icon: Instagram,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    placeholder: 'https://facebook.com/yourbrand',
    icon: Facebook,
  },
  {
    key: 'tiktok',
    label: 'TikTok',
    placeholder: 'https://tiktok.com/@yourbrand',
    icon: 'tiktok',
  },
] as const

export function emptyBrandProfile(): BrandProfile {
  return emptyBrandProfileForm()
}

export function resolveBrandProfileInitial(
  profileData: unknown,
  profileLoaded: boolean,
  profileLoading: boolean,
  userName?: string | null
): BrandProfile | null {
  if (profileLoading) return null

  const accountName = userName?.trim() ?? ''

  if (profileLoaded && profileData && isBrandMeProfile(profileData)) {
    const fromApi = brandProfileFromApi(profileData)
    if (fromApi.brandName.trim()) return fromApi
    return accountName ? { ...fromApi, brandName: accountName } : fromApi
  }

  return accountName ? { ...emptyBrandProfile(), brandName: accountName } : emptyBrandProfile()
}

export function brandProfileFormKey(profile: BrandProfileFormValues): string {
  return brandProfileLinkKeys.map((key) => profile[key]).join('\0') + `\0${profile.brandName}`
}

export function brandLinkFieldId(key: BrandProfileLinkKey, prefix = 'link'): string {
  return `${prefix}-${key}`
}

export function isTiktokLinkIcon(icon: BrandSocialLinkFieldConfig['icon']): icon is 'tiktok' {
  return icon === 'tiktok'
}
