import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Link2,
  Loader2,
  Lock,
  Megaphone,
  Monitor,
  Send,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { useClipsStore } from '@/lib/stores/clipsStore'
import { useCreatorProfileStore } from '@/lib/stores/creatorProfileStore'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { cn, formatPHP, formatDate, formatNumber } from '@/lib/utils'
import {
  creatorHeadlineRatePer1k,
  PLATFORM_LABEL,
  type Platform,
} from '@/lib/mockData'

function isValidClipUrl(value: string): boolean {
  try {
    const u = new URL(value)
    return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname)
  } catch {
    return false
  }
}

export default function ClipperCampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const campaign = useCampaignsStore((s) => s.campaigns.find((c) => c.id === id))
  const addClip = useClipsStore((s) => s.addClip)
  const platformLinks = useCreatorProfileStore((s) => s.platformLinks)
  const connectPlatform = useCreatorProfileStore((s) => s.connectPlatform)
  const { user } = useAuth()

  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState<Platform>('tiktok')
  const [submitting, setSubmitting] = useState(false)
  const connectedPlatforms = platformLinks
    .filter((link) => link.status === 'connected')
    .map((link) => link.platform)

  if (!campaign) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-lg font-bold">Campaign not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/clipper/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    )
  }

  const reachGoal = Math.max(0, campaign.estimatedReach)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || !campaign) return
    if (!isValidClipUrl(url.trim())) {
      toast.error('Paste a full clip link starting with https:// (e.g. TikTok or Facebook).')
      return
    }
    if (!campaign.platforms.includes(platform)) {
      toast.error(`This campaign does not accept ${PLATFORM_LABEL[platform]} clips.`)
      return
    }
    if (!connectedPlatforms.includes(platform)) {
      connectPlatform(platform)
      toast.success(`${PLATFORM_LABEL[platform]} connected for future submissions.`)
    }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    addClip({
      id: `clip-${Date.now()}`,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      brandName: campaign.brandName,
      clipperId: 'me',
      clipperName: user?.name ?? 'You',
      url: url.trim(),
      platform,
      views: 0,
      viewsPaidThrough: 0,
      deltaViews: 0,
      earnings: 0,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      thumbnailColor: campaign.coverColor,
    })
    toast.success('Clip submitted! Brand review comes first, then verified views can accrue.')
    setSubmitting(false)
    setOpen(false)
    setUrl('')
    navigate('/clipper/clips')
  }

  return (
    <div className="min-w-0 max-w-full space-y-8 rounded-2xl bg-muted/35 px-4 py-6 sm:px-5 sm:py-8 md:-mx-2 md:px-6">
      <div>
        <Link
          to="/clipper/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All campaigns
        </Link>
      </div>

      {/* Campaign summary — mirrors brand layout; creators only see Submit */}
      <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
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
            <p className="max-w-full min-w-0 wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              {campaign.description}
            </p>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-4">
              <div className="min-w-0 max-w-full rounded-2xl border-2 border-blue-200/90 bg-linear-to-br from-blue-50/95 to-sky-50/80 px-5 py-4 shadow-sm dark:border-blue-800/60 dark:from-blue-950/50 dark:to-sky-950/40">
                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300">
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
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-phc-gradient font-semibold text-white shadow-sm hover:opacity-90">
                  <Send className="h-4 w-4" />
                  Submit clip
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit a clip</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="clip-url">Clip URL</Label>
                    <Input
                      id="clip-url"
                      placeholder="https://www.tiktok.com/@you/video/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {campaign.platforms.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PLATFORM_LABEL[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                    {connectedPlatforms.includes(platform)
                      ? `${PLATFORM_LABEL[platform]} is already connected on your profile, so this submit reuses it.`
                      : `Demo will connect ${PLATFORM_LABEL[platform]} once, save it on your profile, and reuse it next time.`}{' '}
                    Brand review happens before verified views accrue.
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-phc-gradient text-white hover:opacity-90"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : connectedPlatforms.includes(platform) ? (
                      'Submit clip'
                    ) : (
                      `Connect ${PLATFORM_LABEL[platform]} & submit`
                    )}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Estimated reach — same pattern as brand */}
      <div className="min-w-0 w-full rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Target className="h-3.5 w-3.5 shrink-0" /> Estimated reach progress
        </p>
        <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="min-w-0 font-display text-2xl font-extrabold tabular-nums text-foreground md:text-3xl">
            {formatNumber(Math.round(campaign.campaignViews))}
          </p>
          <p className="min-w-0 wrap-break-word text-sm font-semibold tabular-nums text-blue-600 sm:max-w-[min(100%,24rem)] sm:text-right">
            {reachProgressPct.toFixed(1)}% of {reachGoal > 0 ? formatNumber(reachGoal) : '—'} estimated reach
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-700 ease-out"
            style={{ width: `${reachProgressPct}%` }}
          />
        </div>
      </div>

      <div
        className="grid min-w-0 gap-6 md:grid-cols-2"
        role="region"
        aria-label="Campaign details and rules"
      >
        <section className="min-w-0 space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
              <Megaphone className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-extrabold tracking-tight">Campaign details</h2>
              <p className="mt-1 wrap-break-word text-sm leading-relaxed text-muted-foreground">
                Where you can post clips for this campaign.
              </p>
            </div>
          </div>
          <div className="h-px w-full min-w-0 bg-border" aria-hidden />

          <div className="min-w-0 space-y-2">
            <h3 className="wrap-break-word font-display text-xl font-extrabold leading-tight tracking-tight md:text-2xl">
              {campaign.title}
            </h3>
            <p className="max-w-full min-w-0 wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-[15px]">
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
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm">
                      <PlatformIcon platform={p} className="h-7 w-7" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground">{PLATFORM_LABEL[p]}</span>
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
                Focus on creativity, authenticity, and high-quality clips.
              </p>
            </div>
            <TrendingUp
              className="hidden h-7 w-7 shrink-0 text-violet-600 sm:block dark:text-violet-300"
              aria-hidden
            />
          </div>
        </section>

        <section className="min-w-0 space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Shield className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold tracking-tight">Rules &amp; assets</h2>
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
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Campaign rules</p>
            {campaign.rules.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {campaign.rules.map((rule, i) => (
                  <li
                    key={i}
                    className="flex min-w-0 gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed"
                  >
                    <span className="shrink-0 font-display font-extrabold text-phc-gradient tabular-nums">{i + 1}.</span>
                    <span className="min-w-0 wrap-break-word">{rule}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No rules added for this campaign.</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Campaign assets</p>

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
                  <p className="truncate text-xs text-muted-foreground">{campaign.assetUrl.trim()}</p>
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
                <span className="min-w-0 wrap-break-word font-medium">Sample reference clip</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ) : null}
          </div>
        </section>
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground sm:text-sm">
        <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span className="min-w-0 wrap-break-word">Only approved creators can view and participate in this campaign.</span>
      </div>
    </div>
  )
}
