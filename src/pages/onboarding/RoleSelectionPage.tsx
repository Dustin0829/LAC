import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Scissors, Building2, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore, type UserRole } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'

interface RoleOption {
  role: UserRole
  title: string
  subtitle: string
  description: string
  bullets: string[]
  Icon: typeof Scissors
  tone: string
}

const ROLES: RoleOption[] = [
  {
    role: 'clipper',
    title: 'I’m a Clipper',
    subtitle: 'Cut clips. Get paid per 1,000 views.',
    description: 'Pick a brand campaign, post your clips on TikTok/YouTube/IG, and earn automatically as views come in.',
    bullets: [
      'Browse and join campaigns',
      'Submit clip URLs and track views',
      'Withdraw to GCash or bank',
    ],
    Icon: Scissors,
    tone: 'bg-zinc-950 text-white',
  },
  {
    role: 'brand',
    title: 'I’m a Brand Owner',
    subtitle: 'Run clipping campaigns. Reach millions.',
    description: 'Launch a campaign, set your rate per 1,000 views, and let our clipper network amplify your reach.',
    bullets: [
      'Create campaigns with budgets',
      'Review and approve submitted clips',
      'Track views and ROI in real time',
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
    toast.success(selected === 'brand' ? 'Welcome, brand owner!' : 'Welcome, clipper!')
    navigate(selected === 'brand' ? '/brand/dashboard' : '/clipper/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-soft pointer-events-none" />
      <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-zinc-900/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 h-96 w-96 rounded-full bg-zinc-500/10 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/arpify-icon.svg" alt="Arpify" className="h-9 w-9" />
            <div>
              <div className="font-display text-lg font-extrabold leading-none">Arpify</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Clipping marketplace
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              signOut()
              navigate('/auth', { replace: true })
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign out
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-phc-gradient" />
            Hi {user?.name || user?.email?.split('@')[0]}
          </p>
          <h1 className="mt-4 font-display text-4xl md:text-5xl font-extrabold tracking-tight">
            How will you use <span className="text-phc-gradient">Arpify</span>?
          </h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Pick one. You can change later in settings.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {ROLES.map(({ role, title, subtitle, description, bullets, Icon, tone }) => {
            const isSelected = selected === role
            return (
              <button
                key={role}
                onClick={() => setSelected(role)}
                className={`group text-left rounded-3xl border-2 p-6 transition-all bg-card ${
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
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
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

        <div className="mt-8 flex justify-center">
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
  )
}
