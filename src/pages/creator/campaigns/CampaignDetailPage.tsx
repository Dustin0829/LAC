import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  ExternalLink,
  Link2,
  Loader2,
  Lock,
  Megaphone,
  Monitor,
  Plug,
  Send,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { useContentStore } from '@/lib/stores/contentStore'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'
import { useAuth } from '@/lib/hooks/use-auth'
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
import { PlatformIcon } from '@/components/PlatformIcon'
import { cn, formatPHP, formatDate, formatNumber, formatViews } from '@/lib/utils'
import { creatorHeadlineRatePer1k, getCampaignReachViewGoal, PLATFORM_LABEL, type Platform } from '@/lib/mockData'

function isValidContentUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname)
  } catch {
    return false
  }
}

// v1 (post-MVP): TikTok Yellow Basket — optional 50% headline-rate factor for commerce posts (not shipped).
// /** 50% vs 80% creator share of gross performance → multiply headline ₱/1k by 5/8 */
// const YELLOW_BASKET_RATE_FACTOR = 0.625

function mockPostViewsForDemoUrl(url: string): number {
  const lower = url.toLowerCase()
  if (lower.includes('demo-low') || lower.includes('lowviews')) return 800
  return 12_400
}

/** Placeholder preview still (replace with thumbnail from oEmbed/API). */
const STATS_PREVIEW_IMAGE_SRC = '/sear-preview.jpg'

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

type LinkValidationPhase = 'idle' | 'validating' | 'ready' | 'below_quota'

type FetchedSnapshot = {
  views: number
  likes: number
  comments: number
}

