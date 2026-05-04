import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, ImageIcon, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/lib/hooks/useAuth'
import {
  PLATFORM_LABEL,
  NICHE_LABEL,
  DEFAULT_REFUNDABLE_PERCENT,
  getClipperRatePer1k,
  getPlatformFeePercent,
  type Platform,
  type ContentNiche,
  type CampaignAsset,
} from '@/lib/mockData'
import { formatPHP } from '@/lib/utils'

const PLATFORMS: Platform[] = ['tiktok', 'youtube', 'instagram', 'facebook']
const NICHES: ContentNiche[] = [
  'gaming',
  'entertainment',
  'lifestyle',
  'tech',
  'food',
  'fashion',
  'fitness',
  'finance',
  'education',
]

const COVER_COLORS = [
  'from-zinc-950 to-zinc-700',
  'from-neutral-900 to-stone-600',
  'from-slate-950 to-slate-600',
  'from-zinc-800 to-neutral-500',
  'from-stone-900 to-zinc-600',
  'from-neutral-950 to-zinc-800',
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CreateCampaignPage() {
  const navigate = useNavigate()
  const addCampaign = useCampaignsStore((s) => s.addCampaign)
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ratePer1k, setRatePer1k] = useState('10')
  const [budget, setBudget] = useState('20000')
  const [platforms, setPlatforms] = useState<Platform[]>(['tiktok'])
  const [niches, setNiches] = useState<ContentNiche[]>(['lifestyle'])
  const [endDate, setEndDate] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [assets, setAssets] = useState<CampaignAsset[]>([])
  const [submitting, setSubmitting] = useState(false)

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }
  function toggleNiche(n: ContentNiche) {
    setNiches((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]))
  }

  function handleAssetUpload(files: FileList | null) {
    if (!files?.length) return
    const uploaded = Array.from(files).map((file) => ({
      id: `asset-${crypto.randomUUID()}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      url: URL.createObjectURL(file),
    }))
    setAssets((prev) => [...prev, ...uploaded])
    toast.success(`${uploaded.length} asset${uploaded.length === 1 ? '' : 's'} added`)
  }

  function removeAsset(id: string) {
    setAssets((prev) => {
      const removed = prev.find((asset) => asset.id === id)
      if (removed?.url.startsWith('blob:')) URL.revokeObjectURL(removed.url)
      return prev.filter((asset) => asset.id !== id)
    })
  }

  function handleCoverUpload(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image for the campaign cover.')
      return
    }
    if (coverImageUrl.startsWith('blob:')) URL.revokeObjectURL(coverImageUrl)
    setCoverImageUrl(URL.createObjectURL(file))
    toast.success('Campaign cover added')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      return toast.error('Add a title and description.')
    }
    if (platforms.length === 0) return toast.error('Pick at least one platform.')
    if (niches.length === 0) return toast.error('Pick at least one niche.')
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    const id = `cmp-${Date.now()}`
    const totalBudget = Number(budget) || 0
    const brandRate = Number(ratePer1k) || 0
    const clipperRate = getClipperRatePer1k(brandRate)
    const platformFeePercent = getPlatformFeePercent(totalBudget)
    addCampaign({
      id,
      brandId: user?.id ?? 'brand',
      brandName: user?.name ?? 'Your Brand',
      brandLogoColor: 'from-zinc-950 to-zinc-700',
      title: title.trim(),
      description: description.trim(),
      brandRatePer1k: brandRate,
      ratePer1k: clipperRate,
      budget: totalBudget,
      platformFeePercent,
      refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
      spent: 0,
      platforms,
      niches,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      rules: ['Add hashtags as required by the brand', 'Original edits only'],
      assets,
      coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      coverImageUrl,
    })
    toast.success('Campaign created — clippers can start submitting!')
    setSubmitting(false)
    navigate(`/brand/campaigns/${id}`)
  }

  const totalBudget = Number(budget) || 0
  const brandRate = Number(ratePer1k) || 0
  const platformFeePercent = getPlatformFeePercent(totalBudget)
  const platformFee = totalBudget * platformFeePercent
  const payoutPool = Math.max(0, totalBudget - platformFee)
  const cpv = brandRate > 0 ? brandRate / 1000 : 0
  const totalReach = cpv > 0 ? Math.floor(payoutPool / cpv) : 0

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="mt-3 font-display text-3xl md:text-4xl font-extrabold">
          Create a <span className="text-phc-gradient">campaign</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Set your rate per 1,000 views and let our clipper network amplify your reach.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-xl font-extrabold">Basics</h2>
            <div className="space-y-1.5">
              <Label htmlFor="title">Campaign title</Label>
              <Input
                id="title"
                placeholder="e.g. Summer Drink Drop — Clipping Campaign"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder="What should clippers create? Tone, hashtags, do's and don'ts."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">End date</Label>
              <Input
                id="end"
                type="date"
                value={endDate.slice(0, 10)}
                onChange={(e) => setEndDate(new Date(e.target.value).toISOString())}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-extrabold">Campaign cover image</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a real image that will appear on the campaign card and campaign detail page.
              </p>
            </div>

            {coverImageUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-border">
                <img
                  src={coverImageUrl}
                  alt="Campaign cover preview"
                  className="h-64 w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 p-4 text-white backdrop-blur">
                  <div>
                    <p className="font-semibold">Cover image preview</p>
                    <p className="text-xs text-white/70">This is what clippers will see first.</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/30 bg-white/15 text-white hover:bg-white/25"
                    onClick={() => {
                      if (coverImageUrl.startsWith('blob:')) URL.revokeObjectURL(coverImageUrl)
                      setCoverImageUrl('')
                    }}
                  >
                    <X className="h-4 w-4" /> Remove
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="campaign-cover"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-blue-500 hover:bg-blue-500/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-phc-gradient text-white">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-semibold">Upload a cover image</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  JPG, PNG, or WebP. Use a 16:9 campaign/product image.
                </p>
                <Input
                  id="campaign-cover"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    handleCoverUpload(e.target.files?.[0])
                    e.currentTarget.value = ''
                  }}
                />
              </label>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-extrabold">Assets for clippers</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload raw footage, logos, product shots, scripts, or brand guidelines. Clippers
                will see these files on the campaign page.
              </p>
            </div>

            <label
              htmlFor="campaign-assets"
              className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-blue-500 hover:bg-blue-500/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-phc-gradient text-white">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-3 font-semibold">Upload campaign assets</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Videos, images, PDFs, ZIP files, or brand kits
              </p>
              <Input
                id="campaign-assets"
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  handleAssetUpload(e.target.files)
                  e.currentTarget.value = ''
                }}
              />
            </label>

            {assets.length > 0 && (
              <div className="space-y-2">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.type || 'File'} · {formatBytes(asset.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeAsset(asset.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display text-xl font-extrabold">Where & who</h2>
            <div>
              <Label>Platforms</Label>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORMS.map((p) => (
                  <label
                    key={p}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                      platforms.includes(p)
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-border hover:border-foreground/20'
                    }`}
                  >
                    <Checkbox
                      checked={platforms.includes(p)}
                      onCheckedChange={() => togglePlatform(p)}
                    />
                    <span className="text-sm font-medium">{PLATFORM_LABEL[p]}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Niches</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {NICHES.map((n) => {
                  const active = niches.includes(n)
                  return (
                    <button
                      type="button"
                      key={n}
                      onClick={() => toggleNiche(n)}
                      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-phc-gradient text-white border-transparent'
                          : 'border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {NICHE_LABEL[n]}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar summary */}
        <aside className="space-y-4 lg:sticky lg:top-8 self-start">
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-extrabold">Payout</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rate">Brand rate per 1,000 views (₱)</Label>
                <Input
                  id="rate"
                  type="number"
                  min="0"
                  value={ratePer1k}
                  onChange={(e) => setRatePer1k(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget">Total budget (₱)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
            <h3 className="font-display text-lg font-extrabold">Campaign math</h3>
            <div className="rounded-xl bg-phc-gradient-soft p-4">
              <p className="text-xs text-muted-foreground">Estimated reach</p>
              <p className="font-display text-3xl font-extrabold text-phc-gradient">
                {totalReach.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                views, based on the post-fee payout pool
              </p>
            </div>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between">
                <span className="text-muted-foreground">Brand rate</span>
                <span className="font-semibold">
                  {formatPHP(brandRate, { decimals: false })} / 1K
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Total budget</span>
                <span className="font-semibold">
                  {formatPHP(totalBudget, { decimals: false })}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">PHC budget fee</span>
                <span className="font-semibold">
                  {formatPHP(platformFee, { decimals: false })} ({Math.round(platformFeePercent * 100)}%)
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Payout pool</span>
                <span className="font-semibold">
                  {formatPHP(payoutPool, { decimals: false })}
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Cost / view</span>
                <span className="font-semibold">₱{cpv.toFixed(3)}</span>
              </li>
            </ul>
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-phc-gradient text-white hover:opacity-90"
            size="lg"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Launch campaign'}
          </Button>
          <p className="px-2 text-xs text-muted-foreground">
            By launching, you agree to PHC&apos;s campaign policies. Funding is mocked for now.
          </p>
        </aside>
      </form>
    </div>
  )
}
