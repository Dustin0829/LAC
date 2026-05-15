/**
 * `/me` and related session profile payloads (inner `data`).
 */

export type MeUserDto = {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
}

export type MeResponseData = {
  user: MeUserDto
  roles: ('creator' | 'brand')[]
  primaryRole: 'creator' | 'brand' | null
  profileOnboardingComplete: Record<string, boolean>
  requiresRoleSelection: boolean
}

export type PutMeRoleBody = {
  role: 'creator' | 'brand'
}

export type PutMeRoleData = {
  role: 'creator' | 'brand'
}

export type PatchMeBody = {
  name?: string | null
  avatarUrl?: string | null
}

export type PostMeOnboardingCompleteData = {
  profileOnboardingComplete: boolean
  role: 'creator' | 'brand'
}

export type BrandMeProfileData = {
  brandName: string
  logoUrl: string | null
  website: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
}

export type PutMeBrandProfileBody = {
  brandName?: string
  website?: string | null
  instagram?: string | null
  facebook?: string | null
  tiktok?: string | null
  logoObjectKey?: string
}

export type CreatorPlatformLinkDto = {
  platform: string
  displayHandle: string
  linkStatus: string
  connectedAt: string | null
}

export type CreatorMeProfileData = {
  platformLinks: CreatorPlatformLinkDto[]
}

export type MeProfileData = BrandMeProfileData | CreatorMeProfileData
