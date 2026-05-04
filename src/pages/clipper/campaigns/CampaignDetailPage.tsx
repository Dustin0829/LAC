import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Download,
  Wallet,
  ExternalLink,
  FileText,
  CheckCircle2,
  Send,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { useClipsStore } from '@/lib/stores/clipsStore'
import { useAuth } from '@/lib/hooks/useAuth'
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
import { formatPHP, formatDate } from '@/lib/utils'
import { getPlatformFeePercent, NICHE_LABEL, PLATFORM_LABEL, type Platform } from '@/lib/mockData'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ClipperCampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const campaign = useCampaignsStore((s) => s.campaigns.find((c) => c.id === id))
  const addClip = useClipsStore((s) => s.addClip)
  const { user } = useAuth()

  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [platform, setPlatform] = useState<Platform>('tiktok')
  const [submitting, setSubmitting] = useState(false)

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

  const platformFeePercent = campaign.platformFeePercent ?? getPlatformFeePercent(campaign.budget)
  const payoutPool = Math.max(0, campaign.budget - campaign.budget * platformFeePercent)
  const remaining = Math.max(0, payoutPool - campaign.spent)
  const progressPct = payoutPool > 0 ? Math.min(100, (campaign.spent / payoutPool) * 100) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() || !campaign) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 600))
    addClip({
      id: `clip-${Date.now()}`,
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      brandName: campaign.brandName,
      clipperId: user?.id ?? 'me',
      clipperName: user?.name ?? 'You',
      url: url.trim(),
      platform,
      views: 0,
      earnings: 0,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      thumbnailColor: campaign.coverColor,
    })
    toast.success('Clip submitted! We’ll start tracking views.')
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
              <p className="text-xs uppercase tracking-widest opacity-80">Rate</p>
              <p className="font-display text-2xl font-extrabold">
                {formatPHP(campaign.ratePer1k, { decimals: false })}
                <span className="text-sm font-medium opacity-80"> / 1K views</span>
              </p>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur border border-white/20 px-5 py-3">
              <p className="text-xs uppercase tracking-widest opacity-80">Payout cap</p>
              <p className="font-display text-2xl font-extrabold">No cap</p>
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
                      {(['tiktok', 'youtube', 'instagram', 'facebook'] as const).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PLATFORM_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                  We&apos;ll review your clip and start tracking views once approved. Payout happens
                  automatically based on verified views.
                </div>
                <Button
                  type="submit"
                  className="w-full bg-phc-gradient text-white hover:opacity-90"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit clip'}
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
            <Wallet className="h-3.5 w-3.5" /> Payout pool remaining
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold">
            {formatPHP(remaining, { decimals: false })}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-phc-gradient" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {progressPct.toFixed(0)}% of {formatPHP(payoutPool, { decimals: false })} used
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Window
          </p>
          <p className="mt-2 font-display text-base font-bold">
            {formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-extrabold">Rules</h2>
            <ul className="mt-4 space-y-3">
              {campaign.rules.map((rule) => (
                <li key={rule} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
                  <span className="text-sm">{rule}</span>
                </li>
              ))}
            </ul>
          </section>

          {(campaign.assets?.length || campaign.assetUrl || campaign.sampleUrl) && (
            <section className="rounded-3xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-extrabold">Assets & resources</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use these brand-provided files when making your clips.
              </p>
              <div className="mt-4 space-y-3">
                {campaign.assets?.map((asset) => (
                  <a
                    key={asset.id}
                    href={asset.url}
                    download={asset.name}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{asset.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {asset.type || 'File'} · {formatBytes(asset.size)}
                      </p>
                    </div>
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </a>
                ))}
                {campaign.assetUrl && (
                  <a
                    href={campaign.assetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <span className="font-medium">Source / raw footage</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
                {campaign.sampleUrl && (
                  <a
                    href={campaign.sampleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 hover:bg-muted transition-colors"
                  >
                    <span className="font-medium">Sample winning clip</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-extrabold">Platforms</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {campaign.platforms.map((p) => (
                <Badge key={p} className="bg-foreground text-background">
                  {PLATFORM_LABEL[p]}
                </Badge>
              ))}
            </div>
          </section>
          <section className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-base font-extrabold">Niche</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {campaign.niches.map((n) => (
                <Badge key={n} variant="secondary">
                  {NICHE_LABEL[n]}
                </Badge>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
