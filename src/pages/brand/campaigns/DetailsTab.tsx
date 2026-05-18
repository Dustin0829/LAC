import {
  CheckCheck,
  ExternalLink,
  Link2,
  Loader2,
  Monitor,
  PencilLine,
  Plus,
  Shield,
  TrendingUp,
  X,
} from 'lucide-react'
import type { Campaign } from '@/lib/campaigns/types'
import { brandHeadlineRatePer1k } from '@/lib/campaigns/utils'
import type { Platform } from '@/api/types/shared'
import { cn, formatPHP } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { IntegerInput } from '@/components/ui/integer-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PlatformCell, PlatformIcon } from '@/components/PlatformIcon'
import { MIN_BRAND_RATE_PER_1K } from '@/lib/constants'
import {
  DETAILS_SECTION_ACTION_BTN_CLASS,
  PLATFORM_OPTIONS,
  type DetailsEditSection,
} from '@/lib/brands/campaigns/campaignDetailUi'

export type DetailsTabProps = {
  campaign: Campaign
  canEditPreSubmission: boolean
  isSavingDetails: boolean
  detailsEditingSections: ReadonlySet<DetailsEditSection>
  draftTitle: string
  setDraftTitle: (value: string) => void
  draftDescription: string
  setDraftDescription: (value: string) => void
  draftRules: string[]
  draftGrossRateDigits: string
  setDraftGrossRateDigits: (value: string) => void
  draftAssetUrl: string
  setDraftAssetUrl: (value: string) => void
  draftReferenceLinks: string
  setDraftReferenceLinks: (value: string) => void
  draftPlatforms: Platform[]
  invalidReferenceDraftLines: { lineNum: number; text: string }[]
  beginEditSection: (section: DetailsEditSection) => void
  saveCopySection: () => void
  savePlatformsSection: () => void
  saveRulesSection: () => void
  saveAssetsSection: () => void
  saveRefsSection: () => void
  saveGrossRateFromDraft: () => void
  addDraftRule: () => void
  removeDraftRule: (index: number) => void
  setDraftRuleAt: (index: number, value: string) => void
  togglePlatformPill: (platform: Platform) => void
}

