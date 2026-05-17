import { type ReactNode, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { usePutMeRole } from '@/api/queries/use-me'
import { OnboardingDotGrid } from '@/components/onboarding/OnboardingDotGrid'
import { RoleSelectionCard } from '@/components/onboarding/RoleSelectionCard'
import {
  BrandRoleIllustration,
  CreatorRoleIllustration,
} from '@/components/onboarding/RoleSelectionIllustrations'
import { AuthPageLayout } from '@/components/layout/AuthPageLayout'
import { Button } from '@/components/ui/button'
import { PROFILE_ONBOARDING_ENABLED } from '@/lib/constants'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import type { UserRole } from '@/lib/stores/authStore'
import { cn } from '@/lib/utils'

const ROLES: {
  role: UserRole
  title: string
  description: string
  bullets: readonly string[]
  illustration: ReactNode
}[] = [
  {
    role: 'creator',
    title: 'Creator',
    description: 'Join brand campaigns, create content, and earn from your performance.',
    bullets: ['Get paid for your content', 'Work with top brands', 'Flexible & easy to join'],
    illustration: <CreatorRoleIllustration />,
  },
  {
    role: 'brand',
    title: 'Brand',
    description: 'Launch campaigns and pay creators for real results.',
    bullets: ['Reach new audiences', 'Pay for performance', 'Track campaign results'],
    illustration: <BrandRoleIllustration />,
  },
]

export default function RoleSelectionPage() {
  const navigate = useNavigate()
  const { mutate: putMeRole, isPending: submitting } = usePutMeRole()
  const signOut = useSignOut()
  const [choice, setChoice] = useState<UserRole | null>('creator')
  const [backPending, setBackPending] = useState(false)

  function onContinue() {
    if (!choice) {
      toast.error('Choose Creator or Brand to continue.')
      return
    }
    putMeRole(
      { role: choice },
      {
        onSuccess: () => {
          navigate(
            PROFILE_ONBOARDING_ENABLED
              ? '/onboarding/profile'
              : choice === 'brand'
                ? '/brand/dashboard'
                : '/dashboard',
            { replace: true }
          )
        },
      }
    )
  }

  async function onBackToLogin() {
    setBackPending(true)
    try {
      await signOut()
    } finally {
      setBackPending(false)
    }
  }

  return (
    <AuthPageLayout className="md:h-dvh md:max-h-dvh md:overflow-y-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_100%_0%,rgba(221,214,254,0.45),transparent_58%)]"
      />
      <OnboardingDotGrid />

      <div className="relative z-10 flex w-full flex-1 flex-col max-md:min-h-0 md:min-h-dvh md:justify-center">
        <main className="mx-auto w-full max-w-7xl px-5 py-8 pb-20 sm:px-8 sm:pb-24 md:overflow-hidden md:py-0 md:pb-0">
          <div className="text-center">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl lg:text-[2.5rem]">
              How will you use Vid<span className="text-phc-gradient">U</span>?
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-base text-slate-500">
              Choose the option that fits you best.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:mt-10 md:grid-cols-2 md:gap-6 lg:gap-8">
            {ROLES.map((config) => (
              <RoleSelectionCard
                key={config.role}
                {...config}
                selected={choice === config.role}
                onSelect={() => setChoice(config.role)}
              />
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center pb-6 md:mt-5 md:pb-10">
            <Button
              type="button"
              size="lg"
              className="h-12 min-w-[220px] rounded-full bg-phc-gradient px-16 text-base font-semibold text-white hover:opacity-90 sm:min-w-[260px]"
              disabled={!choice || submitting || backPending}
              onClick={() => void onContinue()}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Continue'
              )}
            </Button>
            <button
              type="button"
              onClick={() => void onBackToLogin()}
              disabled={backPending || submitting}
              className={cn(
                'mt-2 cursor-pointer text-center text-sm text-slate-500 underline underline-offset-2',
                'hover:text-slate-700 disabled:pointer-events-none disabled:opacity-50'
              )}
            >
              Back to login
            </button>
          </div>
        </main>
      </div>
    </AuthPageLayout>
  )
}
