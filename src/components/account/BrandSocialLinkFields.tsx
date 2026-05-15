import {
  BRAND_SOCIAL_LINK_FIELDS,
  brandLinkFieldId,
  isTiktokLinkIcon,
  type BrandSocialLinkFieldConfig,
} from '@/lib/brandProfile/brandProfileForm'
import type { BrandProfileLinkKey } from '@/api/schema/brands/profile.schema'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlatformIcon } from '@/components/PlatformIcon'

function LinkFieldIcon({ icon }: { icon: BrandSocialLinkFieldConfig['icon'] }) {
  if (isTiktokLinkIcon(icon)) {
    return <PlatformIcon platform="tiktok" className="h-3 w-3 opacity-70" />
  }
  const Icon = icon
  return <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
}

export interface BrandSocialLinkFieldsProps {
  values: Pick<Record<BrandProfileLinkKey, string>, BrandProfileLinkKey>
  onChange: (key: BrandProfileLinkKey, value: string) => void
  disabled?: boolean
  /** Prefix for input ids (e.g. `link` → `link-website`, `onb` → `onb-website`). */
  idPrefix?: string
}

export function BrandSocialLinkFields({
  values,
  onChange,
  disabled = false,
  idPrefix = 'link',
}: BrandSocialLinkFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {BRAND_SOCIAL_LINK_FIELDS.map((field) => {
        const inputId = brandLinkFieldId(field.key, idPrefix)
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={inputId} className="inline-flex items-center gap-2">
              <LinkFieldIcon icon={field.icon} />
              {field.label}
            </Label>
            <Input
              id={inputId}
              type="url"
              inputMode="url"
              value={values[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              disabled={disabled}
            />
            </div>
        )
      })}
    </div>
  )
}