export function DetailsTab(props: DetailsTabProps) {
  const {
    campaign,
    canEditPreSubmission,
    isSavingDetails,
    detailsEditingSections,
    draftTitle,
    setDraftTitle,
    draftDescription,
    setDraftDescription,
    draftRules,
    draftGrossRateDigits,
    setDraftGrossRateDigits,
    draftAssetUrl,
    setDraftAssetUrl,
    draftReferenceLinks,
    setDraftReferenceLinks,
    draftPlatforms,
    invalidReferenceDraftLines,
    beginEditSection,
    saveCopySection,
    savePlatformsSection,
    saveRulesSection,
    saveAssetsSection,
    saveRefsSection,
    saveGrossRateFromDraft,
    addDraftRule,
    removeDraftRule,
    setDraftRuleAt,
    togglePlatformPill,
  } = props

  return (
<div
  className="grid min-w-0 gap-4 md:grid-cols-2"
  role="tabpanel"
  aria-labelledby="campaign-tab-details"
>
  <section className="min-w-0 space-y-4 md:space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
    {canEditPreSubmission ? (
      <>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Title
            </p>
            {detailsEditingSections.has('copy') ? (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                disabled={isSavingDetails}
                onClick={saveCopySection}
              >
                {isSavingDetails ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {isSavingDetails ? 'Saving…' : 'Save'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                onClick={() => beginEditSection('copy')}
              >
                <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
                Edit
              </Button>
            )}
          </div>
          {detailsEditingSections.has('copy') ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="campaign-detail-title">Title</Label>
                <Input
                  id="campaign-detail-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="bg-white font-normal dark:bg-card"
                />
              </div>
            </>
          ) : (
            <>
              <h3 className="wrap-break-word font-display text-2xl font-bold leading-tight tracking-tight">
                {campaign.title}
              </h3>
              <div className="h-px w-full min-w-0 bg-border" aria-hidden />
            </>
          )}
        </div>
      </>
    ) : (
      <>
        <h3 className="wrap-break-word font-display text-2xl font-bold leading-tight tracking-tight">
          {campaign.title}
        </h3>
        <div className="h-px w-full min-w-0 bg-border" aria-hidden />
      </>
    )}

    <div className="min-w-0 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Deal terms
      </p>
      <div className="space-y-3">
    <div className="rounded-2xl border border-border bg-muted/25 p-5">
      {canEditPreSubmission && detailsEditingSections.has('grossRate') ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex min-w-0 flex-1 flex-wrap items-center gap-3"
              role="group"
              aria-label="Gross rate per 1,000 views"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950/45 dark:text-teal-300">
                <TrendingUp className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="campaign-gross-rate-details" className="sr-only">
                  Gross rate per 1,000 views (PHP)
                </Label>
                <IntegerInput
                  id="campaign-gross-rate-details"
                  pesoPrefix
                  min={MIN_BRAND_RATE_PER_1K}
                  value={draftGrossRateDigits}
                  onValueChange={setDraftGrossRateDigits}
                  className="max-w-56 font-display text-xl font-bold"
                  aria-describedby="campaign-gross-rate-details-hint"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className={DETAILS_SECTION_ACTION_BTN_CLASS}
              disabled={isSavingDetails}
              onClick={saveGrossRateFromDraft}
            >
              {isSavingDetails ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {isSavingDetails ? 'Saving…' : 'Save'}
            </Button>
          </div>
          <p
            className="mt-4 text-xs text-muted-foreground"
            id="campaign-gross-rate-details-hint"
          >
            Minimum ₱{MIN_BRAND_RATE_PER_1K.toLocaleString('en-PH')} per 1,000 views.
          </p>
        </>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="flex min-w-0 items-center gap-3"
            role="group"
            aria-label="Gross rate per 1,000 views"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950/45 dark:text-teal-300">
              <TrendingUp className="h-5 w-5" aria-hidden />
            </div>
            <p className="font-display text-lg font-semibold leading-tight tracking-tight tabular-nums text-foreground">
              {formatPHP(brandHeadlineRatePer1k(campaign), { decimals: false })} / 1,000
              Views
            </p>
          </div>
          {canEditPreSubmission ? (
            <Button
              type="button"
              variant="ghost"
              className={DETAILS_SECTION_ACTION_BTN_CLASS}
              onClick={() => beginEditSection('grossRate')}
            >
              <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
              Edit
            </Button>
          ) : null}
        </div>
      )}
    </div>

    {canEditPreSubmission ? (
      <div className="min-w-0 rounded-2xl border border-border/80 bg-muted/25 p-4">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                <Monitor className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-foreground">Platforms</p>
                <p className="wrap-break-word text-sm text-muted-foreground">
                  Where your content can be posted.
                </p>
              </div>
            </div>
            {detailsEditingSections.has('platforms') ? (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                disabled={isSavingDetails}
                onClick={savePlatformsSection}
              >
                {isSavingDetails ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {isSavingDetails ? 'Saving…' : 'Save'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                onClick={() => beginEditSection('platforms')}
              >
                <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
                Edit
              </Button>
            )}
          </div>
          {detailsEditingSections.has('platforms') ? (
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(({ id: platformId, label }) => {
                const selected = draftPlatforms.includes(platformId)
                return (
                  <button
                    key={platformId}
                    type="button"
                    onClick={() => togglePlatformPill(platformId)}
                    className={cn(
                      'inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    <PlatformIcon
                      platform={platformId}
                      className="h-5 w-5 shrink-0"
                      aria-hidden
                    />
                    {label}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2">
              {campaign.platforms.map((p) => (
                <div
                  key={p}
                  className="inline-flex items-center rounded-xl border border-border bg-card px-3 py-2.5"
                >
                  <PlatformCell platform={p} iconClassName="h-5 w-5" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="min-w-0 rounded-2xl border border-border/80 bg-muted/25 p-4">
        <div className="flex min-w-0 flex-col gap-3 md:gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="hidden md:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
              <Monitor className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-display font-bold text-foreground">Platforms</p>
              <p className="wrap-break-word text-sm text-muted-foreground">
                Where your content can be posted.
              </p>
            </div>
          </div>
          <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {campaign.platforms.map((p) => (
              <div
                key={p}
                className="inline-flex items-center rounded-xl border border-border bg-card px-3 py-2.5"
              >
                <PlatformCell platform={p} iconClassName="h-5 w-5" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
      </div>
    </div>

    <div className="min-w-0 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Description
      </p>
      {canEditPreSubmission && detailsEditingSections.has('copy') ? (
        <Textarea
          id="campaign-detail-description"
          value={draftDescription}
          onChange={(e) => setDraftDescription(e.target.value)}
          rows={8}
          className="min-h-[160px] resize-y bg-white text-sm leading-relaxed dark:bg-card"
        />
      ) : (
        <div className="max-h-72 overflow-y-auto rounded-2xl border border-border bg-muted/20 px-4 py-3 md:max-h-96">
          <p className="max-w-full min-w-0 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-base">
            {campaign.description}
          </p>
        </div>
      )}
    </div>
  </section>

  <section className="min-w-0 space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div className="flex items-center min-w-0 gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
          <Shield className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold tracking-tight">
            Rules &amp; assets
          </h2>
        </div>
      </div>
    </div>

    {canEditPreSubmission ? (
      <>
        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Campaign rules
            </p>
            {detailsEditingSections.has('rules') ? (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                disabled={isSavingDetails}
                onClick={saveRulesSection}
              >
                {isSavingDetails ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {isSavingDetails ? 'Saving…' : 'Save'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                onClick={() => beginEditSection('rules')}
              >
                <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
                Edit
              </Button>
            )}
          </div>
          {detailsEditingSections.has('rules') ? (
            <>
              <div className="mt-3 space-y-2">
                {draftRules.map((rule, index) => (
                  <div key={index} className="flex min-w-0 items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-border bg-white px-4 py-3 dark:bg-card">
                      <span className="shrink-0 font-display font-bold tabular-nums text-phc-gradient text-sm leading-relaxed">
                        {index + 1}.
                      </span>
                      <Input
                        value={rule}
                        onChange={(e) => setDraftRuleAt(index, e.target.value)}
                        placeholder={`Rule ${index + 1}`}
                        className="h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent px-0 py-0 text-sm font-normal leading-relaxed shadow-none focus-visible:ring-0 dark:bg-transparent"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => removeDraftRule(index)}
                      disabled={draftRules.length <= 1}
                      aria-label="Remove rule"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="mt-3 gap-1.5"
                onClick={addDraftRule}
              >
                <Plus className="h-4 w-4" /> Add rule
              </Button>
            </>
          ) : campaign.rules.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {campaign.rules.map((rule, i) => (
                <li
                  key={i}
                  className="flex min-w-0 gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed"
                >
                  <span className="shrink-0 font-display font-bold text-phc-gradient tabular-nums">
                    {i + 1}.
                  </span>
                  <span className="min-w-0 wrap-break-word">{rule}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No rules added for this campaign.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Campaign assets
            </p>
            {detailsEditingSections.has('assets') ? (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                disabled={isSavingDetails}
                onClick={saveAssetsSection}
              >
                {isSavingDetails ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {isSavingDetails ? 'Saving…' : 'Save'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                onClick={() => beginEditSection('assets')}
              >
                <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
                Edit
              </Button>
            )}
          </div>
          {detailsEditingSections.has('assets') ? (
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="campaign-detail-asset">Asset URL</Label>
              <Input
                id="campaign-detail-asset"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder="https://drive.google.com/..."
                value={draftAssetUrl}
                onChange={(e) => setDraftAssetUrl(e.target.value)}
                className="bg-white dark:bg-card"
              />
              <p className="text-xs text-muted-foreground">
                Link to Drive, Dropbox, or brand kit for creators.
              </p>
            </div>
          ) : !campaign.assetUrl?.trim() ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <p className="font-medium text-sm">No asset link yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a Drive or Dropbox link when creating or editing the campaign.
              </p>
            </div>
          ) : (
            <a
              href={campaign.assetUrl.trim()}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Creator asset link</p>
                <p className="truncate text-xs text-muted-foreground">
                  {campaign.assetUrl.trim()}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Reference links (one per line)
            </p>
            {detailsEditingSections.has('references') ? (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                disabled={isSavingDetails}
                onClick={saveRefsSection}
              >
                {isSavingDetails ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : (
                  <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                )}
                {isSavingDetails ? 'Saving…' : 'Save'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className={DETAILS_SECTION_ACTION_BTN_CLASS}
                onClick={() => beginEditSection('references')}
              >
                <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
                Edit
              </Button>
            )}
          </div>
          {detailsEditingSections.has('references') ? (
            <div className="mt-3 space-y-1.5">
              <Textarea
                value={draftReferenceLinks}
                onChange={(e) => setDraftReferenceLinks(e.target.value)}
                rows={3}
                spellCheck={false}
                placeholder="https://example.com/brand-guidelines"
                aria-invalid={invalidReferenceDraftLines.length > 0}
                className={cn(
                  'resize-none bg-white text-sm dark:bg-card',
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
                  Paste full links only; plain text or hashtags cannot be saved.
                </p>
              )}
            </div>
          ) : (campaign.referenceLinks?.length ?? 0) > 0 ? (
            <ul className="mt-2 space-y-2">
              {campaign.referenceLinks!.map((url, i) => (
                <li key={`${url}-${i}`}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline dark:text-primary"
                  >
                    {url}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No reference links yet.</p>
          )}
        </div>
      </>
    ) : (
      <>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Campaign rules
          </p>
          {campaign.rules.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {campaign.rules.map((rule, i) => (
                <li
                  key={i}
                  className="flex min-w-0 gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed"
                >
                  <span className="shrink-0 font-display font-bold text-phc-gradient tabular-nums">
                    {i + 1}.
                  </span>
                  <span className="min-w-0 wrap-break-word">{rule}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No rules added for this campaign.
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Campaign assets
          </p>

          {!campaign.assetUrl?.trim() ? (
            <div className="mt-3 rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
              <p className="font-medium text-sm">No asset link yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a Drive or Dropbox link when creating or editing the campaign.
              </p>
            </div>
          ) : (
            <a
              href={campaign.assetUrl.trim()}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Creator asset link</p>
                <p className="truncate text-xs text-muted-foreground">
                  {campaign.assetUrl.trim()}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          )}
        </div>

        {(campaign.referenceLinks?.length ?? 0) > 0 ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Reference links
            </p>
            <ul className="mt-2 space-y-2">
              {campaign.referenceLinks!.map((url, i) => (
                <li key={`${url}-${i}`}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline dark:text-primary"
                  >
                    {url}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </>
    )}
  </section>
</div>
  )
}
