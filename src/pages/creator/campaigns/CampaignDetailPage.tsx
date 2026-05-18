import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Link2,
  Loader2,
  Monitor,
  Plug,
  Plus,
  Send,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import {
  useCampaignSubmissionLinkPreview,
  useConfirmCampaignSubmission,
} from '@/api/queries/creator/use-campaign-submissions'
import { useCreatorCampaign } from '@/api/queries/creator/use-campaigns'
import { useMeProfile } from '@/api/queries/use-me'
import { usePaymentMethods } from '@/api/queries/use-payment-methods'
import { parseCampaignSubmissionBody } from '@/api/schema/creator/submission.schema'
import { creatorLinksFromApi } from '@/lib/auth/mapMeProfile'
import { startFacebookOAuth } from '@/lib/auth/startFacebookOAuth'
import { startTikTokOAuth } from '@/lib/auth/startTikTokOAuth'
import { isCreatorPlatformConnectEnabled } from '@/lib/constants'
import {
  campaignSubmissionBelowMinViewsMessage,
  campaignSubmissionUrlErrorMessage,
} from '@/lib/creators/submissions/campaignSubmissionMessages'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import { AddPaymentMethodDialog } from '@/components/account/AddPaymentMethodDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
// v1 (post-MVP): import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlatformCell, PlatformIcon } from '@/components/PlatformIcon'
import { VidULoading } from '@/components/VidULoading'
import { cn, formatPHP, formatNumber, formatViews } from '@/lib/utils'
import type { Platform } from '@/api/types/shared'
import { campaignStatusLabel } from '@/lib/campaigns/status'
import { creatorHeadlineRatePer1k } from '@/lib/campaigns/utils'
import { PLATFORM_CONTENT_URL_PLACEHOLDER, PLATFORM_LABEL } from '@/lib/platforms/labels'
import { toast } from 'sonner'

// v1 (post-MVP): when yellow basket was enabled, TikTok + checked used a lower effective ₱/1k.
// function effectiveCreatorRatePer1k(
//   basePer1k: number,
//   platform: Platform,
//   yellowBasket: boolean
// ): number {
//   if (platform === 'tiktok' && yellowBasket) {
//     return Math.round(basePer1k * YELLOW_BASKET_RATE_FACTOR * 100) / 100
//   }
//   return basePer1k
// }

function effectiveCreatorRatePer1k(
  basePer1k: number,
  _platform: Platform,
  _yellowBasket: boolean
): number {
  void _platform
  void _yellowBasket
  return basePer1k
}

function CreatorCampaignDetailNotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-display text-lg font-bold">Campaign not found</p>
      <Button asChild variant="outline" className="mt-4 gap-1.5">
        <Link to="/campaigns">
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Back to Campaigns
        </Link>
      </Button>
    </div>
  )
}

