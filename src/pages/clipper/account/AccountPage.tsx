import { BadgeCheck, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import { PlatformIcon } from '@/components/PlatformIcon'

export default function ClipperAccountPage() {
  const { user } = useAuth()
  const platformLinks = useCreatorProfileStore((s) => s.platformLinks)
  const reconnectPlatform = useCreatorProfileStore((s) => s.reconnectPlatform)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Account</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
          Your <span className="text-phc-gradient">profile</span>
        </h1>
      </div>

      {/* Profile card */}
      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-phc-gradient text-white text-2xl font-bold font-display">
              {user?.name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-extrabold">{user?.name ?? 'Your name'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500 text-white px-3 py-1 text-xs font-semibold shadow-sm shadow-blue-500/30">
              <BadgeCheck className="h-3 w-3" /> Creator
            </p>
          </div>
          <Button variant="outline">Edit profile</Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="mb-5">
          <h2 className="font-display text-xl font-extrabold">Connected platforms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            TikTok and Meta/Facebook are connected once and reused for future clip submissions.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {platformLinks.map((link) => (
            <div key={link.platform} className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="flex items-center gap-3">
                <PlatformIcon platform={link.platform} className="h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{link.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{link.handle}</p>
                </div>
                {link.status === 'connected' ? (
                  <span className="rounded-full bg-[#C0FF73] px-3 py-1 text-xs font-semibold text-black">
                    Connected
                  </span>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => reconnectPlatform(link.platform)}>
                    <RefreshCw className="h-3.5 w-3.5" /> Reconnect
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <PaymentMethodsSection mode="clipper" />
      </section>
    </div>
  )
}
