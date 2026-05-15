import { useState } from 'react'
import { Loader2, LogOut, Save } from 'lucide-react'
import { toast } from 'sonner'
import { brandProfileSaveSchema } from '@/api/schema/brandProfile.schema'
import { useMeProfile, usePutMeBrandProfile } from '@/api/queries/use-me'
import { buildPutMeBrandProfileBody } from '@/lib/auth/mapMeProfile'
import {
  brandProfileFormKey,
  resolveBrandProfileInitial,
} from '@/lib/brandProfile/brandProfileForm'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import type { BrandProfile } from '@/lib/stores/brandProfileStore'
import { BrandSocialLinkFields } from '@/components/account/BrandSocialLinkFields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'

function BrandProfileFields({
  initial,
  saving,
  onSave,
}: {
  initial: BrandProfile
  saving: boolean
  onSave: (profile: BrandProfile) => Promise<void>
}) {
  const [profile, setProfile] = useState(initial)

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brand-name">Brand name</Label>
          <Input
            id="brand-name"
            value={profile.brandName}
            onChange={(e) => setProfile((p) => ({ ...p, brandName: e.target.value }))}
            placeholder="Your brand or company name"
            autoComplete="organization"
            disabled={saving}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Links</p>
          <BrandSocialLinkFields
            values={profile}
            onChange={(key, value) => setProfile((p) => ({ ...p, [key]: value }))}
            disabled={saving}
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="button"
          size="lg"
          className="w-full bg-phc-gradient font-semibold text-white hover:opacity-90 sm:w-auto min-w-36"
          onClick={() => void onSave(profile)}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>
    </>
  )
}

export default function BrandAccountPage() {
  const { user } = useAuth()
  const signOut = useSignOut()

  const { data: profileData, isSuccess: profileLoaded, isLoading: profileLoading } = useMeProfile()
  const putBrandProfile = usePutMeBrandProfile()

  const initialProfile = resolveBrandProfileInitial(
    profileData,
    profileLoaded,
    profileLoading,
    user?.name
  )

  async function onSave(profile: BrandProfile) {
    const parsed = brandProfileSaveSchema.safeParse(profile)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Brand name is required.')
      return
    }
    try {
      await putBrandProfile.mutateAsync({
        ...buildPutMeBrandProfileBody(parsed.data),
        brandName: parsed.data.brandName,
      })
      toast.success('Brand profile saved.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save brand profile.')
    }
  }

  const saving = putBrandProfile.isPending

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Brand <span className="text-phc-gradient">profile</span>
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
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          Sign out
        </Button>
      </section>
    </div>
  )
}
