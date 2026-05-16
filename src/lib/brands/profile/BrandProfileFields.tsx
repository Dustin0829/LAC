import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { BrandSocialLinkFields } from '@/components/account/BrandSocialLinkFields'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BrandProfile } from '@/lib/stores/brandProfileStore'

type Props = {
  initial: BrandProfile
  saving: boolean
  onSave: (profile: BrandProfile) => void
}

export function BrandProfileFields({ initial, saving, onSave }: Props) {
  const [profile, setProfile] = useState(initial)

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brand-name">Brand name</Label>
          <Input
            id="brand-name"
            value={profile.brandName}
            onChange={(e) => setProfile((p) => ({ ...p, brandName: e.target.value }))}
            placeholder="Your brand or company name"
            autoComplete="organization"
            disabled={saving}
          />
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Links</p>
          <BrandSocialLinkFields
            values={profile}
            onChange={(key, value) => setProfile((p) => ({ ...p, [key]: value }))}
            disabled={saving}
          />
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="button"
          size="lg"
          className="w-full bg-phc-gradient font-semibold text-white hover:opacity-90 sm:w-auto min-w-36"
          onClick={() => onSave(profile)}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>
    </>
  )
}
