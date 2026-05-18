import { Building2, Shield, Store } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type BrandOnboardingBasicsStepProps = {
  brandName: string
  onBrandNameChange: (value: string) => void
  id?: string
}

export function BrandOnboardingBasicsStep({
  brandName,
  onBrandNameChange,
  id = 'onb-brand-name',
}: BrandOnboardingBasicsStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <Store className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-display text-lg font-bold text-slate-950">Brand basics</h2>
          <p className="mt-1 text-sm text-slate-500">Let&apos;s start with your brand name.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-950">
          Brand name
        </Label>
        <div className="relative">
          <Building2
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            id={id}
            value={brandName}
            onChange={(e) => onBrandNameChange(e.target.value)}
            placeholder="Your brand or company name"
            autoComplete="organization"
            className={cn('h-12 rounded-xl pl-11 text-base font-normal')}
          />
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" aria-hidden />
        You can always change this later in your settings.
      </p>
    </div>
  )
}
