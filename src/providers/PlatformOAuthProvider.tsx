import { useEffect, useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { meQueryKeys } from '@/api/queries/use-me'
import { getMePlatforms } from '@/api/services/me'
import { creatorLinksFromPlatforms } from '@/lib/auth/mapMeProfile'
import { consumeCreatorPlatformOAuthSearchParams } from '@/lib/auth/oauthPlatformCallback'
import { startFacebookPageOAuth } from '@/lib/auth/startFacebookPageOAuth'
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

    if (
      (result.status === 'pending_page' || result.status === 'resume_page') &&
      result.platform === 'facebook'
    ) {
      toast.message('Select your Facebook Page', {
        description: 'Choose the Page where you publish Reels, then tap Continue.',
      })
      void startFacebookPageOAuth()
      return
    }

    if (role !== 'creator') {
      toast.success(`${PLATFORM_LABEL[result.platform]} connected.`)
      return
    }

    void (async () => {
      try {
        const platforms = await getMePlatforms()
        useCreatorProfileStore.getState().setPlatformLinks(creatorLinksFromPlatforms(platforms))
        void queryClient.invalidateQueries({ queryKey: meQueryKeys.platforms() })
        void queryClient.invalidateQueries({ queryKey: meQueryKeys.profile() })
        toast.success(`${PLATFORM_LABEL[result.platform]} connected.`)
      } catch {
        toast.error(
          `${PLATFORM_LABEL[result.platform]} connected, but platforms could not be refreshed. Reload the page.`,
        )
      }
    })()
  }, [loading, user, role, queryClient])

  return <>{children}</>
}
