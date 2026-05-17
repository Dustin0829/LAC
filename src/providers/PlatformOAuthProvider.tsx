import { useEffect, useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { meQueryKeys } from '@/api/queries/use-me'
import { getMeProfile } from '@/api/services/me'
import { creatorLinksFromApi } from '@/lib/auth/mapMeProfile'
import { consumeCreatorPlatformOAuthSearchParams } from '@/lib/auth/oauthPlatformCallback'
import { PLATFORM_LABEL } from '@/lib/platforms/labels'
import { useAuthStore } from '@/lib/stores/authStore'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'

export function PlatformOAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const loading = useAuthStore((s) => s.loading)
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const handledRef = useRef(false)

  useEffect(() => {
    if (loading || !user || handledRef.current) return

    const result = consumeCreatorPlatformOAuthSearchParams()
    if (!result.handled) return

    handledRef.current = true

    if (result.status === 'error') {
      toast.error(result.reason ?? `Could not connect ${PLATFORM_LABEL[result.platform]}.`)
      return
    }

    if (role !== 'creator') {
      toast.success(`${PLATFORM_LABEL[result.platform]} connected.`)
      return
    }

    void (async () => {
      try {
        const profile = await getMeProfile()
        if ('platformLinks' in profile) {
          useCreatorProfileStore.getState().setPlatformLinks(creatorLinksFromApi(profile))
        }
        void queryClient.invalidateQueries({ queryKey: meQueryKeys.profile() })
        toast.success(`${PLATFORM_LABEL[result.platform]} connected.`)
      } catch {
        toast.error('TikTok connected, but profile could not be refreshed. Reload the page.')
      }
    })()
  }, [loading, user, role, queryClient])

  return <>{children}</>
}
