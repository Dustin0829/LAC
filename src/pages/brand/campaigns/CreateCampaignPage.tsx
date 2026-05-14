import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ImageIcon, Link2, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IntegerInput } from '@/components/ui/integer-input'
import { Label } from '@/components/ui/label'
import { RequiredFieldAsterisk } from '@/components/RequiredFieldAsterisk'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { PlatformIcon } from '@/components/PlatformIcon'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  PLATFORM_LABEL,
  DEFAULT_REFUNDABLE_PERCENT,
  estimatedReachViewsFromNetPool,
  getCreatorRatePer1k,
  getPlatformFeePercent,
  MIN_GROSS_CAMPAIGN_BUDGET,
  type Platform,
} from '@/lib/mockData'
import { cn, formatPHP, isValidHttpOrHttpsUrl } from '@/lib/utils'

const PLATFORMS: Platform[] = ['tiktok', 'facebook']

const COVER_COLORS = [
  'from-zinc-950 to-zinc-700',
  'from-neutral-900 to-stone-600',
  'from-slate-950 to-slate-600',
  'from-zinc-800 to-neutral-500',
  'from-stone-900 to-zinc-600',
  'from-neutral-950 to-zinc-800',
]

/** Starter rules aligned with demo campaigns — brands can edit; hashtags show creators what to use. */
const DEFAULT_CAMPAIGN_RULES = [
  'Content must be at least 15 seconds long',
  'Use your campaign hashtags in the caption (e.g. #YourBrand #YourCampaign)',
  'Tag your official brand account (e.g. @yourbrandph)',
  'No stolen, recycled, or duplicate content',
]

const MIN_BRAND_RATE_PER_1K = 35

/** Dedupe validation toasts (e.g. double-clicks, strict mode quirks). */
const VALIDATION_TOAST_ID = 'create-campaign-validation'

/** Demo: opens Xendit’s site in a new tab before the simulated checkout delay. */
const DEMO_XENDIT_CHECKOUT_URL = 'https://www.xendit.co/en/'

type FormValidationIssue = { message: string; fieldId: string }

function scrollFieldIntoView(fieldId: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(fieldId)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (el instanceof HTMLElement) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
        el.focus({ preventScroll: true })
      } else {
        el.focus({ preventScroll: true })
        const focusable = el.querySelector<HTMLElement>(
          'input, textarea, select, [role="checkbox"]'
        )
        focusable?.focus({ preventScroll: true })
      }
    }
  })
}

function reportFormValidationIssue(issue: FormValidationIssue) {
  toast.error(issue.message, { id: VALIDATION_TOAST_ID })
  scrollFieldIntoView(issue.fieldId)
}

