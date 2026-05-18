import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { AuthPageLayout } from '@/components/layout/AuthPageLayout'
import { AuthLoginSocialProof } from '@/components/auth/AuthLoginShowcase'
import { VidULogo } from '@/components/VidULogo'
import { Button } from '@/components/ui/button'
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/lib/constants'
import { startGoogleOAuth } from '@/lib/auth/startGoogleOAuth'
import { authFlowOutlineButtonClass } from '@/lib/authFlowButtonClasses'
import { cn } from '@/lib/utils'
import { FcGoogle } from 'react-icons/fc'

export default function AuthPage() {
  const [googleLoading, setGoogleLoading] = useState(false)

  function handleGoogle() {
    startGoogleOAuth(() => setGoogleLoading(true))
  }

  return (
    <AuthPageLayout>
      <div className="flex h-screen items-center justify-center px-4">
        <div className="flex w-full flex-col items-center sm:max-w-sm">
          <div className="flex shrink-0 flex-col items-center pb-2 text-center sm:pb-3">
            <VidULogo variant="mark" className="h-28 w-auto sm:h-32" />
            <p className='text-sm text-slate-600 font-mediumt'> The platform where creators monetize their content and brands reach new audiences.</p>
          </div>

          <div className="relative z-20 w-full">
            <div className="rounded-[24px] border border-white/80 bg-white/78 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-7">
              <div className="space-y-3 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className={cn('h-[46px] w-full gap-3', authFlowOutlineButtonClass)}
                  onClick={handleGoogle}
                  disabled={googleLoading}
                >
                  {googleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FcGoogle className="h-5 w-5" />
                  )}
                  Continue with Google
                </Button>
              </div>

              <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
                By continuing, you confirm that you have reviewed and agree to VidU&apos;s{' '}
                <span
                  className="cursor-pointer font-medium text-slate-700 underline underline-offset-2"
                  onClick={() => window.open(TERMS_OF_SERVICE_URL, '_blank')}
                >
                  Terms of Service
                </span>
                {' and '}
                <span
                  className="cursor-pointer font-medium text-slate-700 underline underline-offset-2"
                  onClick={() => window.open(PRIVACY_POLICY_URL, '_blank')}
                >
                  Privacy Policy
                </span>
                .
              </p>
            </div>
          </div>

          <div className="mt-8 w-full shrink-0 pb-2">
            <AuthLoginSocialProof />
          </div>
        </div>
      </div>
    </AuthPageLayout>
  )
}
