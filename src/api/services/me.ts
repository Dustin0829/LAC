import api from '@/api/client'
import type {
  BrandMeProfileData,
  CreatorMeProfileData,
  MePlatformsData,
  MeResponseData,
  PatchMeBody,
  PostMeOnboardingCompleteData,
  PutMeBrandProfileBody,
  PutMeRoleBody,
  PutMeRoleData,
} from '@/api/types/me.types'

export async function getMe(): Promise<MeResponseData> {
  const res = await api.get<MeResponseData>('/me')
  return res.data
}

export async function patchMe(body: PatchMeBody): Promise<MeResponseData> {
  const res = await api.patch<MeResponseData>('/me', body)
  return res.data
}

export async function putMeRole(body: PutMeRoleBody): Promise<PutMeRoleData> {
  const res = await api.put<PutMeRoleData>('/me/role', body)
  return res.data
}

export async function postMeOnboardingComplete(): Promise<PostMeOnboardingCompleteData> {
  const res = await api.post<PostMeOnboardingCompleteData>('/me/onboarding/complete')
  return res.data
}

export async function getMeProfile(): Promise<BrandMeProfileData | CreatorMeProfileData> {
  const res = await api.get<BrandMeProfileData | CreatorMeProfileData>('/me/profile')
  return res.data
}

export async function getMePlatforms(): Promise<MePlatformsData> {
  const res = await api.get<MePlatformsData>('/me/platforms')
  return res.data
}

export async function putMeBrandProfile(body: PutMeBrandProfileBody): Promise<BrandMeProfileData> {
  const res = await api.put<BrandMeProfileData>('/me/profile', body)
  return res.data
}

export async function putMeCreatorProfile(): Promise<CreatorMeProfileData> {
  const res = await api.put<CreatorMeProfileData>('/me/profile', {})
  return res.data
}

export async function deleteMePlatform(platform: 'tiktok' | 'facebook'): Promise<{ ok: true }> {
  const res = await api.delete<{ ok: true }>(`/me/platforms/${platform}`)
  return res.data
}