export default function CreateCampaignPage() {
  const navigate = useNavigate()
  const addCampaign = useCampaignsStore((s) => s.addCampaign)
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ratePer1k, setRatePer1k] = useState(String(MIN_BRAND_RATE_PER_1K))
  const [budget, setBudget] = useState('20000')
  const [platforms, setPlatforms] = useState<Platform[]>(['tiktok'])
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [assetPackUrl, setAssetPackUrl] = useState('')
  const [referenceLinksRaw, setReferenceLinksRaw] = useState('')
  const [rules, setRules] = useState<string[]>(() => [...DEFAULT_CAMPAIGN_RULES])
  const [submitting, setSubmitting] = useState(false)
  const [fundPublishLoading, setFundPublishLoading] = useState(false)

  const invalidReferenceDraftLines = useMemo(() => {
    const lines = referenceLinksRaw.split('\n')
    const bad: { lineNum: number; text: string }[] = []
    for (let i = 0; i < lines.length; i += 1) {
      const t = lines[i].trim()
      if (!t) continue
      if (!isValidHttpOrHttpsUrl(t)) bad.push({ lineNum: i + 1, text: t })
    }
    return bad
  }, [referenceLinksRaw])

  function togglePlatform(p: Platform) {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
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
    const issue = validateCampaignForm({ requirePublishFunding: false })
    if (issue) {
      reportFormValidationIssue(issue)
      return
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    persistCampaign('draft', totalBudget, brandRate)
    setSubmitting(false)
    toast.success('Draft saved.')
  }

  async function fundAndPublish() {
    const totalBudget = Number(budget) || 0
    const brandRate = Number(ratePer1k) || 0
    const issue = validateCampaignForm({ requirePublishFunding: true })
    if (issue) {
      reportFormValidationIssue(issue)
      return
    }
    window.open(DEMO_XENDIT_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
    setFundPublishLoading(true)
    await new Promise((r) => setTimeout(r, 5000))
    setFundPublishLoading(false)
    persistCampaign('active', totalBudget, brandRate)
    toast.success('Payment confirmed. Your campaign is live for creators!')
  }

  function parseReferenceLinks(): string[] {
    return referenceLinksRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  function validateCampaignForm(opts: {
    requirePublishFunding: boolean
  }): FormValidationIssue | null {
    const totalBudget = Number(budget) || 0
    const brandRate = Number(ratePer1k) || 0
    if (!title.trim()) {
      return { message: 'Add a campaign title.', fieldId: 'title' }
    }
    if (!description.trim()) {
      return { message: 'Add a description so creators know what to film.', fieldId: 'description' }
    }
    if (platforms.length === 0) {
      return { message: 'Pick at least one platform.', fieldId: 'campaign-platforms' }
    }
    if (rules.map((r) => r.trim()).filter(Boolean).length === 0) {
      return { message: 'Add at least one rule for creators.', fieldId: 'campaign-rule-0' }
    }
    const trimmedAsset = assetPackUrl.trim()
    if (trimmedAsset && !isValidHttpOrHttpsUrl(trimmedAsset)) {
      return {
        message:
          'Add a valid link for assets (https:// or http://, e.g. Google Drive or Dropbox), or leave it blank.',
        fieldId: 'asset-pack-url',
      }
    }
    for (const link of parseReferenceLinks()) {
      if (!isValidHttpOrHttpsUrl(link)) {
        return {
          message:
            'Each line must be a full http(s) URL (for example https://example.com/page). Fix or remove invalid lines before saving.',
          fieldId: 'reference-links',
        }
      }
    }
    if (opts.requirePublishFunding) {
      if (brandRate < MIN_BRAND_RATE_PER_1K) {
        return {
          message: `Brand rate must be at least ₱${MIN_BRAND_RATE_PER_1K} per 1,000 views.`,
          fieldId: 'rate',
        }
      }
      if (totalBudget < MIN_GROSS_CAMPAIGN_BUDGET) {
        return {
          message: `Total budget must be at least ₱${MIN_GROSS_CAMPAIGN_BUDGET.toLocaleString('en-PH')}.`,
          fieldId: 'budget',
        }
      }
      if (!assetPackUrl.trim()) {
        return {
          message: 'Add an asset link creators need (Drive, Dropbox, etc.) before publishing.',
          fieldId: 'asset-pack-url',
        }
      }
      if (totalBudget * (1 - getPlatformFeePercent()) < 10_000) {
        return {
          message:
            'After the 15% platform fee, spendable must be at least ₱10,000 to publish (raise gross budget).',
          fieldId: 'budget',
        }
      }
    }
    return null
  }

  function persistCampaign(status: 'draft' | 'active', totalBudget: number, brandRate: number) {
    const id = `cmp-${Date.now()}`
    const creatorRate = getCreatorRatePer1k(brandRate)
    const platformFeePercent = getPlatformFeePercent()
    const netPool = Math.max(0, Math.round(totalBudget * (1 - platformFeePercent)))
    const platformFee = totalBudget * platformFeePercent
    const payoutPool = Math.max(0, totalBudget - platformFee)
    const reach = estimatedReachViewsFromNetPool(payoutPool, brandRate)
    addCampaign({
      id,
      brandId: user?.id ?? 'brand',
      brandName: user?.name ?? 'Your Brand',
      brandLogoColor: 'from-zinc-950 to-zinc-700',
      title: title.trim(),
      description: description.trim(),
      brandRatePer1k: brandRate,
      ratePer1k: creatorRate,
      plannedGrossBudget: totalBudget,
      budget: netPool,
      platformFeePercent,
      refundablePercent: DEFAULT_REFUNDABLE_PERCENT,
      spent: 0,
      reservedBalance: 0,
      minimumPublishBalance: 10_000,
      campaignViews: 0,
      estimatedReach: reach,
      platforms,
      status,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      runsUntilGoal: false,
      rules: rules.map((r) => r.trim()).filter(Boolean),
      assetUrl: assetPackUrl.trim() || undefined,
      referenceLinks: parseReferenceLinks().length > 0 ? parseReferenceLinks() : undefined,
      coverColor: COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)],
      coverImageUrl: coverImageUrl.trim() ? coverImageUrl : undefined,
    })
    navigate(`/brand/campaigns/${id}`)
  }

  const totalBudget = Number(budget) || 0
  const brandRate = Number(ratePer1k) || 0
  const platformFeePercent = getPlatformFeePercent()
  const platformFee = totalBudget * platformFeePercent
  const payoutPool = Math.max(0, totalBudget - platformFee)
  const totalReach = estimatedReachViewsFromNetPool(payoutPool, brandRate)
  const cpv = brandRate > 0 ? brandRate / 1000 : 0

  return (
    <div className="px-2 py-4 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <Link
          to="/brand/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to campaigns
        </Link>
      </div>

      <h1 className="mb-6 font-display text-3xl md:text-4xl font-extrabold">
        Create a <span className="text-phc-gradient">campaign</span>
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
        className="grid items-start gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold">
                Details
                <RequiredFieldAsterisk />
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Write what you want people to post — what you sell, where, and what a good video
                should show.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title" className="mb-1.5 inline-flex items-baseline gap-0">
                Campaign title
              </Label>
              <Input
                id="title"
                placeholder="e.g. Cafe Vibes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="mb-1.5 inline-flex items-baseline gap-0">
                Description
              </Label>
              <Textarea
                id="description"
                rows={5}
                placeholder={
                  'e.g. We want more people near our shops to know we are here, what we sell, and what a visit costs. We want short videos of the drinks and food we actually serve, filmed in or in front of our cafes, with the branch name or link so someone who watches can come in or order the same thing.'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold">Campaign cover image</h2>
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
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-blue-500 hover:bg-blue-500/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-phc-gradient text-white">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-semibold">Upload a cover (optional)</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  JPG, PNG, or WebP — 16:9 works best.
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
              <h2 className="font-display inline-flex items-baseline gap-0 text-xl font-bold">
                Rules for creators
                <RequiredFieldAsterisk />
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Decide length, tone, required hashtags (creators will copy them), @mentions, and
                what is not allowed.
              </p>
            </div>
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    id={index === 0 ? 'campaign-rule-0' : undefined}
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                    placeholder={
                      index === 0
                        ? 'e.g. Content must be at least 15 seconds long'
                        : index === 1
                          ? 'e.g. Use #YourBrandCafe #YourCityLaunch in the on-screen text or caption'
                          : index === 2
                            ? 'e.g. Tag @yourbrandph and mention which branch or ordering link to use'
                            : index === 3
                              ? 'e.g. No stolen, recycled, or duplicate content'
                              : `Rule ${index + 1} (e.g. Product visible in the first 5 seconds)`
                    }
                    className="min-w-0 flex-1"
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
              Add Rule
            </Button>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display inline-flex items-baseline gap-0 text-xl font-bold">
              Platforms
              <RequiredFieldAsterisk />
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose where creator content for this campaign may be posted.
            </p>
            <div
              id="campaign-platforms"
              tabIndex={-1}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 outline-none"
              role="group"
              aria-label="Platforms"
            >
              {PLATFORMS.map((p) => (
                <label
                  key={p}
                  className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                    platforms.includes(p)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-border hover:border-foreground/20'
                  }`}
                >
                  <Checkbox
                    checked={platforms.includes(p)}
                    onCheckedChange={() => togglePlatform(p)}
                  />
                  <PlatformIcon platform={p} className="h-5 w-5" />
                  <span className="text-sm font-medium">{PLATFORM_LABEL[p]}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-phc-gradient text-white">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">
                  Assets for creators
                  <RequiredFieldAsterisk />
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Link to raw footage, logos, or brand kits (Google Drive, Dropbox, Notion, etc.).
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
                placeholder="https://drive.google.com/drive/folders/1a2b3cYourBrandKit"
                value={assetPackUrl}
                onChange={(e) => setAssetPackUrl(e.target.value)}
              />
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Reference links</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Reference posts, product pages, or tracking URLs.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reference-links">HTTPS URLs (one per line)</Label>
              <Textarea
                id="reference-links"
                rows={4}
                spellCheck={false}
                placeholder={
                  'https://yourbrand.com/product\nhttps://www.tiktok.com/@yourbrand/video/...'
                }
                value={referenceLinksRaw}
                onChange={(e) => setReferenceLinksRaw(e.target.value)}
                aria-invalid={invalidReferenceDraftLines.length > 0}
                className={cn(
                  'min-h-28 resize-y bg-white text-sm dark:bg-card',
                  invalidReferenceDraftLines.length > 0 &&
                    'border-destructive focus-visible:ring-destructive/25'
                )}
              />
              {invalidReferenceDraftLines.length > 0 ? (
                <p className="text-xs text-destructive" role="alert">
                  Non-empty lines must be valid URLs starting with{' '}
                  <span className="whitespace-nowrap">http://</span> or{' '}
                  <span className="whitespace-nowrap">https://</span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Paste full links only; random text can&apos;t be saved.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar summary */}
        <aside className="space-y-4 self-start lg:sticky lg:-top-6">
          <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-bold">
              Payout
              <RequiredFieldAsterisk />
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rate">Brand rate per 1,000 views</Label>
                <IntegerInput
                  id="rate"
                  pesoPrefix
                  min={MIN_BRAND_RATE_PER_1K}
                  placeholder={`e.g. ${MIN_BRAND_RATE_PER_1K}`}
                  value={ratePer1k}
                  onValueChange={setRatePer1k}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum ₱{MIN_BRAND_RATE_PER_1K} per 1K views to publish.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget">Total budget</Label>
                <IntegerInput
                  id="budget"
                  pesoPrefix
                  min={MIN_GROSS_CAMPAIGN_BUDGET}
                  placeholder={`e.g. ${MIN_GROSS_CAMPAIGN_BUDGET.toLocaleString('en-PH')}`}
                  value={budget}
                  onValueChange={setBudget}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum ₱{MIN_GROSS_CAMPAIGN_BUDGET.toLocaleString('en-PH')} to publish
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
            <h3 className="font-display text-lg font-bold">Campaign Breakdown</h3>
            <div className="rounded-xl bg-phc-gradient-soft p-4">
              <p className="text-xs text-muted-foreground">Estimated reach</p>
              <p className="font-display text-3xl font-bold text-phc-gradient">
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
                  {formatPHP(brandRate, { decimals: false })} / 1,000 Views
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Total budget</span>
                <span className="font-semibold">{formatPHP(totalBudget, { decimals: false })}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Platform fee</span>
                <span className="font-semibold">
                  {formatPHP(platformFee, { decimals: false })} (
                  {Math.round(platformFeePercent * 100)}%)
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-muted-foreground">Payout pool</span>
                <span className="font-semibold">{formatPHP(payoutPool, { decimals: false })}</span>
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
              disabled={submitting || fundPublishLoading}
              size="lg"
              onClick={() => void saveDraft()}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save as Draft'}
            </Button>
            <div>
              <Button
                type="button"
                disabled={submitting || fundPublishLoading}
                className="w-full bg-phc-gradient text-white hover:opacity-90"
                size="lg"
                onClick={() => void fundAndPublish()}
              >
                {fundPublishLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Confirming payment…
                  </>
                ) : (
                  'Fund & Publish'
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center md:w-3/4 mx-auto">
                This will open xendit checkout in a new tab, once you confirm payment, the campaign
                will go live for creators.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}
