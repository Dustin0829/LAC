import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Sparkles, Building2, Check, Loader2, type LucideIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore, type UserRole } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'

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
    subtitle: 'I join campaigns, post content, and earn.',
    description:
      'Browse active brand campaigns, connect TikTok or Facebook once, submit owned links, and track verified view earnings.',
    bullets: [
      'Browse campaigns before linking socials',
      'Submit owned TikTok or Facebook content',
      'Get paid after weekly brand release',
    ],
    Icon: Sparkles,
    tone: 'bg-primary text-white',
  },
  {
    role: 'brand',
    title: 'Brand',
    subtitle: 'I create campaigns and pay for views.',
    description:
      'Draft campaigns, add funds, review submissions, and release weekly payouts after checking the summary.',
    bullets: [
      'Create, save, fund, and publish campaigns',
      'Review content before they accrue',
      'Release weekly payouts manually',
    ],
    Icon: Building2,
    tone: 'bg-zinc-100 text-zinc-950',
  },
]

export default function RoleSelectionPage() {
  const navigate = useNavigate()
  const setRole = useAuthStore((s) => s.setRole)
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const [selected, setSelected] = useState<UserRole | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleContinue() {
    if (!selected) {
      toast.error('Pick what you want to do on Arpify.')
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    setRole(selected)
    toast.success(selected === 'brand' ? 'Welcome, Brand!' : 'Welcome, Creator!')
    navigate(selected === 'brand' ? '/brand/dashboard' : '/dashboard', { replace: true })
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-soft pointer-events-none" />
      <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-zinc-900/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full blur-3xl pointer-events-none bg-zinc-500/10" />

      <div className="relative z-10 flex w-full flex-1 flex-col">
        <header className="mx-auto flex w-full max-w-6xl shrink-0 items-center justify-between gap-6 px-6 pt-10 pb-6 md:px-8 md:pt-12 md:pb-8">
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <div>
              <div className="font-display text-2xl font-extrabold leading-none tracking-tight md:text-3xl lg:text-4xl">
                Arpify
              </div>
              <div className="mt-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground md:text-sm md:tracking-widest">
                Verified views marketplace
              </div>
            </div>
          </div>
          <div className="flex shrink-0 justify-end">
            <button
              onClick={() => {
                signOut()
                navigate('/auth', { replace: true })
              }}
              className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground md:text-lg"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-12 pt-4">
          <div className="flex w-full max-w-5xl flex-col items-center gap-8 md:gap-10">
            <div className="w-full max-w-2xl text-center px-2">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-phc-gradient" />
                Hi {user?.name || user?.email?.split('@')[0]}
              </p>
              <h1 className="mt-4 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
                How will you use <span className="text-phc-gradient">Arpify</span>?
              </h1>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Choose brand or creator to get started. Support can update your role if needed.
              </p>
            </div>

            <div className="mx-auto w-full max-w-5xl grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              {ROLES.map(({ role, title, subtitle, description, bullets, Icon, tone }) => {
                const isSelected = selected === role
                return (
                  <button
                    key={role}
                    onClick={() => setSelected(role)}
                    className={`group text-left rounded-3xl border p-6 transition-all bg-card ${
                      isSelected
                        ? 'border-blue-500 shadow-xl shadow-blue-500/20 ring-2 ring-blue-500/20 ring-offset-2 ring-offset-background'
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

            <div className="flex w-full max-w-5xl justify-center px-1">
              <Button
                size="lg"
                disabled={!selected || submitting}
                onClick={() => void handleContinue()}
                className="bg-phc-gradient text-white hover:opacity-90 px-8"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Continue <ArrowRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
