import { Loader2, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { brandProfileSaveSchema } from '@/api/schema/brands/profile.schema'
import { useMeProfile, usePutMeBrandProfile } from '@/api/queries/use-me'
import { buildPutMeBrandProfileBody } from '@/lib/auth/mapMeProfile'
import { BrandProfileFields } from '@/lib/brands/profile/BrandProfileFields'
import {
  brandProfileFormKey,
  resolveBrandProfileInitial,
} from '@/lib/brands/profile/brandProfileForm'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import type { BrandProfile } from '@/lib/stores/brandProfileStore'
import { Button } from '@/components/ui/button'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'

export default function BrandAccountPage() {
  const { user } = useAuth()
  const { signOut, isSigningOut } = useSignOut()

  const { data: profileData, isSuccess: profileLoaded, isLoading: profileLoading } = useMeProfile()
  const { mutate: putBrandProfile, isPending: saving } = usePutMeBrandProfile()

  const initialProfile = resolveBrandProfileInitial(
    profileData,
    profileLoaded,
    profileLoading,
    user?.name
  )

  function onSave(profile: BrandProfile) {
    const parsed = brandProfileSaveSchema.safeParse(profile)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Brand name is required.')
      return
    }
    putBrandProfile({
      ...buildPutMeBrandProfileBody(parsed.data),
      brandName: parsed.data.brandName,
    })
  }

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Brand <span className="text-phc-gradient">Profile</span>
        </h1>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-none">
        {initialProfile === null ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading profile…
          </div>
        ) : (
          <BrandProfileFields
            key={brandProfileFormKey(initialProfile)}
            initial={initialProfile}
            saving={saving}
            onSave={onSave}
          />
        )}
      </section>

      <section
        id="brand-refund-receiving"
        className="scroll-mt-24 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-none"
      >
        <PaymentMethodsSection mode="brand" useApi />
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:hidden">
        <h2 className="font-display text-lg font-bold">Session</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign out on this device.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
          loading={isSigningOut}
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </Button>
      </section>
    </div>
  )
}
