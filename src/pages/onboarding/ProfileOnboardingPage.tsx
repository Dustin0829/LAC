import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Facebook, Globe, Instagram, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCompleteMeOnboarding,
  useMeProfile,
  usePutMeBrandProfile,
  usePutMeCreatorProfile,
} from '@/api/queries/use-me'
import type { BrandMeProfileData } from '@/api/types/me.types'
import { OnboardingWizardShell } from '@/components/onboarding/OnboardingWizardShell'
import { ConnectedPlatformsSection } from '@/components/account/ConnectedPlatformsSection'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'
import { PlatformIcon } from '@/components/PlatformIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  brandProfileFromApi,
  buildPutMeBrandProfileBody,
  creatorLinksFromApi,
} from '@/lib/auth/mapMeProfile'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import { markProfileOnboardingComplete } from '@/lib/profileOnboarding'
import { useAuthStore } from '@/lib/stores/authStore'
import { useBrandProfileStore } from '@/lib/stores/brandProfileStore'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import { authFlowOutlineButtonClass, authFlowPrimaryButtonClass } from '@/lib/authFlowButtonClasses'
import { cn } from '@/lib/utils'

function isBrandMeProfile(data: unknown): data is BrandMeProfileData {
  return typeof data === 'object' && data !== null && 'brandName' in data
}

const CREATOR_STEP_TOTAL = 2
const BRAND_STEP_TOTAL = 2

function CreatorProfileOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const signOut = useSignOut()
  const userId = user?.id
  const setPlatformLinks = useCreatorProfileStore((s) => s.setPlatformLinks)
  const { data: profileData, isSuccess: profileLoaded } = useMeProfile()
  const putCreatorProfile = usePutMeCreatorProfile()
  const completeOnboarding = useCompleteMeOnboarding()
  const profileHydrated = useRef(false)
  const [step, setStep] = useState(1)
  const total = CREATOR_STEP_TOTAL
  const saving = putCreatorProfile.isPending || completeOnboarding.isPending

  useEffect(() => {
    if (!profileLoaded || !profileData || profileHydrated.current) return
    if ('platformLinks' in profileData) {
      setPlatformLinks(creatorLinksFromApi(profileData))
      profileHydrated.current = true
    }
  }, [profileLoaded, profileData, setPlatformLinks])

  async function finish() {
    if (!userId) return
    try {
      await putCreatorProfile.mutateAsync()
      await completeOnboarding.mutateAsync()
      markProfileOnboardingComplete(userId, 'creator')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your profile.')
    }
  }

  async function handleBack() {
    if (step <= 1) {
      await signOut()
      return
    }
    setStep((s) => Math.max(1, s - 1))
  }

  function goToNextStep() {
    setStep((s) => Math.min(total, s + 1))
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className={cn('h-[46px] gap-2 px-5', authFlowOutlineButtonClass)}
        onClick={() => void handleBack()}
        disabled={saving}
      >
        Back
      </Button>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {step < total ? (
          <>
            <Button type="button" variant="ghost" className="text-muted-foreground" onClick={goToNextStep}>
              Skip
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className={cn('h-[46px] min-w-[7.5rem] justify-between gap-2 px-5', authFlowPrimaryButtonClass)}
              onClick={goToNextStep}
            >
              <span />
              Next
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className={cn('h-[46px] min-w-[7.5rem] px-6', authFlowPrimaryButtonClass)}
            onClick={() => void finish()}
            disabled={saving}
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </span>
            ) : (
              'Save'
            )}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <OnboardingWizardShell
      eyebrow="Creator setup"
      headline={
        <>
          Finish your <span className="text-phc-gradient">profile</span>
        </>
      }
      footer={footer}
    >
      {step === 1 && <ConnectedPlatformsSection embedded allowDisconnect={false} />}

      {step === 2 && <PaymentMethodsSection mode="creator" suppressToasts />}
    </OnboardingWizardShell>
  )
}

