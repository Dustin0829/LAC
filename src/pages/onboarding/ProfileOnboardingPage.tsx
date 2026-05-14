import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, Facebook, Globe, Instagram } from 'lucide-react'
import { toast } from 'sonner'
import {
  OnboardingWizardShell,
} from '@/components/onboarding/OnboardingWizardShell'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'
import { PlatformIcon } from '@/components/PlatformIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/hooks/use-auth'
import { markProfileOnboardingComplete } from '@/lib/profileOnboarding'
import { useAuthStore } from '@/lib/stores/authStore'
import { useBrandProfileStore } from '@/lib/stores/brandProfileStore'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import type { Platform } from '@/lib/mockData'

const CREATOR_STEP_TOTAL = 3
const BRAND_STEP_TOTAL = 3

function OnboardingPageWatermark({ light, accent }: { light: string; accent: string }) {
  return (
    <p className="max-w-full select-none whitespace-nowrap text-left font-display text-[clamp(3rem,9.5vw+0.75rem,8rem)] font-extrabold leading-tight tracking-tight">
      <span className="text-foreground/9 dark:text-foreground/12">{light}</span>
      <span className="text-primary/18 dark:text-primary/28">{accent}</span>
    </p>
  )
}

function CreatorProfileOnboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const signOut = useAuthStore((s) => s.signOut)
  const userId = user?.id
  const platformLinks = useCreatorProfileStore((s) => s.platformLinks)
  const connectPlatform = useCreatorProfileStore((s) => s.connectPlatform)
  const [step, setStep] = useState(1)
  const total = CREATOR_STEP_TOTAL

  function finish() {
    if (!userId) {
      toast.error('Missing account id. Sign in again.')
      return
    }
    markProfileOnboardingComplete(userId, 'creator')
    toast.success('Welcome to VidU.')
    navigate('/creator/dashboard', { replace: true })
  }

  function handleBack() {
    if (step <= 1) {
      signOut()
      navigate('/auth', { replace: true })
      return
    }
    setStep((s) => Math.max(1, s - 1))
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button type="button" variant="outline" onClick={handleBack}>
        Back
      </Button>
      {step < total ? (
        <Button
          type="button"
          className="bg-phc-gradient text-white"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
        >
          Next
        </Button>
      ) : (
        <Button type="button" className="bg-phc-gradient text-white" onClick={finish}>
          Save
        </Button>
      )}
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
      pageWatermark={
        step === 1 ? (
          <OnboardingPageWatermark light="Your " accent="Account" />
        ) : step === 2 ? (
          <OnboardingPageWatermark light="Connected " accent="Platforms" />
        ) : (
          <OnboardingPageWatermark light="Payout " accent="Methods" />
        )
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">Your account</h2>
          <p className="text-sm text-muted-foreground">
            We use this identity across payouts and campaigns. Update details later in Account.
          </p>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="font-semibold">{user?.name ?? 'Your name'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white">
              <BadgeCheck className="h-3 w-3" /> Creator
            </p>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">Connected platforms</h2>
          <p className="text-sm text-muted-foreground">
            TikTok and Meta/Facebook are connected once and reused for future content submissions.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {platformLinks.map((link) => (
              <div key={link.platform} className="rounded-2xl border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <PlatformIcon platform={link.platform as Platform} className="h-8 w-8 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-semibold">{link.label}</p>
                    <p className="break-all text-xs text-muted-foreground">{link.handle}</p>
                    {link.status === 'connected' ? (
                      <span className="inline-flex rounded-full bg-success px-3 py-1 text-xs font-semibold text-black">
                        Connected
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-phc-gradient text-white"
                        onClick={() => connectPlatform(link.platform)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && <PaymentMethodsSection mode="creator" />}
    </OnboardingWizardShell>
  )
}

function BrandProfileOnboarding() {
  const navigate = useNavigate()
  const logoFileRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const signOut = useAuthStore((s) => s.signOut)
  const userId = user?.id
  const profile = useBrandProfileStore((s) => s.profile)
  const setProfile = useBrandProfileStore((s) => s.setProfile)
  const persistProfile = useBrandProfileStore((s) => s.persistProfile)
  const seedBrandNameIfEmpty = useBrandProfileStore((s) => s.seedBrandNameIfEmpty)
  const [step, setStep] = useState(1)
  const total = BRAND_STEP_TOTAL

  useEffect(() => {
    if (user?.name) seedBrandNameIfEmpty(user.name)
  }, [user?.name, seedBrandNameIfEmpty])

  function onLogoFile(files: FileList | null) {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      if (file) toast.error('Choose an image file for your logo.')
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

  function finish() {
    if (!userId) {
      toast.error('Missing account id. Sign in again.')
      return
    }
    persistProfile()
    markProfileOnboardingComplete(userId, 'brand')
    toast.success('Brand profile saved.')
    navigate('/brand/dashboard', { replace: true })
  }

  function handleBack() {
    if (step <= 1) {
      signOut()
      navigate('/auth', { replace: true })
      return
    }
    setStep((s) => Math.max(1, s - 1))
  }

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button type="button" variant="outline" onClick={handleBack}>
        Back
      </Button>
      {step < total ? (
        <Button
          type="button"
          className="bg-phc-gradient text-white"
          onClick={() => setStep((s) => Math.min(total, s + 1))}
        >
          Next
        </Button>
      ) : (
        <Button type="button" className="bg-phc-gradient text-white" onClick={finish}>
          Save
        </Button>
      )}
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
      pageWatermark={
        step === 1 ? (
          <OnboardingPageWatermark light="Brand " accent="Basics" />
        ) : step === 2 ? (
          <OnboardingPageWatermark light="Social " accent="Links" />
        ) : (
          <OnboardingPageWatermark light="Profile " accent="Review" />
        )
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">Brand basics</h2>
          <p className="text-sm text-muted-foreground">
            Optional — you can add or change this anytime in Account.
          </p>
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
            <p className="text-xs text-muted-foreground">PNG or JPG. Shown on your brand profile and in the app.</p>
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
          <p className="text-sm text-muted-foreground">Optional — add what creators and partners should know.</p>
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

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-extrabold">Review</h2>
          <p className="text-sm text-muted-foreground">
            Save stores this brand profile on your device for the MVP prototype.
          </p>
          <dl className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Logo</dt>
              <dd className="mt-1">
                {profile.logoDataUrl ? (
                  <img
                    src={profile.logoDataUrl}
                    alt=""
                    className="h-12 w-12 rounded-xl border border-border object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Brand</dt>
              <dd className="font-semibold">{profile.brandName.trim() || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Links</dt>
              <dd className="text-muted-foreground">
                {[profile.website, profile.instagram, profile.facebook, profile.tiktok].filter(Boolean).length}{' '}
                provided
              </dd>
            </div>
          </dl>
        </div>
      )}
    </OnboardingWizardShell>
  )
}

export default function ProfileOnboardingPage() {
  const role = useAuthStore((s) => s.role)
  if (role === 'creator') return <CreatorProfileOnboarding />
  if (role === 'brand') return <BrandProfileOnboarding />
  return null
}
