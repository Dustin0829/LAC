import { Lock, Shield, Zap } from 'lucide-react'

const ITEMS = [
  {
    Icon: Shield,
    iconClass: 'text-sky-500',
    title: 'Secure & trusted',
    description: 'Your data is safe with us.',
  },
  {
    Icon: Lock,
    iconClass: 'text-emerald-500',
    title: 'Verified campaigns',
    description: 'Real brands. Real opportunities.',
  },
  {
    Icon: Zap,
    iconClass: 'text-violet-500',
    title: 'Fast payouts',
    description: 'Earn quickly and get paid monthly.',
  },
] as const

export function OnboardingTrustFooter() {
  return (
    <div className="mt-10 grid gap-8 border-t border-slate-200/80 pt-10 sm:grid-cols-3 sm:gap-6 md:mt-12 md:pt-12">
      {ITEMS.map(({ Icon, iconClass, title, description }) => (
        <div key={title} className="flex flex-col items-center text-center">
          <Icon className={`h-6 w-6 shrink-0 ${iconClass}`} strokeWidth={2} aria-hidden />
          <p className="mt-2.5 text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      ))}
    </div>
  )
}
