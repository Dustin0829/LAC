import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, KeyRound, Loader2, Mail } from 'lucide-react'
import { MarketingAuthShell } from '@/components/layout/MarketingAuthShell'
import { authFlowOutlineButtonClass, authFlowPrimaryButtonClass } from '@/lib/authFlowButtonClasses'
import { AuthLoginCopyright, AuthLoginSocialProof } from '@/components/auth/AuthLoginShowcase'
import { isProfileOnboardingComplete } from '@/lib/profileOnboarding'
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

  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [pendingEmail, setPendingEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function afterAuth() {
    const { role: r, user: u } = useAuthStore.getState()
    if (r === 'creator' || r === 'brand') {
      if (!isProfileOnboardingComplete(u?.id, r)) {
        navigate('/onboarding/profile', { replace: true })
        return
      }
      navigate(r === 'brand' ? '/brand/dashboard' : '/dashboard', { replace: true })
    } else {
      navigate('/onboarding/role', { replace: true })
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      return
    }
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    setPendingEmail(trimmed)
    setCode('')
    setStep('verify')
    setSubmitting(false)
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!/^\d{6}$/.test(trimmed)) {
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 500))
    signIn({
      id: `user-${Date.now()}`,
      email: pendingEmail,
      name: pendingEmail.split('@')[0],
    })
    setSubmitting(false)
    afterAuth()
  }

  function handleBackToEmail() {
    setStep('email')
    setCode('')
    setPendingEmail('')
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
    setGoogleLoading(false)
    afterAuth()
  }

  return (
    <MarketingAuthShell>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1120px] flex-col px-5 py-6 sm:px-8 sm:py-7 lg:px-6">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-0 py-4">
          <div className="flex w-full max-w-[350px] flex-col items-center sm:max-w-[356px]">
            <div className="flex shrink-0 flex-col items-center pb-2 text-center sm:pb-3">
              <span className="font-display text-[38px] font-extrabold leading-none tracking-[-0.055em] text-slate-950">
                Vid<span className="text-[#0ea5e9]">U</span>
              </span>
              <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Verified views marketplace
              </span>
            </div>

            <div className="relative z-20 mt-2 w-full sm:mt-3">
              <div className="rounded-[24px] border border-white/80 bg-white/78 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-7">
              {step === 'email' ? (
                <>
                  <form onSubmit={handleSendCode} className="space-y-3.5">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"  
                        placeholder="Email address"
                        className={cn(
                          'h-[46px] rounded-xl border-slate-200 bg-white/80 pl-11 text-[13px] shadow-none placeholder:text-slate-400 focus-visible:ring-blue-500/30'
                        )}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        aria-label="Email address"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="ghost"
                      size="lg"
                      disabled={submitting || googleLoading}
                      className={cn(
                        'h-[46px] w-full justify-between',
                        authFlowPrimaryButtonClass
                      )}
                    >
                      {submitting ? (
                        <span className="mx-auto inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        <>
                          <span />
                          Continue
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </>
                      )}
                    </Button>
                  </form>

                  <div className="my-8 flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-200/80" />
                    <span className="text-[12px] font-medium text-slate-500">Continue with</span>
                    <div className="h-px flex-1 bg-slate-200/80" />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className={cn('h-[46px] w-full gap-3', authFlowOutlineButtonClass)}
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
                </>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-3.5">
                  <div className="mb-6 space-y-1.5 text-center">
                    <h1 className="font-display text-[20px] font-extrabold tracking-[-0.025em] text-slate-950">
                      Check your email
                    </h1>
                    <p className="text-[13px] text-slate-500">
                      We sent a code to{' '}
                      <span className="font-semibold text-slate-950">{pendingEmail}</span>.
                    </p>
                  </div>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="verification-code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="xxxxxx"
                      className={cn(
                        'h-[46px] rounded-xl border-slate-200 bg-white/80 pl-11 font-mono text-lg tracking-widest shadow-none placeholder:text-slate-400 focus-visible:ring-blue-500/30'
                      )}
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      aria-label="Verification code"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="lg"
                    disabled={submitting || code.length !== 6}
                    className={cn(
                      'h-[46px] w-full justify-between',
                      authFlowPrimaryButtonClass
                    )}
                  >
                    {submitting ? (
                      <span className="mx-auto inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying…
                      </span>
                    ) : (
                      <>
                        <span />
                        Verify and continue
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 w-full text-[13px] text-slate-500 hover:bg-transparent"
                    onClick={handleBackToEmail}
                    disabled={submitting}
                  >
                    Use a different email
                  </Button>
                </form>
              )}

              <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-500">
                By continuing, you confirm that you have reviewed and agree to VidU&apos;s{' '}
                <span className="font-medium text-slate-700 underline underline-offset-2">Terms of Service</span>
                {' and '}
                <span className="font-medium text-slate-700 underline underline-offset-2">Privacy Policy</span>.
              </p>
            </div>
            </div>

            <div className="mt-8 w-full shrink-0 pb-2">
              <AuthLoginSocialProof />
            </div>
          </div>
        </div>

        <div className="mt-auto flex w-full shrink-0 justify-center px-2 pb-4 pt-2">
          <AuthLoginCopyright />
        </div>
      </div>
    </MarketingAuthShell>
  )
}
