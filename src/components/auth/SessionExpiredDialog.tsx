import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { useAuthSignOut } from '@/api/queries/use-auth'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useSessionExpiredStore } from '@/lib/auth/sessionExpired'
import { useAuthStore } from '@/lib/stores/authStore'

export function SessionExpiredDialog() {
  const navigate = useNavigate()
  const expired = useSessionExpiredStore((s) => s.expired)
  const clearLocalSession = useAuthStore((s) => s.clearLocalSession)

  const { mutateAsync: signOutApi, isPending: isSigningOut } = useAuthSignOut()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const busy = isSigningOut || isRedirecting

  async function handleSignInAgain() {
    setIsRedirecting(true)
    clearLocalSession()
    try {
      await signOutApi()
    } catch {
      /* cookie may already be gone */
    }
    navigate('/auth', { replace: true })
  }

  return (
    <Dialog open={expired} onOpenChange={() => {}}>
      <DialogContent
        className="gap-0 overflow-hidden border border-white/90 bg-card p-0 shadow-[0_24px_64px_rgba(15,23,42,0.14)] sm:max-w-sm [&>div>button.absolute]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center bg-gradient-to-b from-sky-50/95 via-sky-50/40 to-transparent px-6 pb-1 pt-8">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-[0_10px_28px_rgba(0,171,244,0.18)] ring-1 ring-sky-100/90">
            <Clock className="h-8 w-8 text-[#00ABF4]" strokeWidth={1.75} />
          </div>
        </div>

        <div className="flex flex-col items-center px-6 pb-8 pt-5 text-center">
          <DialogTitle className="font-display text-[1.35rem] font-bold tracking-tight text-foreground">
            Session expired
          </DialogTitle>
          <DialogDescription className="mt-2.5 max-w-[18rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
            Your session has expired. Please sign in again to continue using VidU.
          </DialogDescription>

          <Button
            type="button"
            size="lg"
            className="mt-7 h-11 w-full rounded-full text-[0.9375rem] font-semibold shadow-md"
            loading={busy}
            onClick={() => void handleSignInAgain()}
          >
            {busy ? 'Redirecting…' : 'Sign in again'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
