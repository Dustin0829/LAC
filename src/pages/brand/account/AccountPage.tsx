import { useEffect, useRef } from 'react'
import { Facebook, Globe, Instagram } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/use-auth'
import { useBrandProfileStore } from '@/lib/stores/brandProfileStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlatformIcon } from '@/components/PlatformIcon'

export default function BrandAccountPage() {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const profile = useBrandProfileStore((s) => s.profile)
  const setProfile = useBrandProfileStore((s) => s.setProfile)
  const persistProfile = useBrandProfileStore((s) => s.persistProfile)
  const seedBrandNameIfEmpty = useBrandProfileStore((s) => s.seedBrandNameIfEmpty)

  useEffect(() => {
    if (user?.name) seedBrandNameIfEmpty(user.name)
  }, [user?.name, seedBrandNameIfEmpty])

  function onLogoFile(files: FileList | null) {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      if (file) toast.error('Choose an image file for your logo.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : null
      setProfile({ logoDataUrl: dataUrl })
    }
    reader.readAsDataURL(file)
  }

  function onSave() {
    persistProfile()
    toast.success('Brand profile saved.')
  }

  const fallbackLetter =
    profile.brandName.trim().charAt(0)?.toUpperCase() ??
    user?.name?.charAt(0)?.toUpperCase() ??
    user?.email?.charAt(0)?.toUpperCase() ??
    'B'

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Account</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold md:text-4xl">
          Brand <span className="text-phc-gradient">profile</span>
        </h1>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="space-y-8">
          <div className="flex flex-col">
            <Avatar className="h-24 w-24 rounded-2xl outline-1 outline-border mb-4">
              <AvatarImage
                src={profile.logoDataUrl ?? undefined}
                className="rounded-2xl object-cover"
              />
              <AvatarFallback className="rounded-2xl bg-phc-gradient font-display text-2xl font-bold text-white">
                {fallbackLetter}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onLogoFile(e.target.files)}
            />
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                Upload logo
              </Button>
              {profile.logoDataUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfile({ logoDataUrl: null })}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand name</Label>
                <Input
                  id="brand-name"
                  value={profile.brandName}
                  onChange={(e) => setProfile({ brandName: e.target.value })}
                  placeholder="Your brand or company name"
                  autoComplete="organization"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Links</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="link-website" className="inline-flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
                      Website
                    </Label>
                    <Input
                      id="link-website"
                      type="url"
                      inputMode="url"
                      value={profile.website}
                      onChange={(e) => setProfile({ website: e.target.value })}
                      placeholder="https://yourbrand.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-instagram" className="inline-flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-muted-foreground" aria-hidden />
                      Instagram
                    </Label>
                    <Input
                      id="link-instagram"
                      type="url"
                      inputMode="url"
                      value={profile.instagram}
                      onChange={(e) => setProfile({ instagram: e.target.value })}
                      placeholder="https://instagram.com/yourbrand"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-facebook" className="inline-flex items-center gap-2">
                      <Facebook className="h-4 w-4 text-muted-foreground" aria-hidden />
                      Facebook
                    </Label>
                    <Input
                      id="link-facebook"
                      type="url"
                      inputMode="url"
                      value={profile.facebook}
                      onChange={(e) => setProfile({ facebook: e.target.value })}
                      placeholder="https://facebook.com/yourbrand"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="link-tiktok" className="inline-flex items-center gap-2">
                      <PlatformIcon platform="tiktok" className="h-3 w-3 opacity-70" />
                      TikTok
                    </Label>
                    <Input
                      id="link-tiktok"
                      type="url"
                      inputMode="url"
                      value={profile.tiktok}
                      onChange={(e) => setProfile({ tiktok: e.target.value })}
                      placeholder="https://tiktok.com/@yourbrand"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          className="w-full bg-blue-600 font-semibold text-white sm:w-auto min-w-[140px]"
          onClick={onSave}
        >
          Save
        </Button>
      </div>
    </div>
  )
}
