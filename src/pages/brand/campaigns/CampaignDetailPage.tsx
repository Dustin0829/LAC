import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Link2,
  Loader2,
  Plus,
  Pause,
  Play,
  ExternalLink,
  Target,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { useClipsStore } from '@/lib/stores/clipsStore'
import { paymentLogoSrc } from '@/lib/constants/paymentLogos'
import { formatPHP, formatViews, formatTimeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClipStatusBadge } from '@/components/ClipStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import {
  brandHeadlineRatePer1k,
  getAvailableBalance,
  getPlatformFeePercent,
  mockWeeklyPayoutPackages,
  NICHE_LABEL,
  PLATFORM_LABEL,
} from '@/lib/mockData'

const WEEKLY_PAYOUT_EXCLUDE_PRESETS = [
  { id: 'fraud', label: 'Suspicious or fraudulent activity' },
  { id: 'duplicate', label: 'Duplicate or recycled content' },
  { id: 'engagement', label: 'Low engagement or questionable view quality' },
  { id: 'policy', label: 'Policy or brand-safety concern' },
  { id: 'other', label: 'Other' },
] as const

type WeeklyExcludePresetId = (typeof WEEKLY_PAYOUT_EXCLUDE_PRESETS)[number]['id']

export default function BrandCampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const campaign = useCampaignsStore((s) => s.campaigns.find((c) => c.id === id))
  const updateCampaign = useCampaignsStore((s) => s.updateCampaign)
  const clips = useClipsStore((s) => s.clips)
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('xendit-invoice')
  const [isAddingFunds, setIsAddingFunds] = useState(false)
  const [campaignTab, setCampaignTab] = useState<'details' | 'funds' | 'clips'>('details')
  /** lineId → human-readable exclude reason (for this session / demo). */
  const [weeklyPayoutExcluded, setWeeklyPayoutExcluded] = useState<Record<string, string>>({})
  const [weeklyExcludeDialogOpen, setWeeklyExcludeDialogOpen] = useState(false)
  const [weeklyExcludeLineId, setWeeklyExcludeLineId] = useState<string | null>(null)
  const [weeklyExcludePreset, setWeeklyExcludePreset] = useState<WeeklyExcludePresetId>('fraud')
  const [weeklyExcludeOther, setWeeklyExcludeOther] = useState('')

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-lg font-bold">Campaign not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/brand/campaigns">Back to campaigns</Link>
        </Button>
      </div>
    )
  }

  const campaignId = campaign.id
  const platformFeePercent = campaign.platformFeePercent ?? getPlatformFeePercent()
  const remaining = getAvailableBalance(campaign)
  const reserved = campaign.reservedBalance ?? 0
  const reachGoal = Math.max(0, campaign.estimatedReach)
  const reachProgressPct =
    reachGoal > 0 ? Math.min(100, (campaign.campaignViews / reachGoal) * 100) : 0
  const submissions = clips.filter((c) => c.campaignId === campaignId)
  const totalViews = submissions.reduce((s, c) => s + c.views, 0)
  const weeklyPackage = mockWeeklyPayoutPackages.find((p) => p.campaignId === campaign.id)

  function togglePause() {
    if (!campaign) return
    const next = campaign.status === 'paused' ? 'active' : 'paused'
    updateCampaign(campaignId, { status: next })
    toast.success(next === 'paused' ? 'Campaign paused' : 'Campaign resumed')
  }

  async function handleAddFunds(e: React.FormEvent) {
    e.preventDefault()
    if (!campaign) return

    const amount = Number(fundAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Enter a valid amount to add.')
      return
    }

    setIsAddingFunds(true)
    await new Promise((resolve) => setTimeout(resolve, 650))
    const net = Math.round(amount * (1 - platformFeePercent))
    updateCampaign(campaignId, {
      budget: campaign.budget + amount,
      availableBalance: remaining + net,
    })
    setIsAddingFunds(false)
    setAddFundsOpen(false)
    setFundAmount('')
    toast.success(`${formatPHP(amount, { decimals: false })} added to this campaign.`)
  }

  function handlePublish() {
    if (remaining + reserved < 10_000) {
      toast.error('Campaign needs at least ₱10,000 net spendable to publish.')
      return
    }
    updateCampaign(campaignId, { status: 'active' })
    toast.success('Campaign published for creators.')
  }

  function handleReleasePackage() {
    toast.success('Weekly package released. Demo payouts are now in flight.')
  }

  function getClipPostUrl(clipId: string): string | undefined {
    return clips.find((c) => c.id === clipId)?.url
  }

  function openWeeklyExcludeDialog(lineId: string) {
    setWeeklyExcludeLineId(lineId)
    setWeeklyExcludePreset('fraud')
    setWeeklyExcludeOther('')
    setWeeklyExcludeDialogOpen(true)
  }

  function resetWeeklyExcludeDialog() {
    setWeeklyExcludeLineId(null)
    setWeeklyExcludePreset('fraud')
    setWeeklyExcludeOther('')
  }

  function confirmWeeklyExclude() {
    if (!weeklyExcludeLineId) return
    if (weeklyExcludePreset === 'other') {
      const detail = weeklyExcludeOther.trim()
      if (!detail) {
        toast.error('Please enter a short reason.')
        return
      }
      setWeeklyPayoutExcluded((prev) => ({ ...prev, [weeklyExcludeLineId]: `Other: ${detail}` }))
    } else {
      const preset = WEEKLY_PAYOUT_EXCLUDE_PRESETS.find((p) => p.id === weeklyExcludePreset)
      const label = preset?.label ?? weeklyExcludePreset
      setWeeklyPayoutExcluded((prev) => ({ ...prev, [weeklyExcludeLineId]: label }))
    }
    setWeeklyExcludeDialogOpen(false)
    resetWeeklyExcludeDialog()
    toast.success('Line excluded from this payout run.')
  }

  function includeWeeklyPayoutLine(lineId: string) {
    setWeeklyPayoutExcluded((prev) => {
      const next = { ...prev }
      delete next[lineId]
      return next
    })
  }

  function openPayoutLineVideo(clipId: string) {
    const url = getClipPostUrl(clipId)
    if (!url) {
      toast.error('No video link found for this clip.')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/brand/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All campaigns
        </Link>
      </div>

      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-linear-to-br ${campaign.coverColor} text-white p-8 md:p-10`}
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
        <div className="relative flex flex-col md:flex-row md:items-end gap-6">
          <div className="flex-1">
            <Badge className="capitalize bg-white/15 backdrop-blur border-white/20 text-white">
              {campaign.status}
            </Badge>
            <h1 className="mt-4 font-display text-3xl md:text-4xl font-extrabold leading-tight">
              {campaign.title}
            </h1>
            <p className="mt-2 max-w-2xl text-white/90">{campaign.description}</p>
          </div>
          <div className="flex gap-2">
            {campaign.status === 'draft' && (
              <Button
                className="bg-white text-gray-900 hover:bg-white/90 font-bold"
                onClick={handlePublish}
              >
                <Play className="h-4 w-4" /> Publish
              </Button>
            )}
            <Button
              variant="outline"
              className="bg-white/15 backdrop-blur border-white/30 text-white hover:bg-white/25"
              onClick={togglePause}
            >
              {campaign.status === 'paused' ? (
                <>
                  <Play className="h-4 w-4" /> Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" /> Pause
                </>
              )}
            </Button>
            <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-gray-900 hover:bg-white/90 font-bold">
                  <Plus className="h-4 w-4" /> Add funds
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add funds to campaign</DialogTitle>
                  <DialogDescription>
                    Funds will be added after payment confirmation.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddFunds} className="space-y-4">
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Current campaign balance</p>
                    <p className="mt-1 font-display text-2xl font-extrabold">
                      {formatPHP(remaining, { decimals: false })}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fund-amount">Amount to add (₱)</Label>
                    <Input
                      id="fund-amount"
                      type="number"
                      min="1"
                      inputMode="decimal"
                      placeholder="10000"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Payment method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddFundsOpen(false)}
                      disabled={isAddingFunds}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-phc-gradient text-white hover:opacity-90"
                      disabled={isAddingFunds}
                    >
                      {isAddingFunds ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing
                        </>
                      ) : (
                        'Confirm add funds'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Estimated reach — full width */}
      <div className="w-full rounded-2xl border border-border bg-card p-5 md:p-6">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" /> Estimated reach progress
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-display text-2xl md:text-3xl font-extrabold tabular-nums">
            {formatViews(campaign.campaignViews)}
          </p>
          <p className="text-sm text-muted-foreground tabular-nums sm:text-right">
            {reachProgressPct.toFixed(0)}% of {reachGoal > 0 ? formatViews(reachGoal) : '—'} estimated reach
          </p>
        </div>
        <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-phc-gradient" style={{ width: `${reachProgressPct}%` }} />
        </div>
      </div>

      <div
        className="flex flex-col gap-1 rounded-2xl border border-border bg-muted/60 p-1 sm:flex-row"
        role="tablist"
        aria-label="Campaign sections"
      >
        <button
          type="button"
          role="tab"
          id="campaign-tab-details"
          aria-selected={campaignTab === 'details'}
          onClick={() => setCampaignTab('details')}
          className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
            campaignTab === 'details'
              ? 'bg-phc-gradient text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Campaign details
        </button>
        <button
          type="button"
          role="tab"
          id="campaign-tab-funds"
          aria-selected={campaignTab === 'funds'}
          onClick={() => setCampaignTab('funds')}
          className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
            campaignTab === 'funds'
              ? 'bg-phc-gradient text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Campaign funds
        </button>
        <button
          type="button"
          role="tab"
          id="campaign-tab-clips"
          aria-selected={campaignTab === 'clips'}
          onClick={() => setCampaignTab('clips')}
          className={`min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
            campaignTab === 'clips'
              ? 'bg-phc-gradient text-white shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Submitted clips
          <span className="ml-1.5 tabular-nums text-xs font-medium opacity-80">({submissions.length})</span>
        </button>
      </div>

      {campaignTab === 'details' ? (
        <div
          className="grid gap-6 md:grid-cols-2"
          role="tabpanel"
          aria-labelledby="campaign-tab-details"
        >
          <section className="rounded-3xl border border-border bg-card p-6 space-y-6">
            <div>
              <h2 className="font-display text-xl font-extrabold">Platforms &amp; niches</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Where creators can post and what categories this campaign targets.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Platforms</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {campaign.platforms.map((p) => (
                  <Badge key={p} className="bg-foreground text-background px-3 py-1">
                    {PLATFORM_LABEL[p]}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Content niches</p>
              {campaign.niches.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {campaign.niches.map((n) => (
                    <Badge key={n} variant="secondary" className="px-3 py-1">
                      {NICHE_LABEL[n]}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No niches set for this campaign.</p>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold">Rules &amp; assets</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Requirements for creators and the shared link to brand materials.
                </p>
              </div>
              <Badge variant="secondary">{campaign.assetUrl?.trim() ? 'Link added' : 'No link'}</Badge>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Campaign rules</p>
              {campaign.rules.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {campaign.rules.map((rule, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm leading-relaxed"
                    >
                      <span className="font-display font-extrabold text-phc-gradient tabular-nums">{i + 1}.</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No rules added for this campaign.</p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Campaign assets</p>
              <p className="mt-1 text-xs text-muted-foreground">Link only — no uploaded files are listed here.</p>
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
                  className="mt-3 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
                    <Link2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">Creator asset link</p>
                    <p className="truncate text-xs text-muted-foreground">{campaign.assetUrl.trim()}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              )}
            </div>
          </section>
        </div>
      ) : campaignTab === 'funds' ? (
        <div className="space-y-6" role="tabpanel" aria-labelledby="campaign-tab-funds">
          <div>
            <h2 className="font-display text-xl font-extrabold">Campaign funds</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Budget, balances, and your gross rate per 1K views.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Total brand budget</p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {formatPHP(campaign.budget, { decimals: false })}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Available balance</p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {formatPHP(remaining, { decimals: false })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Refundable if not reserved</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Reserved</p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {formatPHP(reserved, { decimals: false })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Pending weekly payout lines</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Gross rate</p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {formatPHP(brandHeadlineRatePer1k(campaign), { decimals: false })} / 1K views
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs text-muted-foreground">Verified views (submissions)</p>
              <p className="mt-2 font-display text-2xl font-extrabold">{formatViews(totalViews)}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8" role="tabpanel" aria-labelledby="campaign-tab-clips">
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Weekly payout summary
                </p>
                <h2 className="mt-1 font-display text-xl font-extrabold">
                  {weeklyPackage?.periodLabel ?? 'No package this period'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {weeklyPackage
                    ? 'Review the review cue for flagged lines before releasing. Earnings reflect verified view deltas for this period.'
                    : 'When there is accrual ready for review, a weekly summary with line items will show here.'}
                </p>
              </div>
              <Button
                className="bg-phc-gradient text-white disabled:opacity-60"
                onClick={handleReleasePackage}
                disabled={!weeklyPackage}
              >
                Release payouts
              </Button>
            </div>
            {weeklyPackage ? (
              <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Creator</th>
                      <th className="px-5 py-3 font-medium hidden md:table-cell">Delta views</th>
                      <th className="px-5 py-3 font-medium">Earnings</th>
                      <th className="px-5 py-3 font-medium hidden lg:table-cell">Review cue</th>
                      <th className="px-5 py-3 font-medium text-right"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {weeklyPackage.lines.map((line) => {
                      const excluded = Boolean(weeklyPayoutExcluded[line.id])
                      return (
                        <tr
                          key={line.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open video for ${line.creatorName}`}
                          onClick={() => openPayoutLineVideo(line.clipId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              openPayoutLineVideo(line.clipId)
                            }
                          }}
                          className={`cursor-pointer transition-colors hover:bg-muted/50 ${excluded ? 'bg-[#FFE0E0]/50 opacity-90' : ''}`}
                        >
                          <td className="px-5 py-4">
                            <div className={`flex items-center gap-3 ${excluded ? 'line-through text-muted-foreground' : ''}`}>
                              <PlatformIcon platform={line.platform} className="h-8 w-8" />
                              <div>
                                <p className="font-medium">{line.creatorName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatViews(line.openingViews)} → {formatViews(line.verifiedAtCutoff)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className={`px-5 py-4 hidden md:table-cell font-semibold ${excluded ? 'line-through text-muted-foreground' : ''}`}>
                            {formatViews(line.deltaViews)}
                          </td>
                          <td className={`px-5 py-4 font-semibold ${excluded ? 'line-through text-muted-foreground' : ''}`}>
                            {formatPHP(line.grossAccrual, { decimals: false })}
                          </td>
                          <td className={`px-5 py-4 hidden lg:table-cell text-xs text-muted-foreground ${excluded ? 'line-through' : ''}`}>
                            {line.flag ?? 'Clean'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              type="button"
                              variant={excluded ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (excluded) includeWeeklyPayoutLine(line.id)
                                else openWeeklyExcludeDialog(line.id)
                              }}
                            >
                              {excluded ? 'Include' : 'Exclude'}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
                <p className="text-sm text-muted-foreground">No payout lines to review for this campaign yet.</p>
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-extrabold">Submitted clips</h2>
              <p className="text-sm text-muted-foreground">{submissions.length} clips</p>
            </div>
            {submissions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <p className="font-medium">No submissions yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Creators will start submitting soon.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 font-medium">Creator</th>
                      <th className="px-5 py-3 font-medium hidden md:table-cell">Submitted</th>
                      <th className="px-5 py-3 font-medium">Views</th>
                      <th className="px-5 py-3 font-medium">Earnings</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {submissions.map((clip) => (
                      <tr key={clip.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <PlatformIcon platform={clip.platform} className="h-9 w-9" />
                            <div>
                              <p className="font-medium">{clip.clipperName}</p>
                              <a
                                href={clip.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                              >
                                View clip <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell text-muted-foreground">
                          {formatTimeAgo(clip.submittedAt)}
                        </td>
                        <td className="px-5 py-4 font-display font-bold">{formatViews(clip.views)}</td>
                        <td className="px-5 py-4 font-display font-bold text-phc-gradient">
                          {formatPHP(clip.earnings, { decimals: false })}
                        </td>
                        <td className="px-5 py-4">
                          <ClipStatusBadge status={clip.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      <Dialog
        open={weeklyExcludeDialogOpen}
        onOpenChange={(open) => {
          setWeeklyExcludeDialogOpen(open)
          if (!open) resetWeeklyExcludeDialog()
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Exclude{' '}
              {weeklyPackage?.lines.find((l) => l.id === weeklyExcludeLineId)?.creatorName ?? 'this creator'}{' '}
              from payout?
            </DialogTitle>
            <DialogDescription>
              This accrual line won&apos;t be included when you release payouts for {weeklyPackage?.periodLabel ?? 'this period'}.
              Pick the closest reason; your team can expand this list later in product settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {WEEKLY_PAYOUT_EXCLUDE_PRESETS.map((preset) => (
              <label
                key={preset.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  weeklyExcludePreset === preset.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="weekly-exclude-reason"
                  className="mt-1 size-4 shrink-0 accent-primary"
                  checked={weeklyExcludePreset === preset.id}
                  onChange={() => setWeeklyExcludePreset(preset.id)}
                />
                <span className="text-sm leading-snug">{preset.label}</span>
              </label>
            ))}
            {weeklyExcludePreset === 'other' ? (
              <div className="space-y-1.5 pt-1 pl-1">
                <Label htmlFor="weekly-exclude-other" className="text-xs text-muted-foreground">
                  Describe the reason
                </Label>
                <Textarea
                  id="weekly-exclude-other"
                  rows={3}
                  placeholder="Short note for your records (e.g. creator requested removal)."
                  value={weeklyExcludeOther}
                  onChange={(e) => setWeeklyExcludeOther(e.target.value)}
                  className="resize-none"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setWeeklyExcludeDialogOpen(false)
                resetWeeklyExcludeDialog()
              }}
            >
              Cancel
            </Button>
            <Button type="button" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmWeeklyExclude}>
              Exclude from payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
