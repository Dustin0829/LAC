import { useState } from 'react'
import { Check, LogOut, PencilLine, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSignOut } from '@/lib/hooks/use-sign-out'
import { useAuthStore } from '@/lib/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConnectedPlatformsSection } from '@/components/account/ConnectedPlatformsSection'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'

export default function CreatorAccountPage() {
  const { user } = useAuth()
  const updateUser = useAuthStore((s) => s.updateUser)
  const signOut = useSignOut()
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

      <ConnectedPlatformsSection />

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
