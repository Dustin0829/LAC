import { BadgeCheck } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { PaymentMethodsSection } from '@/components/account/PaymentMethodsSection'

export default function BrandAccountPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Account</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
          Brand <span className="text-phc-gradient">profile</span>
        </h1>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-phc-gradient text-white text-2xl font-bold font-display">
              {user?.name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'B'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-extrabold">{user?.name ?? 'Your brand'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500 text-white px-3 py-1 text-xs font-semibold shadow-sm shadow-blue-500/30">
              <BadgeCheck className="h-3 w-3" /> Brand Owner
            </p>
          </div>
          <Button variant="outline">Edit brand</Button>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <PaymentMethodsSection mode="brand" />
      </section>
    </div>
  )
}
