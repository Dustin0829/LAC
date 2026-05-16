import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCompleteMeOnboarding,
  useMeProfile,
  usePutMeBrandProfile,
  usePutMeCreatorProfile,
} from '@/api/queries/use-me'
import { OnboardingWizardShell } from '@/components/onboarding/OnboardingWizardShell'
import { ConnectedPlatformsSection } from '@/components/account/ConnectedPlatformsSection'
import { BrandSocialLinkFields } from '@/components/account/BrandSocialLinkFields'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  brandProfileFromApi,
  buildPutMeBrandProfileBody,
  creatorLinksFromApi,
  isBrandMeProfile,
} from '@/lib/auth/mapMeProfile'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import { markProfileOnboardingComplete } from '@/lib/profileOnboarding'
import { useAuthStore } from '@/lib/stores/authStore'
import { useBrandProfileStore } from '@/lib/stores/brandProfileStore'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import { authFlowOutlineButtonClass, authFlowPrimaryButtonClass } from '@/lib/authFlowButtonClasses'
import { cn } from '@/lib/utils'

const CREATOR_STEP_TOTAL = 2
const BRAND_STEP_TOTAL = 2

function CreatorProfileOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const signOut = useSignOut()
  const userId = user?.id
  const setPlatformLinks = useCreatorProfileStore((s) => s.setPlatformLinks)
  const { data: profileData, isSuccess: profileLoaded } = useMeProfile()
  const { mutate: putCreatorProfile, isPending: putCreatorPending } = usePutMeCreatorProfile()
  const { mutate: completeOnboarding, isPending: completePending } = useCompleteMeOnboarding()
  const profileHydrated = useRef(false)
  const [step, setStep] = useState(1)
  const total = CREATOR_STEP_TOTAL
  const saving = putCreatorPending || completePending

  useEffect(() => {
    if (!profileLoaded || !profileData || profileHydrated.current) return
    if ('platformLinks' in profileData) {
      setPlatformLinks(creatorLinksFromApi(profileData))
      profileHydrated.current = true
    }
  }, [profileLoaded, profileData, setPlatformLinks])

  function finish() {
    if (!userId) return
    putCreatorProfile(undefined, {
      onSuccess: () => {
        completeOnboarding(undefined, {
          onSuccess: () => {
            markProfileOnboardingComplete(userId, 'creator')
            navigate('/dashboard', { replace: true })
          },
        })
      },
    })
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
  const { user } = useAuth()
  const signOut = useSignOut()
  const userId = user?.id
  const profile = useBrandProfileStore((s) => s.profile)
  const setProfile = useBrandProfileStore((s) => s.setProfile)
  const seedBrandNameIfEmpty = useBrandProfileStore((s) => s.seedBrandNameIfEmpty)
  const { data: profileData, isSuccess: profileLoaded } = useMeProfile()
  const { mutate: putBrandProfile, isPending: putBrandPending } = usePutMeBrandProfile()
  const { mutate: completeOnboarding, isPending: completePending } = useCompleteMeOnboarding()
  const profileHydrated = useRef(false)
  const [step, setStep] = useState(1)
  const total = BRAND_STEP_TOTAL
  const saving = putBrandPending || completePending

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

  function saveBrandProfilePartial() {
    const body = buildPutMeBrandProfileBody(profile)
    if (!body.brandName && Object.keys(body).length === 0) return
    putBrandProfile(body)
  }

  function finish() {
    if (!userId) return
    const body = buildPutMeBrandProfileBody(profile)
    if (!body.brandName) {
      toast.error('Brand name is required.')
      return
    }
    putBrandProfile(body, {
      onSuccess: () => {
        completeOnboarding(undefined, {
          onSuccess: () => {
            markProfileOnboardingComplete(userId, 'brand')
            navigate('/brand/dashboard', { replace: true })
          },
        })
      },
    })
  }

  async function handleBack() {
    if (step <= 1) {
      await signOut()
      return
    }
    setStep((s) => Math.max(1, s - 1))
  }

  function goToNextStep() {
    if (step === 1 && profile.brandName.trim()) {
      saveBrandProfilePartial()
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
          <BrandSocialLinkFields
            values={profile}
            onChange={(key, value) => setProfile({ [key]: value })}
            idPrefix="onb"
          />
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
