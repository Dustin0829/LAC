import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Mail, Lock, User } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'signin' | 'signup'

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
  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function afterAuth() {
    if (role === 'clipper' || role === 'brand') {
      navigate(role === 'brand' ? '/brand/dashboard' : '/clipper/dashboard', { replace: true })
    } else {
      navigate('/onboarding/role', { replace: true })
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter your email and password.')
      return
    }
    if (mode === 'signup' && !name.trim()) {
      toast.error('Please enter your name.')
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    signIn({
      id: `user-${Date.now()}`,
      email: email.trim(),
      name: name.trim() || email.split('@')[0],
    })
    toast.success(mode === 'signup' ? 'Account created!' : 'Welcome back!')
    setSubmitting(false)
    afterAuth()
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await new Promise((r) => setTimeout(r, 700))
    signIn({
      id: `gmail-${Date.now()}`,
      email: 'demo.user@gmail.com',
      name: 'Demo User',
      avatarUrl: undefined,
    })
    toast.success('Signed in with Google')
    setGoogleLoading(false)
    afterAuth()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-soft pointer-events-none" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-zinc-900/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-zinc-500/10 blur-3xl pointer-events-none" />

      <div className="relative grid min-h-screen lg:grid-cols-2">
        {/* Left: Brand panel */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-zinc-950 text-white">
          <Link to="/" className="flex items-center">
            <div>
              <div className="font-display text-xl font-extrabold leading-none">Arpify</div>
              <div className="text-xs uppercase tracking-widest opacity-80">Clipping marketplace</div>
            </div>
          </Link>

          <div className="space-y-6">
            <p className="inline-flex w-fit rounded-full border border-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/70">
              Make your brand viral
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-tight">
              Build reach
              <br />
              with verified
              <br />
              clipping.
            </h1>
            <p className="text-lg max-w-md opacity-90">
              Brands launch campaigns. Clippers turn raw content into viral clips. Arpify pays per 1,000 views — automatically.
            </p>
            <div className="flex gap-3 pt-4">
              <div className="rounded-2xl bg-white/15 backdrop-blur px-5 py-4 border border-white/20">
                <div className="font-display text-2xl font-extrabold">₱90+</div>
                <div className="text-xs opacity-80">per 1,000 views</div>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur px-5 py-4 border border-white/20">
                <div className="font-display text-2xl font-extrabold">24h</div>
                <div className="text-xs opacity-80">payout via GCash</div>
              </div>
            </div>
          </div>

          <div className="text-sm opacity-80">© {new Date().getFullYear()} Arpify</div>
        </div>

        {/* Right: Form */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <Link to="/" className="lg:hidden mb-8 flex items-center">
              <div className="font-display text-lg font-extrabold">Arpify</div>
            </Link>

            <div className="rounded-3xl border border-border bg-card/90 backdrop-blur p-8 shadow-xl shadow-zinc-950/5">
              <div className="mb-1 inline-flex rounded-full bg-muted p-1 text-sm">
                <button
                  className={`rounded-full px-4 py-1.5 transition-all ${
                    mode === 'signup'
                      ? 'bg-phc-gradient text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setMode('signup')}
                >
                  Create account
                </button>
                <button
                  className={`rounded-full px-4 py-1.5 transition-all ${
                    mode === 'signin'
                      ? 'bg-phc-gradient text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setMode('signin')}
                >
                  Sign in
                </button>
              </div>

              <h2 className="mt-6 font-display text-3xl font-extrabold tracking-tight">
                {mode === 'signup' ? 'Welcome to Arpify' : 'Welcome back'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'signup'
                  ? 'Sign up in seconds and start earning from clips.'
                  : 'Sign in to continue clipping.'}
              </p>

              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mt-6 w-full justify-center gap-3"
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

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder="Juan Dela Cruz"
                        className="pl-9"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-phc-gradient text-white hover:opacity-90"
                  disabled={submitting || googleLoading}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === 'signup' ? 'Creating account…' : 'Signing in…'}
                    </>
                  ) : mode === 'signup' ? (
                    'Create account'
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                By continuing, you agree to Arpify&apos;s Terms and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
