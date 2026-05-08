import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Clock,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  Megaphone,
  Monitor,
  Pause,
  Play,
  Plus,
  Shield,
  Sparkles,
  Lock,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { useClipsStore } from '@/lib/stores/clipsStore'
import { paymentLogoSrc } from '@/lib/constants/paymentLogos'
import { cn, formatPHP, formatViews, formatNumber } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { PlatformIcon } from '@/components/PlatformIcon'
import { TablePagination } from '@/components/TablePagination'
import {
  brandHeadlineRatePer1k,
  getAvailableBalance,
  getPlatformFeePercent,
  mockWeeklyPayoutPackages,
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

const WEEKLY_PAYOUT_TABLE_PAGE_SIZE = 5
const SUBMITTED_CLIPS_PAGE_SIZE = 5

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
  const [refundOpen, setRefundOpen] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const [releasePayoutsModalOpen, setReleasePayoutsModalOpen] = useState(false)
  const [isConfirmingRelease, setIsConfirmingRelease] = useState(false)
  const [weeklyPayoutsReleased, setWeeklyPayoutsReleased] = useState(false)
  /** Submission rows excluded from brand view (session-only demo). */
  const [submissionExcluded, setSubmissionExcluded] = useState<Record<string, boolean>>({})
  const [weeklyPayoutPage, setWeeklyPayoutPage] = useState(1)
  const [submissionsPage, setSubmissionsPage] = useState(1)

  useEffect(() => {
    setWeeklyPayoutPage(1)
    setSubmissionsPage(1)
  }, [id])

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

  const weeklyLinesAll = weeklyPackage?.lines ?? []
  const weeklyPayoutTotalPages = Math.max(1, Math.ceil(weeklyLinesAll.length / WEEKLY_PAYOUT_TABLE_PAGE_SIZE))
  const weeklyPayoutSafePage = Math.min(Math.max(1, weeklyPayoutPage), weeklyPayoutTotalPages)
  const weeklyLinesPage = weeklyLinesAll.slice(
    (weeklyPayoutSafePage - 1) * WEEKLY_PAYOUT_TABLE_PAGE_SIZE,
    weeklyPayoutSafePage * WEEKLY_PAYOUT_TABLE_PAGE_SIZE
  )

  const submissionsTotalPages = Math.max(1, Math.ceil(submissions.length / SUBMITTED_CLIPS_PAGE_SIZE))
  const submissionsSafePage = Math.min(Math.max(1, submissionsPage), submissionsTotalPages)
  const submissionsPageRows = submissions.slice(
    (submissionsSafePage - 1) * SUBMITTED_CLIPS_PAGE_SIZE,
    submissionsSafePage * SUBMITTED_CLIPS_PAGE_SIZE
  )

  const statusVisual = {
    active: { chip: 'border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
    paused: { chip: 'border-amber-200 bg-amber-50 text-amber-900', dot: 'bg-amber-500' },
    ended: { chip: 'border-zinc-200 bg-zinc-50 text-zinc-700', dot: 'bg-zinc-400' },
    draft: { chip: 'border-blue-200 bg-blue-50 text-blue-800', dot: 'bg-blue-500' },
  } as const
  const statusUi = statusVisual[campaign.status]

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

  async function confirmRefundAvailable() {
    const latest = useCampaignsStore.getState().campaigns.find((c) => c.id === campaignId)
    if (!latest) return
    const net = getAvailableBalance(latest)
    if (net <= 0) {
      toast.error('There is no available balance to refund.')
      setRefundOpen(false)
      return
    }
    setIsRefunding(true)
    await new Promise((r) => setTimeout(r, 600))
    const fee = latest.platformFeePercent ?? getPlatformFeePercent()
    const grossReduction = Math.max(1, Math.round(net / (1 - fee)))
    const newBudget = Math.max(0, latest.budget - grossReduction)
    updateCampaign(campaignId, {
      budget: newBudget,
      availableBalance: 0,
    })
    setIsRefunding(false)
    setRefundOpen(false)
    toast.success(
      `${formatPHP(net, { decimals: false })} available balance refunded. Budget updated to ${formatPHP(newBudget, { decimals: false })}.`
    )
  }

  function handlePublish() {
    if (remaining + reserved < 10_000) {
      toast.error('Campaign needs at least ₱10,000 net spendable to publish.')
      return
    }
    updateCampaign(campaignId, { status: 'active' })
    toast.success('Campaign published for creators.')
  }

  function openReleasePayoutsModal() {
    if (!weeklyPackage || weeklyPayoutsReleased) return
    setReleasePayoutsModalOpen(true)
  }

  async function confirmReleasePayouts() {
    if (!weeklyPackage) return
    const payableLines = weeklyPackage.lines.filter((l) => !weeklyPayoutExcluded[l.id])
    if (payableLines.length === 0) {
      toast.error('No payable lines — all creators are excluded from this run.')
      return
    }
    setIsConfirmingRelease(true)
    await new Promise((r) => setTimeout(r, 700))
    const total = payableLines.reduce((s, l) => s + l.grossAccrual, 0)
    const latest = useCampaignsStore.getState().campaigns.find((c) => c.id === campaignId)
    if (!latest) {
      setIsConfirmingRelease(false)
      return
    }
    const prevAvail = getAvailableBalance(latest)
    const roundedTotal = Math.round(total)
    updateCampaign(campaignId, {
      spent: latest.spent + roundedTotal,
      availableBalance: Math.max(0, prevAvail - roundedTotal),
    })
    setIsConfirmingRelease(false)
    setReleasePayoutsModalOpen(false)
    setWeeklyPayoutsReleased(true)
    toast.success(
      `Released ${formatPHP(total, { decimals: false })} for ${payableLines.length} clip${payableLines.length === 1 ? '' : 's'}. Payouts are in flight.`
    )
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

  function toggleSubmissionExcluded(clipId: string) {
    setSubmissionExcluded((prev) => {
      const next = { ...prev }
      if (next[clipId]) delete next[clipId]
      else next[clipId] = true
      return next
    })
  }

  return (
    <div className="min-w-0 max-w-full space-y-8 rounded-2xl bg-muted/35 px-4 py-6 sm:px-5 sm:py-8 md:-mx-2 md:px-6">
      <div>
        <Link
          to="/brand/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All campaigns
        </Link>
      </div>

      {/* Campaign summary */}
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
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pt-1">
            {campaign.status === 'draft' && (
              <Button
                className="bg-phc-gradient font-semibold text-white shadow-sm hover:opacity-90"
                onClick={handlePublish}
              >
                <Play className="h-4 w-4" /> Publish
              </Button>
            )}
            <Button
              variant="outline"
              className="border-2 font-semibold"
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
                <Button className="bg-phc-gradient font-semibold text-white shadow-sm hover:opacity-90">
                  <Plus className="h-4 w-4" /> Add funds
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
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

      {/* Estimated reach */}
      <div className="w-full rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Target className="h-3.5 w-3.5 shrink-0" /> Estimated reach progress
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-display text-2xl font-extrabold tabular-nums text-foreground md:text-3xl">
            {formatNumber(Math.round(campaign.campaignViews))}
          </p>
          <p className="text-sm font-semibold tabular-nums text-blue-600 sm:text-right">
            {reachProgressPct.toFixed(1)}% of{' '}
            {reachGoal > 0 ? formatNumber(reachGoal) : '—'} estimated reach
          </p>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width] duration-700 ease-out"
            style={{ width: `${reachProgressPct}%` }}
          />
        </div>
      </div>

      <div className="min-w-0 border-b border-border" role="tablist" aria-label="Campaign sections">
        <div className="-mx-1 flex gap-0.5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:justify-center sm:gap-1 sm:overflow-x-visible sm:px-0">
          <button
            type="button"
            role="tab"
            id="campaign-tab-details"
            aria-selected={campaignTab === 'details'}
            onClick={() => setCampaignTab('details')}
            className={cn(
              'relative flex shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3 py-3.5 text-sm font-semibold transition-colors sm:px-4',
              campaignTab === 'details'
                ? 'text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span>Campaign details</span>
            {campaignTab === 'details' ? (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-600 sm:left-4 sm:right-4" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-funds"
            aria-selected={campaignTab === 'funds'}
            onClick={() => setCampaignTab('funds')}
            className={cn(
              'relative flex shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3 py-3.5 text-sm font-semibold transition-colors sm:px-4',
              campaignTab === 'funds'
                ? 'text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Wallet className="h-4 w-4 shrink-0" />
            <span>Campaign funds</span>
            {campaignTab === 'funds' ? (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-600 sm:left-4 sm:right-4" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-clips"
            aria-selected={campaignTab === 'clips'}
            onClick={() => setCampaignTab('clips')}
            className={cn(
              'relative flex shrink-0 items-center justify-center gap-2 whitespace-nowrap px-3 py-3.5 text-sm font-semibold transition-colors sm:px-4',
              campaignTab === 'clips'
                ? 'text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Play className="h-4 w-4 shrink-0" />
            <span>
              Submitted clips
              <span className="ml-1 tabular-nums text-xs font-medium opacity-80">
                ({submissions.length})
              </span>
            </span>
            {campaignTab === 'clips' ? (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-blue-600 sm:left-4 sm:right-4" />
            ) : null}
          </button>
        </div>
      </div>

      {campaignTab === 'details' ? (
        <div
          className="grid min-w-0 gap-6 md:grid-cols-2"
          role="tabpanel"
          aria-labelledby="campaign-tab-details"
        >
          <section className="min-w-0 space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                <Megaphone className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold tracking-tight">Campaign details</h2>
                <p className="mt-1 wrap-break-word text-sm text-muted-foreground leading-relaxed">
                  Where creators can post for this campaign.
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
                      <span className="text-[11px] font-semibold text-muted-foreground">
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
                      <span className="shrink-0 font-display font-extrabold text-phc-gradient tabular-nums">
                        {i + 1}.
                      </span>
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
          <section className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                <Wallet className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">Campaign funds</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Budget, balances, and your gross rate per 1K views.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300">
                  <Wallet className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Total brand budget</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
                  {formatPHP(campaign.budget, { decimals: false })}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300">
                  <Wallet className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Available balance</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
                  {formatPHP(remaining, { decimals: false })}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Refundable if not reserved</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full border-blue-200 font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/40 sm:w-auto"
                  disabled={remaining <= 0}
                  onClick={() => setRefundOpen(true)}
                >
                  Refund available balance
                </Button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/45 dark:text-orange-300">
                  <Clock className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Reserved</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
                  {formatPHP(reserved, { decimals: false })}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Pending weekly payout lines</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:col-span-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/45 dark:text-violet-300">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Gross rate</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
                  {formatPHP(brandHeadlineRatePer1k(campaign), { decimals: false })} / 1K views
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:col-span-2 lg:col-span-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950/45 dark:text-sky-300">
                  <Eye className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Verified views (submissions)</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
                  {formatViews(totalViews)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm text-muted-foreground dark:border-blue-900/50 dark:bg-blue-950/30">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
              <span>Only approved creators can view and participate in this campaign.</span>
            </div>
          </section>

          <Dialog
            open={refundOpen}
            onOpenChange={(open) => {
              setRefundOpen(open)
              if (!open) setIsRefunding(false)
            }}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Refund available balance?</DialogTitle>
                <DialogDescription>
                  This returns your full net spendable balance ({formatPHP(remaining, { decimals: false })}) to your
                  brand wallet in this demo. Reserved funds and amounts already paid out are not included. Total brand
                  budget will be reduced by the gross portion that funded this pool (after intake fee).
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setRefundOpen(false)} disabled={isRefunding}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-blue-600 text-white hover:bg-blue-600/90"
                  disabled={isRefunding || remaining <= 0}
                  onClick={() => void confirmRefundAvailable()}
                >
                  {isRefunding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Processing
                    </>
                  ) : (
                    `Refund ${formatPHP(remaining, { decimals: false })}`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                    ? 'Earnings reflect verified view deltas for this period. Double-check line items, then release when you are ready.'
                    : 'When there is accrual ready for review, a weekly summary with line items will show here.'}
                </p>
                {weeklyPayoutsReleased ? (
                  <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Payouts released for this period.
                  </p>
                ) : null}
              </div>
              <Button
                className="bg-phc-gradient text-white disabled:opacity-60"
                onClick={openReleasePayoutsModal}
                disabled={!weeklyPackage || weeklyPayoutsReleased}
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
                      <th className="px-5 py-3 font-medium">Platform</th>
                      <th className="px-5 py-3 font-medium hidden sm:table-cell">Delta views</th>
                      <th className="px-5 py-3 font-medium">Earnings</th>
                      <th className="px-5 py-3 font-medium text-right"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {weeklyLinesPage.map((line) => {
                      const excluded = Boolean(weeklyPayoutExcluded[line.id])
                      const clipUrl = getClipPostUrl(line.clipId)
                      return (
                        <tr
                          key={line.id}
                          className={cn(
                            'transition-colors hover:bg-muted/50',
                            excluded ? 'bg-[#FFE0E0]/50 opacity-90' : ''
                          )}
                        >
                          <td className="px-5 py-4">
                            <div className={cn(excluded && 'line-through text-muted-foreground')}>
                              {clipUrl ? (
                                <a
                                  href={clipUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-foreground underline-offset-2 hover:text-blue-600 hover:underline inline-flex items-center gap-1"
                                >
                                  {line.creatorName}
                                  <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                                </a>
                              ) : (
                                <span className="font-medium">{line.creatorName}</span>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatViews(line.openingViews)} → {formatViews(line.verifiedAtCutoff)}
                              </p>
                            </div>
                          </td>
                          <td className={cn('px-5 py-4 md:px-6 md:py-5', excluded && 'opacity-60')}>
                            <div className="flex justify-start">
                              <PlatformIcon platform={line.platform} className="h-7 w-7 md:h-8 md:w-8" />
                              <span className="sr-only">{PLATFORM_LABEL[line.platform]}</span>
                            </div>
                          </td>
                          <td
                            className={cn(
                              'px-5 py-4 hidden sm:table-cell font-semibold',
                              excluded && 'line-through text-muted-foreground'
                            )}
                          >
                            {formatViews(line.deltaViews)}
                          </td>
                          <td
                            className={cn('px-5 py-4 font-semibold', excluded && 'line-through text-muted-foreground')}
                          >
                            {formatPHP(line.grossAccrual, { decimals: false })}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              type="button"
                              variant={excluded ? 'secondary' : 'outline'}
                              size="sm"
                              onClick={() => {
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
                {weeklyLinesAll.length > 0 ? (
                  <TablePagination
                    className="border-border border-t bg-muted/30 px-4 py-3 md:px-5"
                    page={weeklyPayoutPage}
                    pageSize={WEEKLY_PAYOUT_TABLE_PAGE_SIZE}
                    totalItems={weeklyLinesAll.length}
                    onPageChange={setWeeklyPayoutPage}
                  />
                ) : null}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
                <p className="text-sm text-muted-foreground">No payout lines to review for this campaign yet.</p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="font-display text-xl font-extrabold md:text-2xl">Submitted clips</h2>
              <p className="text-sm text-muted-foreground md:text-base">{submissions.length} clips</p>
            </div>
            {submissions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <p className="font-medium">No submissions yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Creators will start submitting soon.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm md:text-base">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground md:text-sm">
                      <tr>
                        <th className="px-5 py-4 font-medium md:px-6 md:py-4">Creator</th>
                        <th className="px-5 py-4 font-medium md:px-6 md:py-4">Platform</th>
                        <th className="px-5 py-4 font-medium md:px-6 md:py-4">Views</th>
                        <th className="px-5 py-4 font-medium md:px-6 md:py-4">Earnings</th>
                        <th className="px-5 py-4 text-right font-medium md:px-6 md:py-4"> </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {submissionsPageRows.map((clip) => {
                        const excluded = Boolean(submissionExcluded[clip.id])
                        return (
                          <tr
                            key={clip.id}
                            className={cn(
                              'transition-colors hover:bg-muted/30',
                              excluded ? 'bg-muted/40 opacity-80' : ''
                            )}
                          >
                            <td className={cn('px-5 py-4 md:px-6 md:py-5', excluded && 'text-muted-foreground')}>
                              <div className={cn(excluded && 'line-through')}>
                                <p className="font-semibold text-foreground">{clip.clipperName}</p>
                                <a
                                  href={clip.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
                                >
                                  View clip <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                </a>
                              </div>
                            </td>
                            <td className="px-5 py-4 md:px-6 md:py-5">
                              <div className={cn('flex justify-center sm:justify-start', excluded && 'opacity-60')}>
                                <PlatformIcon platform={clip.platform} className="h-7 w-7 md:h-8 md:w-8" />
                              </div>
                            </td>
                            <td
                              className={cn(
                                'px-5 py-4 font-display text-lg font-bold tabular-nums md:px-6 md:py-5 md:text-xl',
                                excluded && 'line-through text-muted-foreground'
                              )}
                            >
                              {formatViews(clip.views)}
                            </td>
                            <td
                              className={cn(
                                'px-5 py-4 font-display text-lg font-bold tabular-nums text-phc-gradient md:px-6 md:py-5 md:text-xl',
                                excluded && 'line-through opacity-70'
                              )}
                            >
                              {formatPHP(clip.earnings, { decimals: false })}
                            </td>
                            <td className="px-5 py-4 text-right md:px-6 md:py-5">
                              <Button
                                type="button"
                                variant={excluded ? 'secondary' : 'outline'}
                                size="sm"
                                className="shrink-0 font-semibold"
                                onClick={() => toggleSubmissionExcluded(clip.id)}
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
                {submissions.length > 0 ? (
                  <TablePagination
                    className="border-border border-t bg-muted/30 px-4 py-3 md:px-6"
                    page={submissionsPage}
                    pageSize={SUBMITTED_CLIPS_PAGE_SIZE}
                    totalItems={submissions.length}
                    onPageChange={setSubmissionsPage}
                  />
                ) : null}
              </div>
            )}
          </section>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground sm:text-sm">
        <Lock className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
        <span>Only approved creators can view and participate in this campaign.</span>
      </div>

      <Dialog
        open={releasePayoutsModalOpen}
        onOpenChange={(open) => {
          setReleasePayoutsModalOpen(open)
          if (!open) setIsConfirmingRelease(false)
        }}
      >
        <DialogContent className="flex h-[min(92vh,900px)] max-h-[min(92vh,900px)] w-full max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 pt-6 sm:max-w-5xl sm:pt-8">
          <div className="border-border shrink-0 border-b px-6 py-5 pr-14 sm:px-8 sm:py-6 sm:pr-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <DialogHeader className="min-w-0 flex-1 space-y-2 pr-2 text-left">
                <DialogTitle className="font-display text-xl md:text-2xl">Release payouts</DialogTitle>
                <DialogDescription className="text-base leading-relaxed">
                  {weeklyPackage
                    ? `${weeklyPackage.periodLabel}. Confirming pays all creators listed below. Rows marked excluded are not paid.`
                    : null}
                </DialogDescription>
              </DialogHeader>
              {weeklyPackage ? (
                <div className="max-w-full shrink-0 sm:max-w-48 sm:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Total (included only)
                  </p>
                  <p className="font-display text-xl font-extrabold tabular-nums text-foreground md:text-2xl">
                    {formatPHP(
                      weeklyPackage.lines
                        .filter((l) => !weeklyPayoutExcluded[l.id])
                        .reduce((s, l) => s + l.grossAccrual, 0),
                      { decimals: false }
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <div className="min-h-0 max-h-[min(55vh,560px)] flex-1 overflow-x-auto overflow-y-auto px-4 pb-4 sm:px-8 sm:pb-5">
            {weeklyPackage ? (
              <table className="w-full min-w-[720px] border-collapse text-sm md:text-base">
                <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground md:text-sm">
                  <tr>
                    <th className="sticky top-0 z-10 align-top border-b border-border bg-muted px-4 py-3 font-semibold md:px-5 md:py-3.5">
                      Creator
                    </th>
                    <th className="sticky top-0 z-10 align-top border-b border-border bg-muted px-4 py-3 font-semibold md:px-5 md:py-3.5">
                      Platform
                    </th>
                    <th className="sticky top-0 z-10 align-top border-b border-border bg-muted px-4 py-3 text-right font-semibold md:px-5 md:py-3.5">
                      Views
                    </th>
                    <th className="sticky top-0 z-10 align-top border-b border-border bg-muted px-4 py-3 text-right font-semibold md:px-5 md:py-3.5">
                      Earnings
                    </th>
                    <th className="sticky top-0 z-10 align-top border-b border-border bg-muted px-4 py-3 text-right font-semibold md:px-5 md:py-3.5">
                      {' '}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {weeklyPackage.lines.map((line) => {
                    const excluded = Boolean(weeklyPayoutExcluded[line.id])
                    const clipUrl = getClipPostUrl(line.clipId)
                    return (
                      <tr
                        key={line.id}
                        tabIndex={clipUrl ? 0 : undefined}
                        role={clipUrl ? 'link' : undefined}
                        aria-label={clipUrl ? `Open posted clip for ${line.creatorName}` : undefined}
                        onClick={() => {
                          if (clipUrl) window.open(clipUrl, '_blank', 'noopener,noreferrer')
                        }}
                        onKeyDown={(e) => {
                          if (!clipUrl) return
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            window.open(clipUrl, '_blank', 'noopener,noreferrer')
                          }
                        }}
                        className={cn(
                          'bg-card transition-colors hover:bg-muted/40',
                          clipUrl && 'cursor-pointer focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          excluded && 'bg-muted/50 opacity-80'
                        )}
                      >
                        <td className="px-4 py-4 md:px-5 md:py-4">
                          <div className={cn(excluded && 'line-through text-muted-foreground')}>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                              {line.creatorName}
                              {clipUrl ? (
                                <ExternalLink className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                              ) : null}
                            </span>
                            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                              {formatViews(line.openingViews)} → {formatViews(line.verifiedAtCutoff)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 md:px-5 md:py-4">
                          <div className={cn('flex justify-start', excluded && 'opacity-60')}>
                            <PlatformIcon platform={line.platform} className="h-7 w-7 md:h-8 md:w-8" />
                          </div>
                        </td>
                        <td
                          className={cn(
                            'px-4 py-4 text-right font-display text-lg font-bold tabular-nums md:px-5 md:py-4 md:text-xl',
                            excluded && 'line-through text-muted-foreground'
                          )}
                        >
                          {formatViews(line.verifiedAtCutoff)}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-4 text-right font-display text-lg font-bold tabular-nums md:px-5 md:py-4 md:text-xl',
                            excluded && 'line-through text-muted-foreground'
                          )}
                        >
                          {formatPHP(line.grossAccrual, { decimals: false })}
                        </td>
                        <td className="px-4 py-4 text-right md:px-5 md:py-4">
                          <Button
                            type="button"
                            variant={excluded ? 'secondary' : 'outline'}
                            size="sm"
                            className="font-semibold"
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
            ) : null}
          </div>
          <DialogFooter className="gap-2 border-border shrink-0 border-t px-6 py-5 sm:gap-3 sm:px-8">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="font-semibold"
              onClick={() => setReleasePayoutsModalOpen(false)}
              disabled={isConfirmingRelease}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="lg"
              className="bg-blue-600 font-semibold text-white hover:bg-blue-600/90"
              disabled={isConfirmingRelease}
              onClick={() => void confirmReleasePayouts()}
            >
              {isConfirmingRelease ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Releasing…
                </>
              ) : (
                'Confirm release'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={weeklyExcludeDialogOpen}
        onOpenChange={(open) => {
          setWeeklyExcludeDialogOpen(open)
          if (!open) resetWeeklyExcludeDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
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
