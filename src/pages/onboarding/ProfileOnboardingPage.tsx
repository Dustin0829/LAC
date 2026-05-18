import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCompleteMeOnboarding,
  useMeProfile,
  usePutMeBrandProfile,
  usePutMeCreatorProfile,
} from '@/api/queries/use-me'
import { OnboardingWizardShell } from '@/components/onboarding/OnboardingWizardShell'
import { ConnectedPlatformsSection } from '@/components/account/ConnectedPlatformsSection'
import { BrandOnboardingBasicsStep } from '@/components/onboarding/BrandOnboardingBasicsStep'
import { BrandOnboardingSocialStep } from '@/components/onboarding/BrandOnboardingSocialStep'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'
import { Button } from '@/components/ui/button'
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
  const { signOut, isSigningOut } = useSignOut()
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
        className={cn('h-11 gap-2 px-5', authFlowOutlineButtonClass)}
        onClick={() => void handleBack()}
        disabled={saving || isSigningOut}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {isSigningOut ? 'Signing out…' : 'Back'}
      </Button>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {step < total ? (
          <>
            <Button
              type="button"
              variant="ghost"
              className="text-sm font-medium text-slate-500 hover:text-slate-700"
              onClick={goToNextStep}
            >
              Skip for now
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              className={cn(
                'h-11 min-w-[7.5rem] gap-2 rounded-xl px-6',
                authFlowPrimaryButtonClass
              )}
              onClick={goToNextStep}
            >
              Next
              <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className={cn('h-11 min-w-[7.5rem] rounded-xl px-6', authFlowPrimaryButtonClass)}
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
      subtitle={
        step === 1
          ? 'Connect your platforms to start submitting content. This helps us deliver the right opportunities for you.'
          : 'Add how you want to get paid so we can send your earnings when campaigns pay out.'
      }
      footer={footer}
    >
      {step === 1 && (
        <ConnectedPlatformsSection embedded onboarding allowDisconnect={false} />
      )}

      {step === 2 && <PaymentMethodsSection mode="creator" suppressToasts />}
    </OnboardingWizardShell>
  )
}

function BrandProfileOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { signOut, isSigningOut } = useSignOut()
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
  const brandNameTrimmed = profile.brandName.trim()
  const canProceedFromBasics = brandNameTrimmed.length > 0

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
    if (step === 1) {
      if (!canProceedFromBasics) {
        toast.error('Brand name is required.')
        return
      }
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
        className={cn('h-11 gap-2 px-5', authFlowOutlineButtonClass)}
        onClick={() => void handleBack()}
        disabled={saving || isSigningOut}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {isSigningOut ? 'Signing out…' : 'Back'}
      </Button>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {step < total ? (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className={cn(
              'h-11 min-w-[7.5rem] gap-2 rounded-xl px-6',
              authFlowPrimaryButtonClass,
              !canProceedFromBasics && 'pointer-events-none opacity-45'
            )}
            onClick={() => void goToNextStep()}
            disabled={saving || !canProceedFromBasics}
          >
            Next
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className={cn('h-11 min-w-[7.5rem] rounded-xl px-6', authFlowPrimaryButtonClass)}
            onClick={() => void finish()}
            disabled={saving || !canProceedFromBasics}
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
      subtitle={
        step === 1
          ? 'Tell us about your brand so we can personalize your experience and opportunities.'
          : 'Add your social links so creators can find and tag your brand.'
      }
      footer={footer}
    >
      {step === 1 && (
        <BrandOnboardingBasicsStep
          brandName={profile.brandName}
          onBrandNameChange={(value) => setProfile({ brandName: value })}
        />
      )}

      {step === 2 && (
        <BrandOnboardingSocialStep
          values={profile}
          onChange={(key, value) => setProfile({ [key]: value })}
        />
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
