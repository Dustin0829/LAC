import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Eye,
  ExternalLink,
  CheckCircle2,
  Link2,
  Send,
  Loader2,
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
import { Badge } from '@/components/ui/badge'
import { formatPHP, formatDate, formatViews } from '@/lib/utils'
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
      <div className="text-center py-20">
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
    <div className="space-y-8">
      <div>
        <Link
          to="/clipper/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All campaigns
        </Link>
      </div>

      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${campaign.coverColor} text-white p-8 md:p-12`}
      >
        {campaign.coverImageUrl ? (
          <img
            src={campaign.coverImageUrl}
            alt={campaign.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.3),transparent_60%)]" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/45 to-black/20" />
        <div className="relative max-w-3xl">
          <div className="flex items-center gap-3">
            {campaign.brandLogoUrl ? (
              <img
                src={campaign.brandLogoUrl}
                alt={`${campaign.brandName} logo`}
                className="h-12 w-12 rounded-2xl object-cover shadow-lg ring-2 ring-white/40"
              />
            ) : (
              <div
                className={`h-12 w-12 rounded-2xl bg-linear-to-br ${campaign.brandLogoColor} text-white flex items-center justify-center font-display font-extrabold text-lg shadow-lg ring-2 ring-white/40`}
              >
                {campaign.brandName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm font-medium opacity-90 uppercase tracking-widest">{campaign.brandName}</p>
              <Badge className="mt-1 capitalize bg-white/15 backdrop-blur border-white/20 text-white">
                {campaign.status}
              </Badge>
            </div>
          </div>
          <h1 className="mt-6 font-display text-3xl md:text-5xl font-extrabold leading-tight">
            {campaign.title}
          </h1>
          <p className="mt-4 max-w-2xl text-white/90">{campaign.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 px-5 py-3">
              <p className="text-xs uppercase tracking-widest opacity-80">Your rate</p>
              <p className="font-display text-2xl font-extrabold">
                {formatPHP(creatorRatePer1k, { decimals: false })}
                <span className="text-sm font-medium opacity-80"> / 1K views</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 px-5 py-3">
              <p className="text-xs uppercase tracking-widest opacity-80">Platforms</p>
              <p className="font-display text-lg font-extrabold">
                {campaign.platforms.map((p) => PLATFORM_LABEL[p]).join(' / ')}
              </p>
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="mt-8 bg-white text-gray-900 hover:bg-white/90 font-bold"
              >
                <Send className="h-4 w-4" />
                Submit clip
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
                    : `Demo will connect ${PLATFORM_LABEL[platform]} once, save it on your profile, and reuse it next time.`}
                  {' '}Brand review happens before verified views accrue.
                </div>
                <Button
                  type="submit"
                  className="w-full bg-phc-gradient text-white hover:opacity-90"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : connectedPlatforms.includes(platform) ? 'Submit clip' : `Connect ${PLATFORM_LABEL[platform]} & submit`}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" /> Estimated reach progress
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold">{formatViews(campaign.campaignViews)}</p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-phc-gradient" style={{ width: `${reachProgressPct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {reachProgressPct.toFixed(0)}% of {reachGoal > 0 ? formatViews(reachGoal) : '—'} estimated reach
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Window
          </p>
          <p className="mt-2 font-display text-base font-bold">
            {campaign.runsUntilGoal ? (
              <>
                {formatDate(campaign.startDate)} →{' '}
                <span className="text-phc-gradient">Until goal is reached</span>
              </>
            ) : (
              <>
                {formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="font-display text-xl font-extrabold">Platforms</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Where you can post clips for this campaign.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Enabled platforms</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {campaign.platforms.map((p) => (
                <Badge key={p} className="bg-foreground text-background">
                  {PLATFORM_LABEL[p]}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 space-y-6">
          <div>
            <h2 className="font-display text-xl font-extrabold">Rules &amp; assets</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              What to follow when clipping, plus the brand&apos;s shared link for materials.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rules</p>
            <ul className="mt-3 space-y-3">
              {campaign.rules.map((rule) => (
                <li key={rule} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <span className="text-sm">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assets</p>
            <p className="mt-1 text-xs text-muted-foreground">Link only — the brand shares a folder URL; individual files aren&apos;t listed here.</p>
            <div className="mt-3 space-y-3">
              {campaign.assetUrl?.trim() ? (
                <a
                  href={campaign.assetUrl.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Brand asset link</p>
                    <p className="truncate text-xs text-muted-foreground">{campaign.assetUrl.trim()}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              ) : null}
              {campaign.sampleUrl ? (
                <a
                  href={campaign.sampleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 transition-colors hover:bg-muted"
                >
                  <span className="font-medium">Sample reference clip</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ) : null}
              {!campaign.assetUrl?.trim() && !campaign.sampleUrl ? (
                <p className="text-sm text-muted-foreground">No asset link from the brand for this campaign yet.</p>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