export default function CreatorCampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const campaignId = id ?? ''
  const campaign = useCampaignsStore((s) =>
    campaignId ? s.campaigns.find((c) => c.id === campaignId) : undefined
  )
  const addContent = useContentStore((s) => s.addContent)
  const platformLinks = useCreatorProfileStore((s) => s.platformLinks)
  const connectPlatform = useCreatorProfileStore((s) => s.connectPlatform)
  const payoutMethods = usePaymentMethodsStore((s) => s.methods)
  const { user } = useAuth()

  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState<Platform>('tiktok')
  // v1 (post-MVP): const [tikTokYellowBasket, setTikTokYellowBasket] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [linkPhase, setLinkPhase] = useState<LinkValidationPhase>('idle')
  const [snapshot, setSnapshot] = useState<FetchedSnapshot | null>(null)
  const validationGenRef = useRef(0)
  const connectedPlatforms = platformLinks
    .filter((link) => link.status === 'connected')
    .map((link) => link.platform)
  const hasPayoutMethod = payoutMethods.length > 0
  const platformConnected = connectedPlatforms.includes(platform)

  const campaignPlatformsKey = campaign?.platforms.slice().sort().join('|') ?? ''

  useEffect(() => {
    if (!campaignId) return
    const c = useCampaignsStore.getState().campaigns.find((x) => x.id === campaignId)
    if (!c) return
    setPlatform((p) => (c.platforms.includes(p) ? p : (c.platforms[0] ?? 'tiktok')))
  }, [campaignId, campaignPlatformsKey])

  if (!campaign) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-lg font-bold">Campaign not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/creator/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    )
  }

  const reachGoal = getCampaignReachViewGoal(campaign)
  const reachProgressPct =
    reachGoal > 0 ? Math.min(100, (campaign.campaignViews / reachGoal) * 100) : 0
  const creatorRatePer1k = creatorHeadlineRatePer1k(campaign)

  const statusVisual = {
    active: { chip: 'border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
    paused: { chip: 'border-amber-200 bg-amber-50 text-amber-900', dot: 'bg-amber-500' },
    ended: { chip: 'border-zinc-200 bg-zinc-50 text-zinc-700', dot: 'bg-zinc-400' },
    draft: { chip: 'border-blue-200 bg-blue-50 text-blue-800', dot: 'bg-blue-500' },
  } as const
  const statusUi = statusVisual[campaign.status]

  function resetSubmitModal() {
    setUrl('')
    // v1 (post-MVP): setTikTokYellowBasket(false)
    setLinkPhase('idle')
    setSnapshot(null)
    setSubmitting(false)
  }

  function handleConnectOnly() {
    connectPlatform(platform)
    toast.success(`${PLATFORM_LABEL[platform]} connected`, {
      description: 'Paste your content link below.',
    })
  }

  /** Debounced validation only while the modal is open (avoid background churn on the detail page). */
  useEffect(() => {
    if (!open || !campaignId) return
    const resolved = useCampaignsStore.getState().campaigns.find((x) => x.id === campaignId)
    if (!resolved) return

    const gen = ++validationGenRef.current
    const trimmed = url.trim()
    const platformsAllowed = resolved.platforms

    if (!trimmed || !hasPayoutMethod || !platformConnected) {
      if (!trimmed) {
        setLinkPhase('idle')
        setSnapshot(null)
      }
      return
    }

    const t = window.setTimeout(() => {
      void (async () => {
        if (gen !== validationGenRef.current) return

        if (!isValidContentUrl(trimmed)) {
          if (gen !== validationGenRef.current) return
          setLinkPhase('idle')
          setSnapshot(null)
          return
        }
        if (!platformsAllowed.includes(platform)) {
          if (gen !== validationGenRef.current) return
          setLinkPhase('idle')
          setSnapshot(null)
          toast.error(`This campaign does not accept ${PLATFORM_LABEL[platform]} content.`)
          return
        }

        setLinkPhase('validating')
        await new Promise((r) => setTimeout(r, 550))
        if (gen !== validationGenRef.current) return

        const views = mockPostViewsForDemoUrl(trimmed)
        const likes = Math.max(0, Math.round(views * 0.032))
        const comments = Math.max(0, Math.round(views * 0.0012))
        const snap: FetchedSnapshot = { views, likes, comments }
        setSnapshot(snap)

        if (views <= 1_000) {
          setLinkPhase('below_quota')
        } else {
          setLinkPhase('ready')
        }
      })()
    }, 550)

    return () => window.clearTimeout(t)
  }, [open, url, platform, campaignId, campaignPlatformsKey, hasPayoutMethod, platformConnected])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || !campaign) return
    if (!hasPayoutMethod) {
      toast.error('Add a payout method in Account before submitting.')
      return
    }
    if (!platformConnected) {
      toast.error(`Connect ${PLATFORM_LABEL[platform]} first.`)
      return
    }
    if (linkPhase !== 'ready' || !snapshot || snapshot.views <= 1_000) {
      toast.error('Wait until stats load and the post is above 1,000 views.')
      return
    }
    if (!isValidContentUrl(url.trim())) {
      toast.error('Paste a full content link starting with https:// (e.g. TikTok or Facebook).')
      return
    }
    if (!campaign.platforms.includes(platform)) {
      toast.error(`This campaign does not accept ${PLATFORM_LABEL[platform]} content.`)
      return
    }
    const rate = effectiveCreatorRatePer1k(creatorRatePer1k, platform, false)
    // v1 (post-MVP): const rate = effectiveCreatorRatePer1k(creatorRatePer1k, platform, tikTokYellowBasket)
    const earnings = Math.round((snapshot.views / 1_000) * rate * 100) / 100
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 500))
    addContent({
      id: `content-${Date.now()}`,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      brandName: campaign.brandName,
      creatorId: 'me',
      creatorName: user?.name ?? 'You',
      url: url.trim(),
      platform,
      // v1 (post-MVP): ...(platform === 'tiktok' ? { hasTikTokYellowBasket: tikTokYellowBasket } : {}),
      views: snapshot.views,
      earnings,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      thumbnailColor: campaign.coverColor,
    })
    toast.success('Content submitted! Brand review comes next.')
    setSubmitting(false)
    setOpen(false)
    resetSubmitModal()
    navigate('/creator/content')
  }

  return (
    <div className="min-w-0 max-w-full space-y-8 rounded-2xl bg-muted/35 px-4 py-6 sm:px-5 sm:py-8 md:-mx-2 md:px-6">
      <div>
        <Link
          to="/creator/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All campaigns
        </Link>
      </div>

      {/* Campaign summary — mirrors brand layout; creators only see Submit */}
      <div className="min-w-0 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize',
                statusUi.chip
              )}
            >
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusUi.dot)} aria-hidden />
              {campaign.status}
            </div>
            <h1 className="min-w-0 wrap-break-word font-display text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
              {campaign.title}
            </h1>
            <p className="max-w-full min-w-0 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-base">
              {campaign.description}
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-4">
              <div className="min-w-0 max-w-full rounded-2xl border border-blue-200/90 bg-linear-to-br from-blue-50/95 to-sky-50/80 px-5 py-4 dark:border-blue-800/60 dark:from-blue-950/50 dark:to-sky-950/40">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                  Your rate
                </p>
                <p className="mt-1.5 font-display text-2xl font-extrabold tabular-nums text-foreground md:text-3xl">
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatPHP(creatorRatePer1k, { decimals: false })}
                  </span>
                  <span className="ml-1 text-base font-semibold text-muted-foreground md:text-lg">
                    / 1K views
                  </span>
                </p>
              </div>
              <div className="max-w-full min-w-0 sm:flex-1 sm:self-center">
                <div className="flex min-w-0 items-start gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" aria-hidden />
                  <span className="min-w-0 wrap-break-word">
                    {campaign.runsUntilGoal ? (
                      <>
                        {formatDate(campaign.startDate)} →{' '}
                        <span className="font-medium text-phc-gradient">Until goal is reached</span>
                      </>
                    ) : (
                      <>
                        {formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pt-1">
            <Dialog
              open={open}
              onOpenChange={(next) => {
                setOpen(next)
                if (!next) resetSubmitModal()
              }}
            >
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="bg-phc-gradient font-semibold text-white hover:opacity-90"
                >
                  <Send className="h-4 w-4" />
                  Submit content
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit content</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  {!hasPayoutMethod ? (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/35 dark:text-amber-50">
                      <p className="font-medium">Payout method required</p>
                      <p className="mt-1 text-xs leading-relaxed opacity-90">
                        Add a default payout route before you can submit content.
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-3">
                        <Link to="/creator/account">Go to account</Link>
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
                        setPlatform(p)
                        // v1 (post-MVP): if (p !== 'tiktok') setTikTokYellowBasket(false)
                        setLinkPhase('idle')
                        setSnapshot(null)
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
                        Connect <strong>{PLATFORM_LABEL[platform]}</strong> (OAuth) before you paste
                        a content link. This is separate from submitting.
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
                          placeholder="https://www.tiktok.com/@you/video/..."
                          value={url}
                          autoFocus
                          onChange={(e) => {
                            setUrl(e.target.value)
                            setLinkPhase('idle')
                            setSnapshot(null)
                          }}
                        />
                      </div>
                      {null /* v1 (post-MVP): TikTok “yellow basket” checkbox lived here (Checkbox + label). */}
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

                          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-stretch">
                            <div className="relative mx-auto aspect-9/16 w-[118px] shrink-0 overflow-hidden rounded-xl bg-muted shadow-sm ring-1 ring-black/6 dark:bg-black/40 dark:ring-white/15 sm:mx-0 sm:w-[128px]">
                              <img
                                src={STATS_PREVIEW_IMAGE_SRC}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => {
                                  const el = e.currentTarget
                                  el.src = '/sear-cover.jpg'
                                }}
                              />
                              <div className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/95 p-0.5 shadow-sm ring-1 ring-black/10 dark:bg-background/90 dark:ring-white/10">
                                <PlatformIcon platform={platform} className="h-[18px] w-[18px]" />
                              </div>
                            </div>

                            <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
                              <dl className="grid h-full min-h-54 w-full grid-cols-2 grid-rows-2 gap-2 sm:min-h-[calc(128px*16/9)] sm:flex-1 sm:gap-2.5">
                                <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-background/65 px-2.5 py-2 dark:bg-black/35">
                                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Views
                                  </dt>
                                  <dd className="font-display mt-1 text-lg font-extrabold tabular-nums leading-tight text-foreground sm:text-xl">
                                    {formatViews(snapshot.views)}
                                  </dd>
                                </div>
                                <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-background/65 px-2.5 py-2  dark:bg-black/35">
                                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Likes
                                  </dt>
                                  <dd className="font-display mt-1 text-lg font-extrabold tabular-nums leading-tight text-foreground sm:text-xl">
                                    {formatNumber(snapshot.likes)}
                                  </dd>
                                </div>
                                <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-background/65 px-2.5 py-2 dark:bg-black/35">
                                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Comments
                                  </dt>
                                  <dd className="font-display mt-1 text-lg font-extrabold tabular-nums leading-tight text-foreground sm:text-xl">
                                    {formatNumber(snapshot.comments)}
                                  </dd>
                                </div>
                                <div className="flex min-h-0 flex-col justify-center rounded-lg border border-border bg-background/65 px-2.5 py-2  dark:bg-black/35">
                                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                    Est. payout
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
                                  This post needs more than 1,000 views to submit for this campaign.
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-phc-gradient text-white hover:opacity-90"
                    disabled={
                      submitting || !hasPayoutMethod || !platformConnected || linkPhase !== 'ready'
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
          </div>
        </div>
      </div>

      {/* Estimated reach — same pattern as brand */}
      <div className="min-w-0 w-full rounded-2xl border border-border bg-card p-5 md:p-6">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Target className="h-3.5 w-3.5 shrink-0" /> Estimated reach progress
        </p>
        <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="min-w-0 font-display text-2xl font-extrabold tabular-nums text-foreground md:text-3xl">
            {reachGoal > 0 ? `${reachProgressPct.toFixed(1)}%` : '—'}
          </p>
          <p className="min-w-0 wrap-break-word text-sm font-semibold tabular-nums text-blue-600 sm:max-w-sm sm:text-right">
            {reachGoal > 0 ? (
              <>
                {formatNumber(Math.round(campaign.campaignViews))} / {formatNumber(reachGoal)} views
              </>
            ) : (
              <>
                {formatNumber(Math.round(campaign.campaignViews))} views
                <span className="block text-xs font-medium text-muted-foreground">
                  No reach goal set
                </span>
              </>
            )}
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${reachProgressPct}%` }}
          />
        </div>
      </div>

      <div
        className="grid min-w-0 gap-6 md:grid-cols-2"
        role="region"
        aria-label="Campaign details and rules"
      >
        <section className="min-w-0 space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
              <Megaphone className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-extrabold tracking-tight">
                Campaign details
              </h2>
              <p className="mt-1 wrap-break-word text-sm leading-relaxed text-muted-foreground">
                Where you can post content for this campaign.
              </p>
            </div>
          </div>
          <div className="h-px w-full min-w-0 bg-border" aria-hidden />

          <div className="min-w-0 space-y-2">
            <h3 className="wrap-break-word font-display text-xl font-extrabold leading-tight tracking-tight md:text-2xl">
              {campaign.title}
            </h3>
            <p className="max-w-full min-w-0 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-base">
              {campaign.description}
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-border/80 bg-muted/25 px-4 py-5 md:px-5">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                  <Monitor className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-extrabold text-foreground">Platforms</p>
                  <p className="mt-0.5 wrap-break-word text-xs text-muted-foreground">
                    Where your content can be posted.
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 shrink-0 flex-wrap items-end gap-5 sm:justify-end">
                {campaign.platforms.map((p) => (
                  <div key={p} className="flex flex-col items-center gap-1.5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                      <PlatformIcon platform={p} className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {PLATFORM_LABEL[p]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/90 px-4 py-4 dark:border-violet-900/40 dark:bg-violet-950/35 sm:items-center sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-200/80 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="wrap-break-word font-display font-extrabold text-violet-950 dark:text-violet-50">
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
            <div className="flex min-w-0 gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Shield className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold tracking-tight">
                  Rules &amp; assets
                </h2>
              </div>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold',
                campaign.assetUrl?.trim()
                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border-border bg-muted/50 text-muted-foreground'
              )}
            >
              {campaign.assetUrl?.trim() ? 'Link added' : 'No link'}
            </span>
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
                  <p className="font-semibold">Creator asset link</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {campaign.assetUrl.trim()}
                  </p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            )}

            {campaign.sampleUrl ? (
              <a
                href={campaign.sampleUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3 transition-colors hover:bg-muted"
              >
                <span className="min-w-0 wrap-break-word font-medium">
                  Sample reference content
                </span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ) : null}
          </div>
        </section>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground sm:text-sm">
        <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="min-w-0 wrap-break-word">
          Only approved creators can view and participate in this campaign.
        </span>
      </div>
    </div>
  )
}