export default function CreatorCampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const campaignId = id ?? ''
  const { data: campaign, isLoading, isError } = useCreatorCampaign(campaignId)
  const { data: meProfile } = useMeProfile()
  const setPlatformLinks = useCreatorProfileStore((s) => s.setPlatformLinks)
  const platformLinks = useCreatorProfileStore((s) => s.platformLinks)
  const { data: payoutMethods = [] } = usePaymentMethods()
  const { mutate: confirmSubmission, isPending: submitting } =
    useConfirmCampaignSubmission(campaignId)

  const [open, setOpen] = useState(false)
  const [addPaymentOpen, setAddPaymentOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState<Platform>('tiktok')
  // v1 (post-MVP): const [tikTokYellowBasket, setTikTokYellowBasket] = useState(false)
  const skipSubmitResetForPaymentRef = useRef(false)
  const prevSubmitOpenRef = useRef(open)
  const connectedPlatforms = platformLinks
    .filter((link) => link.status === 'connected')
    .map((link) => link.platform)
  const hasPayoutMethod = payoutMethods.length > 0
  const platformConnected = connectedPlatforms.includes(platform)

  const campaignPlatformsKey = campaign?.platforms.slice().sort().join('|') ?? ''

  const openAddPaymentFromSubmit = useCallback(() => {
    skipSubmitResetForPaymentRef.current = true
    setOpen(false)
    setAddPaymentOpen(true)
  }, [])

  const handlePlatformReconnect = useCallback(() => {
    if (meProfile && 'platformLinks' in meProfile) {
      setPlatformLinks(creatorLinksFromApi(meProfile))
    }
  }, [meProfile, setPlatformLinks])

  const { linkPhase, snapshot, previewError, resetLinkPreview, clearLinkPreviewProgress } =
    useCampaignSubmissionLinkPreview({
      campaignId,
      open: open && Boolean(campaign),
      url,
      platform,
      platformsAllowed: campaign?.platforms ?? [],
      hasPayoutMethod,
      platformConnected,
      onPaymentMethodRequired: openAddPaymentFromSubmit,
      onPlatformReconnect: handlePlatformReconnect,
    })

  useEffect(() => {
    if (!campaign) return
    setPlatform((p) => (campaign.platforms.includes(p) ? p : (campaign.platforms[0] ?? 'tiktok')))
  }, [campaign, campaignPlatformsKey])

  useEffect(() => {
    if (meProfile && 'platformLinks' in meProfile) {
      setPlatformLinks(creatorLinksFromApi(meProfile))
    }
  }, [meProfile, setPlatformLinks])

  function resetSubmitModal() {
    setUrl('')
    // v1 (post-MVP): setTikTokYellowBasket(false)
    resetLinkPreview()
  }

  async function handleConnectOnly() {
    if (!isCreatorPlatformConnectEnabled(platform)) {
      toast.info(`${PLATFORM_LABEL[platform]} connect is not available yet.`)
      return
    }
    if (platform === 'tiktok') {
      await startTikTokOAuth()
      return
    }
    await startFacebookOAuth()
  }

  /** Reset submit modal when it closes, except when handing off to “Add payment method”. */
  useEffect(() => {
    if (prevSubmitOpenRef.current && !open) {
      if (!skipSubmitResetForPaymentRef.current) {
        resetSubmitModal()
      }
      skipSubmitResetForPaymentRef.current = false
    }
    prevSubmitOpenRef.current = open
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || !campaign) return
    if (!hasPayoutMethod || !platformConnected) return
    if (linkPhase !== 'ready' || !snapshot) return
    if (!campaign.platforms.includes(platform)) return

    const parsed = parseCampaignSubmissionBody(url, platform)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? campaignSubmissionUrlErrorMessage())
      return
    }

    confirmSubmission(parsed.data, {
      onSuccess: () => {
        setOpen(false)
        resetSubmitModal()
        navigate('/submissions')
      },
    })
  }

  if (!campaignId || (!isLoading && (isError || !campaign))) {
    return <CreatorCampaignDetailNotFound />
  }

  if (isLoading || !campaign) {
    return (
      <div className="flex items-center justify-center gap-2 px-2 py-20 text-sm text-muted-foreground md:p-8">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading campaign…
      </div>
    )
  }

  const budgetProgressPct =
    campaign.budget > 0 ? Math.min(100, (campaign.spent / campaign.budget) * 100) : 0
  const creatorRatePer1k = creatorHeadlineRatePer1k(campaign)

  const statusVisual = {
    active: { chip: 'border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
    paused: { chip: 'border-amber-200 bg-amber-50 text-amber-900', dot: 'bg-amber-500' },
    ended: { chip: 'border-zinc-200 bg-zinc-50 text-zinc-700', dot: 'bg-zinc-400' },
    draft: { chip: 'border-blue-200 bg-blue-50 text-blue-800', dot: 'bg-blue-500' },
    funding_pending: {
      chip: 'border-violet-200 bg-violet-50 text-violet-900',
      dot: 'bg-violet-500',
    },
  } as const
  const statusUi = statusVisual[campaign.status]

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden /> All Campaigns
        </Link>
      </div>

      {/* Campaign summary — aligned with brand; creators only get Submit (no pause / tabs) */}
      <div className="min-w-0 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex min-w-0 flex-col gap-4 md:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize',
                statusUi.chip
              )}
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusUi.dot)} aria-hidden />
              {campaignStatusLabel(campaign.status)}
            </div>
            <h1 className="min-w-0 wrap-break-word font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {campaign.title}
            </h1>
          </div>
          <div className="shrink-0 lg:pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="gap-1.5 bg-phc-gradient font-semibold text-white hover:opacity-90"
                  >
                    <Send className="h-4 w-4 shrink-0" aria-hidden />
                    Submit Content
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Submit Content</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {!hasPayoutMethod ? (
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-50">
                        <p className="font-medium">Payout method required</p>
                        <p className="mt-1 text-xs leading-relaxed opacity-90">
                          Add a payout method before you can submit content.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 text-primary hover:opacity-90"
                          onClick={openAddPaymentFromSubmit}
                        >
                          <Plus className="h-4 w-4" /> Add Payment Method
                        </Button>
                      </div>
                    ) : null}

                    <div className="space-y-1.5">
                      <Label>Platform</Label>
                      <Select
                        value={platform}
                        disabled={!hasPayoutMethod}
                        onValueChange={(v) => {
                          const p = v as Platform
                          if (p === platform) return
                          setPlatform(p)
                          setUrl('')
                          // v1 (post-MVP): if (p !== 'tiktok') setTikTokYellowBasket(false)
                          clearLinkPreviewProgress()
                        }}
                      >
                        <SelectTrigger className="h-auto min-h-10 gap-2 border border-border bg-muted/60 py-2.5 text-left  ring-offset-background hover:bg-muted/80 focus-visible:ring-2 dark:border-border dark:bg-muted/40 dark:hover:bg-muted/55">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {campaign.platforms.map((p) => (
                            <SelectItem key={p} value={p}>
                              <span className="flex items-center gap-2">
                                <PlatformIcon platform={p} className="h-4 w-4" aria-hidden />
                                {PLATFORM_LABEL[p]}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {!hasPayoutMethod ? null : !platformConnected ? (
                      <div className="space-y-3 rounded-xl border border-border bg-muted/40 px-3 py-3">
                        <p className="text-sm text-foreground">
                          Connect <strong>{PLATFORM_LABEL[platform]}</strong> before you paste a
                          content link.
                        </p>
                        <Button
                          type="button"
                          className="w-full bg-phc-gradient text-white hover:opacity-90"
                          onClick={handleConnectOnly}
                        >
                          <Plug className="h-4 w-4" />
                          Connect {PLATFORM_LABEL[platform]}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="content-url">Content URL</Label>
                          <Input
                            id="content-url"
                            placeholder={PLATFORM_CONTENT_URL_PLACEHOLDER[platform]}
                            value={url}
                            autoFocus
                            onChange={(e) => {
                              setUrl(e.target.value)
                              clearLinkPreviewProgress()
                            }}
                          />
                          {previewError && linkPhase !== 'below_quota' ? (
                            <p className="text-sm text-destructive" role="alert">
                              {previewError}
                            </p>
                          ) : null}
                        </div>
                        {
                          null /* v1 (post-MVP): TikTok “yellow basket” checkbox lived here (Checkbox + label). */
                        }
                        {linkPhase === 'validating' ? (
                          <div
                            className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-muted/35 px-4 py-10 dark:bg-muted/25"
                          >
                            <VidULoading size="sm" />
                            <div className="text-center">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Stats preview
                              </p>
                              <p className="mt-2 text-sm font-medium text-foreground">
                                Fetching post stats…
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                This usually takes a moment.
                              </p>
                            </div>
                          </div>
                        ) : null}
                        {linkPhase === 'below_quota' && !snapshot ? (
                          <div className="rounded-xl border border-amber-200/90 bg-amber-50/60 px-3 py-4 text-center text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                            {previewError ?? campaignSubmissionBelowMinViewsMessage()}
                          </div>
                        ) : null}
                        {snapshot && (linkPhase === 'ready' || linkPhase === 'below_quota') ? (
                          <div
                            className={cn(
                              'space-y-3 rounded-xl border p-3',
                              linkPhase === 'ready'
                                ? 'border-emerald-200/90 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/25'
                                : 'border-amber-200/90 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Stats preview
                              </p>
                              {linkPhase === 'ready' ? (
                                <Badge className="flex w-fit shrink-0 gap-1 border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-400">
                                  <BadgeCheck className="h-3 w-3 shrink-0" aria-hidden />
                                  Passed
                                </Badge>
                              ) : (
                                <span className="rounded-full bg-amber-600/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 dark:bg-amber-400/20 dark:text-amber-100">
                                  Under minimum
                                </span>
                              )}
                            </div>

                            <dl className="grid w-full grid-cols-2 grid-rows-2 gap-2 sm:gap-2.5">
                              <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-background/65 px-4 py-2 dark:bg-black/35">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Views
                                </dt>
                                <dd className="font-display mt-1 text-lg font-extrabold tabular-nums leading-tight text-foreground sm:text-xl">
                                  {formatViews(snapshot.views)}
                                </dd>
                              </div>
                              <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-background/65 px-4 py-2  dark:bg-black/35">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {platform === 'facebook' ? 'Reactions' : 'Likes'}
                                </dt>
                                <dd className="font-display mt-1 text-lg font-extrabold tabular-nums leading-tight text-foreground sm:text-xl">
                                  {formatNumber(snapshot.engagementPrimary)}
                                </dd>
                              </div>
                              <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-background/65 px-4 py-2 dark:bg-black/35">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  {platform === 'facebook' ? 'Engagements' : 'Comments'}
                                </dt>
                                <dd className="font-display mt-1 text-lg font-extrabold tabular-nums leading-tight text-foreground sm:text-xl">
                                  {formatNumber(snapshot.engagementSecondary)}
                                </dd>
                              </div>
                              <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-background/65 px-4 py-2  dark:bg-black/35">
                                <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                  Payout
                                </dt>
                                <dd className="font-display mt-1 text-lg font-extrabold tabular-nums leading-tight text-phc-gradient sm:text-xl">
                                  {/* v1 (post-MVP): payout preview used `tikTokYellowBasket` as third arg to effectiveCreatorRatePer1k */}
                                  {formatPHP(
                                    Math.round(
                                      (snapshot.views / 1_000) *
                                        effectiveCreatorRatePer1k(
                                          creatorRatePer1k,
                                          platform,
                                          false
                                        ) *
                                        100
                                    ) / 100,
                                    { decimals: false }
                                  )}
                                </dd>
                              </div>
                            </dl>
                            {linkPhase === 'below_quota' ? (
                              <p className="mt-2 rounded-lg border border-amber-200/80 bg-white/80 px-3 py-2 text-center text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/50 dark:text-amber-100">
                                {campaignSubmissionBelowMinViewsMessage(snapshot.views)}
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-phc-gradient text-white hover:opacity-90"
                      disabled={
                        submitting ||
                        !hasPayoutMethod ||
                        !platformConnected ||
                        linkPhase !== 'ready'
                      }
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit
                        </>
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              <AddPaymentMethodDialog
                mode="creator"
                useApi
                open={addPaymentOpen}
                onOpenChange={setAddPaymentOpen}
                onSuccess={() => setOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pool spend vs total budget (creator-facing) */}
      <div className="w-full rounded-2xl border border-border bg-card p-5 md:p-6">
        <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <Target className="h-3.5 w-3.5 shrink-0" />
          Campaign Budget
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-display text-lg font-bold tabular-nums text-foreground md:text-3xl">
            {campaign.budget > 0 ? `${budgetProgressPct.toFixed(1)}%` : '—'}
          </p>
          <p className="text-sm font-semibold tabular-nums text-primary sm:text-right">
            {campaign.budget > 0 ? (
              <>
                {formatPHP(campaign.spent, { decimals: false })} /{' '}
                {formatPHP(campaign.budget, { decimals: false })} budget
              </>
            ) : (
              <span className="text-xs font-medium text-muted-foreground">No budget set</span>
            )}
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${budgetProgressPct}%` }}
          />
        </div>
      </div>

      <div
        className="grid min-w-0 gap-4 md:grid-cols-2"
        role="region"
        aria-labelledby="creator-campaign-details-heading"
      >
        <section className="min-w-0 space-y-4 md:space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
          <h3
            id="creator-campaign-details-heading"
            className="wrap-break-word font-display text-2xl font-bold leading-tight tracking-tight"
          >
            {campaign.title}
          </h3>
          <div className="h-px w-full min-w-0 bg-border" aria-hidden />

          <div className="min-w-0 space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Deal terms
            </p>
            <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-muted/25 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="flex min-w-0 items-center gap-3"
                role="group"
                aria-label="Your rate per 1,000 views"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950/45 dark:text-teal-300">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                </div>
                <p className="font-display text-lg font-semibold leading-tight tracking-tight tabular-nums text-foreground">
                  {formatPHP(creatorRatePer1k, { decimals: false })} / 1,000 Views
                </p>
              </div>
            </div>
          </div>

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
            </div>
          </div>

          <div className="min-w-0 space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <div className="max-h-72 overflow-y-auto rounded-2xl border border-border bg-muted/20 px-4 py-3 md:max-h-96">
              <p className="max-w-full min-w-0 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-base">
                {campaign.description}
              </p>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/90 px-4 py-4 dark:border-violet-900/40 dark:bg-violet-950/35 sm:items-center sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-200/80 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="wrap-break-word font-display font-bold text-violet-950 dark:text-violet-50">
                The more engaging your content, the higher your payout.
              </p>
              <p className="mt-0.5 wrap-break-word text-sm leading-snug text-violet-800/90 dark:text-violet-200/90">
                Focus on creativity, authenticity, and high-quality content.
              </p>
            </div>
            <TrendingUp
              className="hidden h-7 w-7 shrink-0 text-violet-600 sm:block dark:text-violet-300"
              aria-hidden
            />
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
                    <span className="shrink-0 font-display font-extrabold text-phc-gradient tabular-nums">
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
                <p className="text-sm font-medium">No asset link yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The brand may add a Drive or Dropbox link for briefing materials.
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
                  <p className="font-semibold">Brand materials</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {campaign.assetUrl.trim()}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            )}

            {(campaign.referenceLinks?.length ?? 0) > 0 ? (
              <div className="mt-6">
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
          </div>
        </section>
      </div>
    </div>
  )
}
