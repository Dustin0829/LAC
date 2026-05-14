import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
)

export default function AuthPage() {
  const navigate = useNavigate()
  const signIn = useAuthStore((s) => s.signIn)
  const role = useAuthStore((s) => s.role)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function afterAuth() {
    if (role === 'creator' || role === 'brand') {
      navigate(role === 'brand' ? '/brand/dashboard' : '/dashboard', { replace: true })
    } else {
      navigate('/onboarding/role', { replace: true })
    }
  }

  async function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error('Please enter your email.')
      return
    }
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address.')
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    signIn({
      id: `user-${Date.now()}`,
      email: trimmed,
      name: trimmed.split('@')[0],
    })
    toast.success("Verification sent. You're signed in.")
    setSubmitting(false)
    afterAuth()
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    signIn({
      id: `gmail-${Date.now()}`,
      email: 'alex.martin@gmail.com',
      name: 'Alex Martin',
      avatarUrl: undefined,
    })
    toast.success('Signed in with Google')
    setGoogleLoading(false)
    afterAuth()
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-soft pointer-events-none" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-zinc-900/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-zinc-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-8 flex flex-col items-center text-center transition-opacity hover:opacity-80">
              <span className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">Arpify</span>
              <span className="mt-1 text-xs font-medium uppercase tracking-widest text-muted-foreground md:text-sm">
                Verified views marketplace
              </span>
            </Link>

            <div className="rounded-3xl border border-border bg-card/90 backdrop-blur p-8 shadow-xl shadow-zinc-950/5">
              <h2 className="font-display text-center text-3xl font-extrabold tracking-tight">
                Continue to Arpify
              </h2>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                One path for new and returning users. Enter your email and we’ll send a code.
              </p>
              <form onSubmit={handleEmailContinue} className="mt-6 space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    className={cn('h-12 pl-10')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    aria-label="Email"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting || googleLoading}
                  className="h-12 w-full bg-phc-gradient text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs lowercase text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                size="lg"
                className="h-12 w-full gap-3 bg-card text-foreground border border-border hover:bg-muted"
                onClick={() => void handleGoogle()}
                disabled={googleLoading || submitting}
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
                By continuing, you confirm that you have reviewed and agree to Arpify&apos;s{' '}
                <span className="underline underline-offset-2">Terms of Service</span>
                {' and '}
                <span className="underline underline-offset-2">Privacy Policy</span>.
              </p>
            </div>
          </div>
        </div>

        <footer className="shrink-0 px-6 pb-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Arpify
        </footer>
      </div>
    </div>
  )
}
