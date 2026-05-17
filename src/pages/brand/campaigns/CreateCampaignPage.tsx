import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ImageIcon, Link2, Loader2, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { useBrandSubmitCampaignCreate } from '@/api/queries/brands/use-campaigns'
import { CAMPAIGN_PLATFORMS, MIN_BRAND_RATE_PER_1K, MIN_PUBLISH_PHP } from '@/lib/constants'
import {
  campaignRulePlaceholder,
  initialCampaignRules,
  type CreateCampaignFormInput,
  type CreateCampaignFormValidationIssue,
} from '@/lib/brands/campaigns/createCampaign'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IntegerInput } from '@/components/ui/integer-input'
import { Label } from '@/components/ui/label'
import { RequiredFieldAsterisk } from '@/components/RequiredFieldAsterisk'
import { Textarea } from '@/components/ui/textarea'
import { Check } from 'lucide-react'
import { PlatformIcon } from '@/components/PlatformIcon'
import {
  PLATFORM_LABEL,
  estimatedReachViewsFromNetPool,
  getPlatformFeePercent,
  type Platform,
} from '@/lib/mockData'
import { cn, formatPHP, isValidHttpOrHttpsUrl } from '@/lib/utils'

export default function CreateCampaignPage() {
  const { submitCreateCampaign, isSubmitting, isPublishing, isSavingDraft } =
    useBrandSubmitCampaignCreate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [ratePer1k, setRatePer1k] = useState(String(MIN_BRAND_RATE_PER_1K))
  const [budget, setBudget] = useState('10000')
  const [platforms, setPlatforms] = useState<Platform[]>(['tiktok'])
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [assetPackUrl, setAssetPackUrl] = useState('')
  const [referenceLinksRaw, setReferenceLinksRaw] = useState('')
  const [rules, setRules] = useState<string[]>(initialCampaignRules)
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
    setCoverFile(file)
    setCoverImageUrl(URL.createObjectURL(file))
    toast.success('Campaign cover added')
  }

  function clearCover() {
    if (coverImageUrl.startsWith('blob:')) URL.revokeObjectURL(coverImageUrl)
    setCoverImageUrl('')
    setCoverFile(null)
  }

  function formInput(): CreateCampaignFormInput {
    const asset = assetPackUrl.trim()
    return {
      title,
      description,
      ratePer1k: Number(ratePer1k) || 0,
      plannedGrossBudget: Number(budget) || 0,
      platforms,
      rules,
      referenceLinks: parseReferenceLinks(),
      assetUrls: asset ? [asset] : [],
    }
  }

  function runSubmit(openCheckout: boolean) {
    void submitCreateCampaign({
      form: formInput(),
      coverFile,
      openCheckout,
      onValidationIssue: reportCreateCampaignValidationIssue,
    })
  }

  function parseReferenceLinks(): string[] {
    return referenceLinksRaw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
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
        <div className="lg:col-span-2 space-y-4">
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
                    onClick={clearCover}
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
                    placeholder={campaignRulePlaceholder(index)}
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
              {CAMPAIGN_PLATFORMS.map((p) => {
                const selected = platforms.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => togglePlatform(p)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                      selected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-border hover:border-foreground/20'
                    }`}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input bg-background'
                      )}
                      aria-hidden
                    >
                      {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
                    </span>
                    <PlatformIcon platform={p} className="h-5 w-5" />
                    <span className="text-sm font-medium">{PLATFORM_LABEL[p]}</span>
                  </button>
                )
              })}
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
                  min={MIN_PUBLISH_PHP}
                  placeholder={`e.g. ${MIN_PUBLISH_PHP.toLocaleString('en-PH')}`}
                  value={budget}
                  onValueChange={setBudget}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum ₱{MIN_PUBLISH_PHP.toLocaleString('en-PH')} to publish
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
              disabled={isSubmitting}
              size="lg"
              onClick={() => void runSubmit(false)}
            >
              {isSavingDraft ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Save as Draft'
              )}
            </Button>
            <div>
              <Button
                type="button"
                disabled={isSubmitting}
                className="w-full bg-phc-gradient text-white hover:opacity-90"
                size="lg"
                onClick={() => void runSubmit(true)}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Starting checkout…
                  </>
                ) : (
                  'Fund & Publish'
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center mx-auto">
                Saves a draft and sends you to Xendit checkout. After payment, you return to the
                campaign Budget tab.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}

const VALIDATION_TOAST_ID = 'create-campaign-validation'

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

function reportCreateCampaignValidationIssue(issue: CreateCampaignFormValidationIssue) {
  toast.error(issue.message, { id: VALIDATION_TOAST_ID })
  scrollFieldIntoView(issue.fieldId)
}
