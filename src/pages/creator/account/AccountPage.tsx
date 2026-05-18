import { useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { useMePlatforms } from '@/api/queries/use-me'
import { CreatorDisplayNameSection } from '@/lib/creators/profile/CreatorDisplayNameSection'
import { Button } from '@/components/ui/button'
import { ConnectedPlatformsSection } from '@/components/account/ConnectedPlatformsSection'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'
import { creatorLinksFromPlatforms } from '@/lib/auth/mapMeProfile'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'

export default function CreatorAccountPage() {
  const { user } = useAuth()
  const { signOut, isSigningOut } = useSignOut()
  const setPlatformLinks = useCreatorProfileStore((s) => s.setPlatformLinks)
  const { data: platformsData, isLoading: platformsLoading, isError: platformsError } =
    useMePlatforms()

  useEffect(() => {
    if (!platformsData) return
    setPlatformLinks(creatorLinksFromPlatforms(platformsData))
  }, [platformsData, setPlatformLinks])

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Account <span className="text-phc-gradient">Profile</span>
        </h1>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <CreatorDisplayNameSection name={user?.name} email={user?.email} />
      </section>

      <ConnectedPlatformsSection loading={platformsLoading} loadError={platformsError} />

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <PaymentMethodsSection mode="creator" useApi />
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:hidden">
        <h2 className="font-display text-lg font-bold">Session</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign out on this device.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
          loading={isSigningOut}
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {isSigningOut ? 'Signing out…' : 'Sign Out'}
        </Button>
      </section>
    </div>
  )
}
