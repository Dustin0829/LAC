/**
 * TanStack Query hooks for `/me` (role, profile, onboarding).
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteMePlatform,
  getMeProfile,
  postMeOnboardingComplete,
  putMeBrandProfile,
  putMeCreatorProfile,
  putMeRole,
} from '@/api/services/me'
import type { PutMeBrandProfileBody, PutMeRoleBody } from '@/api/types/me.types'
import { creatorLinksFromApi } from '@/lib/auth/mapMeProfile'
import type { Platform } from '@/lib/mockData'
import { syncAuthMe, useAuthStore } from '@/lib/stores/authStore'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import { toast } from 'sonner'

export const meQueryKeys = {
  all: ['me'] as const,
  profile: () => [...meQueryKeys.all, 'profile'] as const,
}

/** Role selection (`PUT /me/role`) then refresh session (`GET /me`). */
export function usePutMeRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...meQueryKeys.all, 'role'] as const,
    mutationFn: async (body: PutMeRoleBody) => {
      const data = await putMeRole(body)
      await syncAuthMe()
      return data
    },
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: meQueryKeys.profile() })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not save your role.')
    },
  })
}

/** Brand/creator profile DTO for onboarding (`GET /me/profile`). */
export function useMeProfile() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  return useQuery({
    queryKey: [...meQueryKeys.profile(), role] as const,
    queryFn: () => getMeProfile(),
    enabled: Boolean(user && role),
  })
}

export function usePutMeBrandProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...meQueryKeys.all, 'profile', 'brand'] as const,
    mutationFn: (body: PutMeBrandProfileBody) => putMeBrandProfile(body),
    retry: false,
    onSuccess: () => {
      toast.success('Brand profile saved.')
      void qc.invalidateQueries({ queryKey: meQueryKeys.profile() })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not save brand profile.')
    },
  })
}

export function usePutMeCreatorProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...meQueryKeys.all, 'profile', 'creator'] as const,
    mutationFn: () => putMeCreatorProfile(),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: meQueryKeys.profile() })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not save your profile.')
    },
  })
}

/** Mark profile onboarding complete on the server, then refresh `GET /me`. */
/** Disconnect a creator platform (`DELETE /me/platforms/:platform`). */
export function useDeleteMePlatform() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...meQueryKeys.all, 'platforms', 'delete'] as const,
    mutationFn: (platform: Platform) => deleteMePlatform(platform),
    retry: false,
    onSuccess: async () => {
      const profile = await getMeProfile()
      if ('platformLinks' in profile) {
        useCreatorProfileStore.getState().setPlatformLinks(creatorLinksFromApi(profile))
      }
      void qc.invalidateQueries({ queryKey: meQueryKeys.profile() })
    },
  })
}

export function useCompleteMeOnboarding() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...meQueryKeys.all, 'onboarding-complete'] as const,
    mutationFn: async () => {
      const data = await postMeOnboardingComplete()
      await syncAuthMe()
      return data
    },
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: meQueryKeys.profile() })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not finish onboarding.')
    },
  })
}
