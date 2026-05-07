import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, ImageIcon, Link2, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/lib/hooks/use-auth'
import { paymentLogoSrc } from '@/lib/constants/paymentLogos'
import {
  PLATFORM_LABEL,
  NICHE_LABEL,
  DEFAULT_REFUNDABLE_PERCENT,
  getClipperRatePer1k,
  getPlatformFeePercent,
  type Platform,
  type ContentNiche,
} from '@/lib/mockData'
import { formatPHP } from '@/lib/utils'

const PLATFORMS: Platform[] = ['tiktok', 'facebook']
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

const DEFAULT_CAMPAIGN_RULES = [
  'Use only royalty-free or copyright-cleared music',
  'Use the supplied campaign assets or approved UGC',
  'Original edits only',
]

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
  const [endMode, setEndMode] = useState<'fixed' | 'until_goal'>('fixed')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [assetPackUrl, setAssetPackUrl] = useState('')
  const [rules, setRules] = useState<string[]>(() => [...DEFAULT_CAMPAIGN_RULES])
  const [submitting, setSubmitting] = useState(false)
  const [publishPayOpen, setPublishPayOpen] = useState(false)
  const [publishPayFunding, setPublishPayFunding] = useState(false)
  const [publishPaymentMethod, setPublishPaymentMethod] = useState('xendit-invoice')
  const [simulatePaymentFailure, setSimulatePaymentFailure] = useState(false)

  function isValidHttpsUrl(value: string): boolean {
    const v = value.trim()
    if (!v) return true
    try {
      const u = new URL(v)
      return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname)
    } catch {
      return false
    }
  }

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }
  function toggleNiche(n: ContentNiche) {
    setNiches((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]))
  }

  function updateRule(index: number, value: string) {
    setRules((prev) => prev.map((r, i) => (i === index ? value : r)))
  }

  function addRule() {
    setRules((prev) => [...prev, ''])
  }

  function removeRule(index: number) {
    setRules((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)))
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

  async function saveDraft() {
    const totalBudget = Number(budget) || 0
    const brandRate = Number(ratePer1k) || 0
    const err = validateCampaignForm({ requirePublishFunding: false })
    if (err) return toast.error(err)
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    persistCampaign('draft', totalBudget, brandRate)
    setSubmitting(false)
    toast.success('Draft saved.')
  }

  function openPublishPaymentDialog() {
    const err = validateCampaignForm({ requirePublishFunding: true })
    if (err) return toast.error(err)
    setSimulatePaymentFailure(false)
    setPublishPaymentMethod('xendit-invoice')
    setPublishPayOpen(true)
  }

  async function confirmPublishPayment() {
    const totalBudget = Number(budget) || 0
    const brandRate = Number(ratePer1k) || 0
    setPublishPayFunding(true)
    await new Promise((r) => setTimeout(r, 900))
    const paid = !simulatePaymentFailure
    setPublishPayFunding(false)
    setPublishPayOpen(false)
    persistCampaign(paid ? 'active' : 'draft', totalBudget, brandRate)
    if (paid) {
      toast.success('Payment confirmed via Xendit. Your campaign is live for creators!')
    } else {
      toast.error('Payment failed. Your campaign was saved as a draft — try publishing again after funding.')
    }
  }

  function validateCampaignForm(opts: { requirePublishFunding: boolean }): string | null {
    const totalBudget = Number(budget) || 0
    if (!title.trim() || !description.trim()) return 'Add a title and description.'
    if (platforms.length === 0) return 'Pick at least one platform.'
    if (niches.length === 0) return 'Pick at least one niche.'
    if (rules.map((r) => r.trim()).filter(Boolean).length === 0) {
      return 'Add at least one rule for creators.'
    }
    if (!isValidHttpsUrl(assetPackUrl)) {
      return 'Add a valid link for assets (https:// or http://, e.g. Google Drive or Dropbox), or leave it blank.'
    }
    if (opts.requirePublishFunding && totalBudget * (1 - getPlatformFeePercent()) < 10_000) {
      return 'Fund at least ₱10,000 net spendable before publishing.'
    }
    return null
  }

  function persistCampaign(status: 'draft' | 'active', totalBudget: number, brandRate: number) {
    const id = `cmp-${Date.now()}`
    const clipperRate = getClipperRatePer1k(brandRate)
    const platformFeePercent = getPlatformFeePercent()
    const netPool = Math.max(0, Math.round(totalBudget * (1 - platformFeePercent)))
    const platformFee = totalBudget * platformFeePercent
    const payoutPool = Math.max(0, totalBudget - platformFee)
    const cpv = brandRate > 0 ? brandRate / 1000 : 0
    const reach = cpv > 0 ? Math.floor(payoutPool / cpv) : 0
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
      availableBalance: netPool,
      reservedBalance: 0,
      minimumPublishBalance: 10_000,
      campaignViews: 0,
      estimatedReach: Math.max(reach, 1),
      platforms,
      niches,
      status,
      startDate: new Date().toISOString(),
      endDate:
        endMode === 'until_goal'
          ? new Date('2099-12-31T23:59:59.000Z').toISOString()
          : endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      runsUntilGoal: endMode === 'until_goal',
      rules: rules.map((r) => r.trim()).filter(Boolean),
      assetUrl: assetPackUrl.trim() || undefined,
      coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      coverImageUrl,
    })
    navigate(`/brand/campaigns/${id}`)
  }

  const totalBudget = Number(budget) || 0
  const brandRate = Number(ratePer1k) || 0
  const platformFeePercent = getPlatformFeePercent()
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
          Save drafts anytime, fund the campaign, then publish once required fields and the ₱10,000 net floor are ready.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
        className="grid gap-6 lg:grid-cols-3"
      >
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
                placeholder="What is the campaign about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-sm font-medium leading-none text-foreground">Campaign end</span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <label
                  htmlFor="end"
                  onClick={() => setEndMode('fixed')}
                  className={`flex min-w-0 flex-1 cursor-pointer flex-col gap-1.5 ${endMode === 'until_goal' ? 'opacity-60' : ''}`}
                >
                  <span className="text-xs text-muted-foreground">End date</span>
                  <Input
                    id="end"
                    type="date"
                    disabled={endMode === 'until_goal'}
                    value={endDate ? endDate.slice(0, 10) : ''}
                    onChange={(e) => {
                      setEndMode('fixed')
                      setEndDate(new Date(e.target.value).toISOString())
                    }}
                    className="relative h-11 cursor-pointer disabled:cursor-not-allowed [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                  />
                </label>
                <Button
                  type="button"
                  variant={endMode === 'until_goal' ? 'default' : 'outline'}
                  className={`h-11 shrink-0 px-4 text-sm font-semibold whitespace-normal sm:max-w-44 sm:text-balance sm:text-center ${
                    endMode === 'until_goal'
                      ? 'ring-2 ring-primary/35 ring-offset-2 ring-offset-background'
                      : 'border-primary text-primary hover:bg-primary/10 hover:text-primary'
                  }`}
                  onClick={() => setEndMode('until_goal')}
                >
                  Until goal is reached
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Fixed date closes the campaign on that day, or choose until goal is reached to end when the budget
                or reach target is exhausted.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-extrabold">Rules for creators</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These appear on the campaign detail page. Be specific about hashtags, length, tone, and what
                isn&apos;t allowed.
              </p>
            </div>
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    placeholder={
                      index === 0
                        ? 'e.g. Use #YourBrand and tag the official account'
                        : `Rule ${index + 1}`
                    }
                    className="flex-1 min-w-0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => removeRule(index)}
                    disabled={rules.length <= 1}
                    aria-label="Remove rule"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addRule}>
              <Plus className="h-4 w-4" />
              Add rule
            </Button>
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
                    <p className="text-xs text-white/70">This is what creators will see first.</p>
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
            <div className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-phc-gradient text-white">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-extrabold">Assets for creators</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Share a link to raw footage, logos, or brand kits (Google Drive, Dropbox, Notion, etc.).
                  Creators will open this from the campaign page.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="asset-pack-url">Asset folder or file link</Label>
              <Input
                id="asset-pack-url"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://drive.google.com/..."
                value={assetPackUrl}
                onChange={(e) => setAssetPackUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional. Use a share link with view access for clippers.
              </p>
            </div>
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
                <span className="text-muted-foreground">Intake fee</span>
                <span className="font-semibold">
                  {formatPHP(platformFee, { decimals: false })} ({Math.round(platformFeePercent * 100)}%)
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Net spendable pool</span>
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
          <div className="grid gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting || publishPayFunding}
              size="lg"
              onClick={() => void saveDraft()}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save draft'}
            </Button>
            <Button
              type="button"
              disabled={submitting || publishPayFunding}
              className="w-full bg-phc-gradient text-white hover:opacity-90"
              size="lg"
              onClick={openPublishPaymentDialog}
            >
              Publish campaign
            </Button>
          </div>
          <p className="px-2 text-xs text-muted-foreground">
            Publishing opens Xendit checkout to fund this budget. If payment fails, the campaign is saved as a draft.
          </p>
        </aside>
      </form>

      <Dialog open={publishPayOpen} onOpenChange={setPublishPayOpen}>
        <DialogContent className="max-w-md rounded-3xl border-border">
          <DialogHeader>
            <DialogTitle>Pay with Xendit to publish</DialogTitle>
            <DialogDescription>
              Choose how you want to fund this campaign. After a successful payment, the campaign goes live for
              creators. If payment fails, it is saved as a draft instead.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">Amount to charge</p>
              <p className="mt-1 font-display text-2xl font-extrabold">
                {formatPHP(totalBudget, { decimals: false })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Net spendable after intake: {formatPHP(payoutPool, { decimals: false })}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={publishPaymentMethod} onValueChange={setPublishPaymentMethod} disabled={publishPayFunding}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xendit-invoice">Xendit invoice / payment link</SelectItem>
                  <SelectItem value="gcash">
                    <span className="flex items-center gap-2">
                      <img
                        src={paymentLogoSrc({ type: 'gcash' })!}
                        alt=""
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                      GCash
                    </span>
                  </SelectItem>
                  <SelectItem value="maya">
                    <span className="flex items-center gap-2">
                      <img
                        src={paymentLogoSrc({ type: 'maya' })!}
                        alt=""
                        className="h-5 w-5 shrink-0 object-contain"
                      />
                      Maya
                    </span>
                  </SelectItem>
                  <SelectItem value="bank-transfer">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                      Bank transfer
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-3 text-sm">
              <Checkbox
                checked={simulatePaymentFailure}
                onCheckedChange={(v) => setSimulatePaymentFailure(v === true)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Demo: simulate payment failure</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Turn on to save as draft after checkout instead of publishing.
                </span>
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPublishPayOpen(false)}
              disabled={publishPayFunding}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-phc-gradient text-white hover:opacity-90"
              disabled={publishPayFunding}
              onClick={() => void confirmPublishPayment()}
            >
              {publishPayFunding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                </>
              ) : (
                'Confirm payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
