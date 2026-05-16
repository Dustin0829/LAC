import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { usePutMeRole } from '@/api/queries/use-me'
import { AuthPageLayout } from '@/components/layout/AuthPageLayout'
import { PROFILE_ONBOARDING_ENABLED } from '@/lib/constants'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import type { UserRole } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const ROLES: {
  role: UserRole
  title: string
  description: string
  Icon: typeof Sparkles
}[] = [
  {
    role: 'creator',
    title: 'Creator',
    description: 'Join brand campaigns and get paid for your posts.',
    Icon: Sparkles,
  },
  {
    role: 'brand',
    title: 'Brand',
    description: 'Run campaigns and pay creators for verified views.',
    Icon: Building2,
  },
]

export default function RoleSelectionPage() {
  const navigate = useNavigate()
  const { mutate: putMeRole, isPending: submitting } = usePutMeRole()
  const signOut = useSignOut()
  const [choice, setChoice] = useState<UserRole | null>(null)
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
    <AuthPageLayout>
      <div className="flex min-h-screen flex-col justify-center text-center px-6 py-6">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            How will you use Vid<span className="text-phc-gradient">U</span>?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Choose your role.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {ROLES.map(({ role, title, description, Icon }) => (
              <button
                key={role}
                type="button"
                onClick={() => setChoice(role)}
                className={cn(
                  'cursor-pointer rounded-2xl border p-6 text-left transition-colors',
                  choice === role
                    ? 'border-sky-500 bg-sky-50/50'
                    : 'border-border bg-white/78 hover:border-muted-foreground/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-8 w-8 text-slate-950" />
                  <p className="text-lg font-semibold text-foreground">{title}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <Button
              type="button"
              size="lg"
              className="h-[46px] w-full"
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
            <span
              role="button"
              tabIndex={0}
              onClick={() => void onBackToLogin()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  void onBackToLogin()
                }
              }}
              className={cn(
                'cursor-pointer text-center text-sm text-muted-foreground underline',
                backPending && 'pointer-events-none opacity-50'
              )}
            >
              Back to login
            </span>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  )
}
