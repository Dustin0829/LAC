import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Building2,
  Check,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { MarketingAuthShell } from '@/components/layout/MarketingAuthShell'
import { authFlowOutlineButtonClass, authFlowPrimaryButtonClass } from '@/lib/authFlowButtonClasses'
import { useAuthStore, type UserRole } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RoleOption {
  role: UserRole
  title: string
  subtitle: string
  description: string
  bullets: string[]
  Icon: LucideIcon
  tone: string
}

const ROLES: RoleOption[] = [
  {
    role: 'creator',
    title: 'Creator',
    subtitle: 'I join brand campaigns and get paid for my posts.',
    description:
      'Find campaigns, hook up TikTok or Facebook once, add your posts, and watch your earnings add up.',
    bullets: [
      'Sign in with email or Google, then a quick profile',
      'Browse campaigns and submit your own videos',
      'Get paid when the brand sends your payout',
    ],
    Icon: Sparkles,
    tone: 'bg-primary text-white',
  },
  {
    role: 'brand',
    title: 'Brand',
    subtitle: 'I run campaigns and pay creators for real views.',
    description:
      'Set up campaigns, add money, see who posted, and send payouts when the numbers look good—all from one place.',
    bullets: [
      'Sign in with email or Google, then a quick profile',
      'Create campaigns and set your budget',
      'Review posts and send payouts when you are ready',
    ],
    Icon: Building2,
    tone: 'bg-zinc-100 text-zinc-950',
  },
]

export default function RoleSelectionPage() {
  const navigate = useNavigate()
  const setRole = useAuthStore((s) => s.setRole)
  const signOut = useAuthStore((s) => s.signOut)
  const user = useAuthStore((s) => s.user)
  const [selected, setSelected] = useState<UserRole | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleContinue() {
    if (!selected) {
      return
    }
    setSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 400))
      setRole(selected)
      navigate(selected === 'brand' ? '/brand/dashboard' : '/dashboard', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MarketingAuthShell>
      <div className="flex w-full flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-12 pt-10 md:px-8 md:pt-12">
          <div className="flex w-full max-w-5xl flex-col items-center gap-8 md:gap-10">
            <div className="w-full max-w-2xl px-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-phc-gradient" />
                Hi {user?.name || user?.email?.split('@')[0]}
              </p>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
                How will you use <span className="text-phc-gradient">VidU</span>?
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                Pick how you&apos;ll use VidU. Next you&apos;ll fill out a short profile. Support can
                change your role later if you need it.
              </p>
            </div>

            <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              {ROLES.map(({ role, title, subtitle, description, bullets, Icon, tone }) => {
                const isSelected = selected === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelected(role)}
                    className={`group cursor-pointer rounded-3xl border bg-card p-6 text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/20 ring-offset-2 ring-offset-[#f4f8fd]'
                        : 'border-border hover:border-foreground/20'
                    }`}
                    style={
                      isSelected
                        ? { boxShadow: '0 25px 50px -12px rgba(9, 9, 11, 0.16)' }
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${tone} shadow-lg shadow-zinc-950/10`}
                      >
                        <Icon className="h-7 w-7" />
                      </div>
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                          isSelected ? 'border-transparent bg-phc-gradient' : 'border-border'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </div>

                    <h2 className="mt-5 font-display text-2xl font-extrabold">{title}</h2>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">{subtitle}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{description}</p>

                    <ul className="mt-5 space-y-2">
                      {bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                          <span className="text-foreground">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                )
              })}
            </div>

            <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className={cn('h-[46px] gap-2 px-5', authFlowOutlineButtonClass)}
                onClick={() => {
                  signOut()
                  navigate('/auth', { replace: true })
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={!selected || submitting}
                onClick={() => void handleContinue()}
                className={cn(
                  'h-[46px] min-w-[180px] justify-between px-5',
                  authFlowPrimaryButtonClass
                )}
              >
                {submitting ? (
                  <span className="mx-auto inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </span>
                ) : (
                  <>
                    <span />
                    Continue
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MarketingAuthShell>
  )
}
