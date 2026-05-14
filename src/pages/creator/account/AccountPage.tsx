import { useState } from 'react'
import { BadgeCheck, Check, LogOut, PencilLine, Plug, Unplug, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import { useAuthStore } from '@/lib/stores/authStore'
import { PLATFORM_LABEL } from '@/lib/mockData'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import { PlatformIcon } from '@/components/PlatformIcon'

export default function CreatorAccountPage() {
  const { user } = useAuth()
  const updateUser = useAuthStore((s) => s.updateUser)
  const signOut = useSignOut()
  const platformLinks = useCreatorProfileStore((s) => s.platformLinks)
  const connectPlatform = useCreatorProfileStore((s) => s.connectPlatform)
  const disconnectPlatform = useCreatorProfileStore((s) => s.disconnectPlatform)

  const [editingName, setEditingName] = useState(false)
  const [draftName, setDraftName] = useState(user?.name ?? '')

  function beginEditName() {
    setDraftName(user?.name ?? '')
    setEditingName(true)
  }

  function cancelEditName() {
    setEditingName(false)
    setDraftName(user?.name ?? '')
  }

  function saveName(e: React.FormEvent) {
    e.preventDefault()
    const next = draftName.trim()
    if (!next) {
      toast.error('Please enter a display name.')
      return
    }
    updateUser({ name: next })
    setEditingName(false)
    toast.success('Name updated.')
  }

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
          Account <span className="text-phc-gradient">Profile</span>
        </h1>
      </div>

      {/* Profile card */}
      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {editingName ? (
            <form onSubmit={saveName} className="min-w-0 flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account-display-name">Display name</Label>
                <Input
                  id="account-display-name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  autoComplete="name"
                  className="max-w-md"
                  placeholder="Your name"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" className="bg-phc-gradient text-white">
                  <Check className="h-4 w-4" />
                  Save
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={cancelEditName}>
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="font-display text-2xl font-bold">
                {user?.name?.trim() ? user.name : 'Your name'}
              </h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          )}
          {!editingName ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={beginEditName}
            >
              <PencilLine className="h-4 w-4" aria-hidden />
              Edit name
            </Button>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="mb-5">
          <h2 className="font-display text-xl font-bold">Connected platforms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect TikTok and Meta/Facebook once; we reuse them when you submit campaign content.
          </p>
        </div>
        <div className="grid min-w-0 gap-3 md:grid-cols-2">
          {platformLinks.map((link) => (
            <div
              key={link.platform}
              className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 p-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <PlatformIcon platform={link.platform} className="md:h-9 md:w-9 h-8 w-8 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">{link.label}</p>
                  <p className="mt-0.5 break-all text-xs text-muted-foreground sm:truncate sm:break-normal">
                    {link.handle}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                {link.status === 'connected' ? (
                  <button
                    type="button"
                    onClick={() => {
                      disconnectPlatform(link.platform)
                      toast.success(`${PLATFORM_LABEL[link.platform]} disconnected.`)
                    }}
                    className={cn(
                      'group relative min-h-9 md:px-2 px-1 overflow-hidden rounded-xl border text-xs font-medium transition-colors',
                      'border-emerald-200 bg-emerald-50 text-emerald-700',
                      'hover:border-red-200 hover:bg-red-50 hover:text-red-800',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                    )}
                    aria-label={`${PLATFORM_LABEL[link.platform]}, connected. Click to disconnect.`}
                  >
                    <span
                      className={cn(
                        'cursor-pointer inline-flex w-full items-center justify-center gap-1 md:px-2.5 px-1.5 py-1.5 ',
                        'group-hover:pointer-events-none group-hover:opacity-0 group-hover:invisible'
                      )}
                    >
                      <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
                      Connected
                    </span>
                    <span
                      className={cn(
                        'cursor-pointer invisible absolute inset-0 flex items-center justify-center gap-1 px-2.5 py-1.5 opacity-0 ',
                        'group-hover:visible group-hover:opacity-100'
                      )}
                      aria-hidden
                    >
                      <Unplug className="h-3 w-3 shrink-0" aria-hidden />
                      Disconnect
                    </span>
                  </button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap"
                    onClick={() => connectPlatform(link.platform)}
                  >
                    <Plug className="h-3.5 w-3.5" aria-hidden />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <PaymentMethodsSection mode="creator" />
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:hidden">
        <h2 className="font-display text-lg font-bold">Session</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign out on this device.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          Sign out
        </Button>
      </section>
    </div>
  )
}
