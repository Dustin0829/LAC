import { Link2 } from 'lucide-react'

import { BrandSocialLinkFields } from '@/components/account/BrandSocialLinkFields'
import type { BrandProfileLinkKey } from '@/api/schema/brands/profile.schema'

type BrandOnboardingSocialStepProps = {
  values: Pick<Record<BrandProfileLinkKey, string>, BrandProfileLinkKey>
  onChange: (key: BrandProfileLinkKey, value: string) => void
}

export function BrandOnboardingSocialStep({ values, onChange }: BrandOnboardingSocialStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
          <Link2 className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 pt-0.5">
          <h2 className="font-display text-lg font-bold text-slate-950">Social links</h2>
          <p className="mt-1 text-sm text-slate-500">
            Optional — help creators find and tag your brand.
          </p>
        </div>
      </div>

      <BrandSocialLinkFields values={values} onChange={onChange} idPrefix="onb" />
    </div>
  )
}