function BrandProfileOnboarding() {
  const navigate = useNavigate()
  const logoFileRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const signOut = useSignOut()
  const userId = user?.id
  const profile = useBrandProfileStore((s) => s.profile)
  const setProfile = useBrandProfileStore((s) => s.setProfile)
  const seedBrandNameIfEmpty = useBrandProfileStore((s) => s.seedBrandNameIfEmpty)
  const { data: profileData, isSuccess: profileLoaded } = useMeProfile()
  const putBrandProfile = usePutMeBrandProfile()
  const completeOnboarding = useCompleteMeOnboarding()
  const profileHydrated = useRef(false)
  const [step, setStep] = useState(1)
  const total = BRAND_STEP_TOTAL
  const saving = putBrandProfile.isPending || completeOnboarding.isPending

  useEffect(() => {
    if (user?.name) seedBrandNameIfEmpty(user.name)
  }, [user?.name, seedBrandNameIfEmpty])

  useEffect(() => {
    if (!profileLoaded || !profileData || profileHydrated.current) return
    if (isBrandMeProfile(profileData)) {
      setProfile(brandProfileFromApi(profileData))
      profileHydrated.current = true
    }
  }, [profileLoaded, profileData, setProfile])

  function onLogoFile(files: FileList | null) {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      setProfile({ logoDataUrl: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  const logoFallbackLetter =
    profile.brandName.trim().charAt(0)?.toUpperCase() ??
    user?.name?.charAt(0)?.toUpperCase() ??
    user?.email?.charAt(0)?.toUpperCase() ??
    'B'

  async function saveBrandProfilePartial() {
    const body = buildPutMeBrandProfileBody(profile)
    if (!body.brandName && Object.keys(body).length === 0) return
    await putBrandProfile.mutateAsync(body)
  }

  async function finish() {
    if (!userId) return
    const body = buildPutMeBrandProfileBody(profile)
    if (!body.brandName) {
      toast.error('Brand name is required.')
      return
    }
    try {
      await putBrandProfile.mutateAsync(body)
      await completeOnboarding.mutateAsync()
      markProfileOnboardingComplete(userId, 'brand')
      navigate('/brand/dashboard', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your profile.')
    }
  }

  async function handleBack() {
    if (step <= 1) {
      await signOut()
      return
    }
    setStep((s) => Math.max(1, s - 1))
  }

  async function goToNextStep() {
    if (step === 1 && profile.brandName.trim()) {
      try {
        await saveBrandProfilePartial()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not save brand name.')
        return
      }
    }
    setStep((s) => Math.min(total, s + 1))
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        type="button"
        variant="ghost"
        size="lg"
        className={cn('h-[46px] gap-2 px-5', authFlowOutlineButtonClass)}
        onClick={() => void handleBack()}
        disabled={saving}
      >
        Back
      </Button>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {step < total ? (
          <>
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => void goToNextStep()}
              disabled={saving}
            >
              Skip
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className={cn('h-[46px] min-w-[7.5rem] justify-between gap-2 px-5', authFlowPrimaryButtonClass)}
              onClick={() => void goToNextStep()}
              disabled={saving}
            >
              <span />
              Next
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className={cn('h-[46px] min-w-[7.5rem] px-6', authFlowPrimaryButtonClass)}
            onClick={() => void finish()}
            disabled={saving}
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </span>
            ) : (
              'Save'
            )}
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <OnboardingWizardShell
      eyebrow="Brand setup"
      headline={
        <>
          Finish your <span className="text-phc-gradient">brand profile</span>
        </>
      }
      footer={footer}
    >
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">Brand basics</h2>
          <div className="space-y-2">
            <Label>Brand logo</Label>
            <div className="flex flex-wrap items-center gap-3">
              <Avatar className="h-20 w-20 shrink-0 rounded-2xl border border-border">
                <AvatarImage src={profile.logoDataUrl ?? undefined} className="rounded-2xl object-cover" />
                <AvatarFallback className="rounded-2xl bg-muted font-display text-xl font-bold text-muted-foreground">
                  {logoFallbackLetter}
                </AvatarFallback>
              </Avatar>
              <input
                ref={logoFileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  onLogoFile(e.target.files)
                  e.target.value = ''
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => logoFileRef.current?.click()}>
                  Upload logo
                </Button>
                {profile.logoDataUrl ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setProfile({ logoDataUrl: null })}>
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="onb-brand-name">Brand name</Label>
            <Input
              id="onb-brand-name"
              value={profile.brandName}
              onChange={(e) => setProfile({ brandName: e.target.value })}
              placeholder="Your brand or company name"
              autoComplete="organization"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">Social links</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="onb-web" className="inline-flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
                Website
              </Label>
              <Input
                id="onb-web"
                type="url"
                inputMode="url"
                value={profile.website}
                onChange={(e) => setProfile({ website: e.target.value })}
                placeholder="https://yourbrand.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onb-ig" className="inline-flex items-center gap-2">
                <Instagram className="h-4 w-4 text-muted-foreground" aria-hidden />
                Instagram
              </Label>
              <Input
                id="onb-ig"
                type="url"
                inputMode="url"
                value={profile.instagram}
                onChange={(e) => setProfile({ instagram: e.target.value })}
                placeholder="https://instagram.com/yourbrand"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onb-fb" className="inline-flex items-center gap-2">
                <Facebook className="h-4 w-4 text-muted-foreground" aria-hidden />
                Facebook
              </Label>
              <Input
                id="onb-fb"
                type="url"
                inputMode="url"
                value={profile.facebook}
                onChange={(e) => setProfile({ facebook: e.target.value })}
                placeholder="https://facebook.com/yourbrand"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onb-tt" className="inline-flex items-center gap-2">
                <PlatformIcon platform="tiktok" className="h-3 w-3 opacity-70" />
                TikTok
              </Label>
              <Input
                id="onb-tt"
                type="url"
                inputMode="url"
                value={profile.tiktok}
                onChange={(e) => setProfile({ tiktok: e.target.value })}
                placeholder="https://tiktok.com/@yourbrand"
              />
            </div>
          </div>
        </div>
      )}
    </OnboardingWizardShell>
  )
}

export default function ProfileOnboardingPage() {
  const role = useAuthStore((s) => s.role)
  if (role === 'creator') return <CreatorProfileOnboarding />
  if (role === 'brand') return <BrandProfileOnboarding />
  return <Navigate to="/onboarding/role" replace />
}
