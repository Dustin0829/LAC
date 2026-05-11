import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  CircleDollarSign,
  Clock,
  ExternalLink,
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
import { useContentStore } from '@/lib/stores/contentStore'
import { paymentLogoSrc } from '@/lib/constants/paymentLogos'
import { cn, formatDate, formatPHP, formatViews, formatNumber } from '@/lib/utils'
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
  LivenessBadge,
  RuleCheckBadge,
  YellowBasketBadge,
} from '@/components/ContentTrustBadges'
import {
  brandHeadlineRatePer1k,
  CREATOR_PAYOUT_PERCENT,
  getAvailableBalance,
  getPlatformFeePercent,
  mockMonthlyPayoutBatches,
  PLATFORM_LABEL,
} from '@/lib/mockData'

/** Minimum spendable to publish / keep accepting submissions — docs/06-policies-and-trust.md#launch-policies. */
const PUBLISH_FLOOR = 10_000

const BRAND_REJECT_PRESETS = [
  { id: 'fraud', label: 'Suspicious or fraudulent activity' },
  { id: 'duplicate', label: 'Duplicate or recycled content' },
  { id: 'engagement', label: 'Low engagement or questionable view quality' },
  { id: 'policy', label: 'Policy or brand-safety concern' },
  { id: 'other', label: 'Other' },
] as const

type BrandRejectPresetId = (typeof BRAND_REJECT_PRESETS)[number]['id']

type BrandRejectTarget =
  | { scope: 'monthly-line'; lineId: string }
  | { scope: 'submission'; contentId: string }

const SUBMISSIONS_PAGE_SIZE = 5

type CampaignTab = 'details' | 'submissions' | 'payout' | 'budget'

export default function BrandCampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const campaign = useCampaignsStore((s) => s.campaigns.find((c) => c.id === id))
  const updateCampaign = useCampaignsStore((s) => s.updateCampaign)
  const contents = useContentStore((s) => s.contents)
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('xendit-invoice')
  const [isAddingFunds, setIsAddingFunds] = useState(false)
  const [campaignTab, setCampaignTab] = useState<CampaignTab>('details')
  /** Accrual line id → reject reason for this session (per-batch review). */
  const [monthlyBatchLineRejected, setMonthlyBatchLineRejected] = useState<Record<string, string>>({})
  const [rejectTarget, setRejectTarget] = useState<BrandRejectTarget | null>(null)
  const [rejectPreset, setRejectPreset] = useState<BrandRejectPresetId>('fraud')
  const [rejectOtherDetail, setRejectOtherDetail] = useState('')
  const [refundOpen, setRefundOpen] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  /** Active batch in the release-payouts confirmation modal. */
  const [activeReleaseBatchId, setActiveReleaseBatchId] = useState<string | null>(null)
  const [isConfirmingRelease, setIsConfirmingRelease] = useState(false)
  /** Per-batch confirmed flag (session-only). */
  const [confirmedBatches, setConfirmedBatches] = useState<Record<string, boolean>>({})
  /** Per-batch expanded state in the Payout accordion. */
  const [expandedBatches, setExpandedBatches] = useState<Record<string, boolean>>({})
  /** contentId → reject reason (session-only demo; no separate “approve”). */
  const [submissionRejectReasons, setSubmissionRejectReasons] = useState<Record<string, string>>({})
  const [submissionsPage, setSubmissionsPage] = useState(1)

  useEffect(() => {
    setSubmissionsPage(1)
    setExpandedBatches({})
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
  const submissions = contents.filter((c) => c.campaignId === campaignId)
  const paidOut = campaign.spent
  const payoutBatches = mockMonthlyPayoutBatches
    .filter((p) => p.campaignId === campaign.id)
    .slice()
    .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime())
  const activeReleaseBatch = activeReleaseBatchId
    ? payoutBatches.find((p) => p.id === activeReleaseBatchId) ?? null
    : null

  const submissionsTotalPages = Math.max(1, Math.ceil(submissions.length / SUBMISSIONS_PAGE_SIZE))
  const submissionsSafePage = Math.min(Math.max(1, submissionsPage), submissionsTotalPages)
  const submissionsPageRows = submissions.slice(
    (submissionsSafePage - 1) * SUBMISSIONS_PAGE_SIZE,
    submissionsSafePage * SUBMISSIONS_PAGE_SIZE
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
      budget: campaign.budget + net,
    })
    setIsAddingFunds(false)
    setAddFundsOpen(false)
    setFundAmount('')
    toast.success(
      `${formatPHP(net, { decimals: false })} added to this campaign pool (${formatPHP(amount, { decimals: false })} payment after the platform fee).`
    )
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
    const reserved = latest.reservedBalance ?? 0
    const newBudget = latest.spent + reserved
    updateCampaign(campaignId, {
      budget: newBudget,
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

  function isBatchReleased(batchId: string, baseStatus: string): boolean {
    if (confirmedBatches[batchId]) return true
    return baseStatus === 'released' || baseStatus === 'paid' || baseStatus === 'done'
  }

  function openReleasePayoutsModal(batchId: string) {
    const batch = payoutBatches.find((p) => p.id === batchId)
    if (!batch) return
    if (isBatchReleased(batch.id, batch.status)) return
    setActiveReleaseBatchId(batchId)
  }

  function closeReleasePayoutsModal() {
    setActiveReleaseBatchId(null)
    setIsConfirmingRelease(false)
  }

  async function confirmReleasePayouts() {
    if (!activeReleaseBatch) return
    const payableLines = activeReleaseBatch.lines.filter((l) => !monthlyBatchLineRejected[l.id])
    if (payableLines.length === 0) {
      toast.error('No payable lines — every line was rejected for this batch.')
      return
    }
    setIsConfirmingRelease(true)
    await new Promise((r) => setTimeout(r, 700))
    const total = payableLines.reduce((s, l) => s + l.grossAmount, 0)
    const latest = useCampaignsStore.getState().campaigns.find((c) => c.id === campaignId)
    if (!latest) {
      setIsConfirmingRelease(false)
      return
    }
    const roundedTotal = Math.round(total)
    updateCampaign(campaignId, {
      spent: latest.spent + roundedTotal,
    })
    const batchId = activeReleaseBatch.id
    setConfirmedBatches((prev) => ({ ...prev, [batchId]: true }))
    setIsConfirmingRelease(false)
    setActiveReleaseBatchId(null)
    toast.success(
      `Payout released: ${formatPHP(total, { decimals: false })} for ${payableLines.length} line${payableLines.length === 1 ? '' : 's'}. Disbursements are in flight.`
    )
  }

  function toggleBatchExpanded(batchId: string) {
    setExpandedBatches((prev) => ({ ...prev, [batchId]: !prev[batchId] }))
  }

  function getContentPostUrl(contentId: string): string | undefined {
    return contents.find((c) => c.id === contentId)?.url
  }

  function openRejectForMonthlyLine(lineId: string) {
    setRejectTarget({ scope: 'monthly-line', lineId })
    setRejectPreset('fraud')
    setRejectOtherDetail('')
  }

  function openRejectForSubmission(contentId: string) {
    setRejectTarget({ scope: 'submission', contentId })
    setRejectPreset('fraud')
    setRejectOtherDetail('')
  }

  function resetRejectDialog() {
    setRejectTarget(null)
    setRejectPreset('fraud')
    setRejectOtherDetail('')
  }

  function confirmBrandReject() {
    if (!rejectTarget) return
    let reason: string
    if (rejectPreset === 'other') {
      const detail = rejectOtherDetail.trim()
      if (!detail) {
        toast.error('Please enter a short reason.')
        return
      }
      reason = `Other: ${detail}`
    } else {
      const preset = BRAND_REJECT_PRESETS.find((p) => p.id === rejectPreset)
      reason = preset?.label ?? rejectPreset
    }
    if (rejectTarget.scope === 'monthly-line') {
      setMonthlyBatchLineRejected((prev) => ({ ...prev, [rejectTarget.lineId]: reason }))
      toast.success('Line rejected — excluded from this payout batch.')
    } else {
      setSubmissionRejectReasons((prev) => ({ ...prev, [rejectTarget.contentId]: reason }))
      toast.success('Submission rejected — excluded from pay (demo). In product this notifies the creator.')
    }
    resetRejectDialog()
  }

  function restoreMonthlyBatchLine(lineId: string) {
    setMonthlyBatchLineRejected((prev) => {
      const next = { ...prev }
      delete next[lineId]
      return next
    })
  }

  function restoreSubmission(contentId: string) {
    setSubmissionRejectReasons((prev) => {
      const next = { ...prev }
      delete next[contentId]
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
      <div className="min-w-0 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
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
            {/* <p className="max-w-full min-w-0 wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              {campaign.description}
            </p> */}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pt-1">
            {campaign.status === 'draft' && (
              <Button
                className="bg-phc-gradient font-semibold text-white hover:opacity-90"
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
                <Button className="bg-phc-gradient font-semibold text-white hover:opacity-90">
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
                    {Number(fundAmount) > 0 ? (
                      <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-xs">
                        <div>
                          <p className="text-muted-foreground">Platform fee ({Math.round(platformFeePercent * 100)}%)</p>
                          <p className="font-semibold text-foreground tabular-nums">
                            {formatPHP(Math.round(Number(fundAmount) * platformFeePercent), { decimals: false })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Spendable ({Math.round((1 - platformFeePercent) * 100)}%)</p>
                          <p className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                            +{formatPHP(Math.round(Number(fundAmount) * (1 - platformFeePercent)), { decimals: false })}
                          </p>
                        </div>
                      </div>
                    ) : null}
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
      <div className="w-full rounded-2xl border border-border bg-card p-5 md:p-6">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Target className="h-3.5 w-3.5 shrink-0" /> Estimated reach progress
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-display text-2xl font-extrabold tabular-nums text-foreground md:text-3xl">
            {reachGoal > 0 ? `${reachProgressPct.toFixed(1)}%` : '—'}
          </p>
          <p className="text-sm font-semibold tabular-nums text-blue-600 sm:text-right">
            {reachGoal > 0 ? (
              <>
                {formatNumber(Math.round(campaign.campaignViews))} / {formatNumber(reachGoal)} views
              </>
            ) : (
              <>
                {formatNumber(Math.round(campaign.campaignViews))} views
                <span className="block text-xs font-medium text-muted-foreground">No reach goal set</span>
              </>
            )}
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
        <div className="grid w-full grid-cols-4">
          <button
            type="button"
            role="tab"
            id="campaign-tab-details"
            aria-selected={campaignTab === 'details'}
            onClick={() => setCampaignTab('details')}
            className={cn(
              'relative flex min-h-14 w-full items-center justify-center gap-2 px-2 py-3.5 text-center text-xs font-semibold transition-colors sm:text-sm',
              campaignTab === 'details'
                ? 'text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span className="leading-snug">Details</span>
            {campaignTab === 'details' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-submissions"
            aria-selected={campaignTab === 'submissions'}
            onClick={() => setCampaignTab('submissions')}
            className={cn(
              'relative flex min-h-14 w-full items-center justify-center gap-2 px-2 py-3.5 text-center text-xs font-semibold transition-colors sm:text-sm',
              campaignTab === 'submissions'
                ? 'text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Play className="h-4 w-4 shrink-0" />
            <span className="leading-snug">
              Submissions
              <span className="ml-1 tabular-nums text-[11px] font-medium opacity-80 sm:text-xs">
                ({submissions.length})
              </span>
            </span>
            {campaignTab === 'submissions' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-payout"
            aria-selected={campaignTab === 'payout'}
            onClick={() => setCampaignTab('payout')}
            className={cn(
              'relative flex min-h-14 w-full items-center justify-center gap-2 px-2 py-3.5 text-center text-xs font-semibold transition-colors sm:text-sm',
              campaignTab === 'payout'
                ? 'text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CircleDollarSign className="h-4 w-4 shrink-0" />
            <span className="leading-snug">Payout</span>
            {campaignTab === 'payout' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-budget"
            aria-selected={campaignTab === 'budget'}
            onClick={() => setCampaignTab('budget')}
            className={cn(
              'relative flex min-h-14 w-full items-center justify-center gap-2 px-2 py-3.5 text-center text-xs font-semibold transition-colors sm:text-sm',
              campaignTab === 'budget'
                ? 'text-blue-600'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Wallet className="h-4 w-4 shrink-0" />
            <span className="leading-snug">Budget</span>
            {campaignTab === 'budget' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />
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
          <section className="min-w-0 space-y-6 overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                <Megaphone className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold tracking-tight">Details</h2>
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
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-border bg-card">
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

            {(campaign.referenceLinks?.length ?? 0) > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reference links</p>
                <ul className="mt-3 space-y-2">
                  {campaign.referenceLinks!.map((url, i) => (
                    <li key={`${url}-${i}`}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                      >
                        {url}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

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
      ) : campaignTab === 'budget' ? (
        <div className="space-y-6" role="tabpanel" aria-labelledby="campaign-tab-budget">
          <section className="space-y-6 rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <Wallet className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">Budget</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage funds for this campaign. Every deposit splits {Math.round(platformFeePercent * 100)}% platform fee
                    / {Math.round((1 - platformFeePercent) * 100)}% spendable pool.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                className="shrink-0 bg-phc-gradient font-semibold text-white hover:opacity-90"
                onClick={() => setAddFundsOpen(true)}
              >
                <Plus className="h-4 w-4" /> Add funds
              </Button>
            </div>

            {remaining + reserved < PUBLISH_FLOOR && campaign.status === 'active' ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
                <Pause className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Spendable below publish floor ({formatPHP(PUBLISH_FLOOR, { decimals: false })})
                  </p>
                  <p className="mt-0.5 text-amber-800 dark:text-amber-200/90">
                    New submissions will be auto-paused until you top up. Included lines still settle on next payout.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300">
                  <Wallet className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Total spendable</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
                  {formatPHP(campaign.budget, { decimals: false })}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Net of {Math.round(platformFeePercent * 100)}% platform fee on each deposit
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300">
                  <Wallet className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Available</p>
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

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/45 dark:text-orange-300">
                  <Clock className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Reserved</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
                  {formatPHP(reserved, { decimals: false })}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Included lines pending monthly payout</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/45 dark:text-violet-300">
                  <CircleDollarSign className="h-5 w-5" aria-hidden />
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground">Paid</p>
                <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
                  {formatPHP(paidOut, { decimals: false })}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Released through past monthly batches</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950/45 dark:text-teal-300">
                  <TrendingUp className="h-5 w-5" aria-hidden />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
                  <Lock className="h-3 w-3" /> Locked at publish
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-muted-foreground">Gross rate per 1K views</p>
              <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-foreground">
                {formatPHP(brandHeadlineRatePer1k(campaign), { decimals: false })} / 1K views
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Creators see the default {Math.round(CREATOR_PAYOUT_PERCENT * 100)}% headline net rate. Rate cannot change after
                publish — start a new campaign to adjust.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm text-muted-foreground dark:border-blue-900/50 dark:bg-blue-950/30">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
              <span>
                Submissions count by default. Rejection only happens in the Submissions or Payout tab — it returns reserved
                back to available.
              </span>
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
                  This returns your available balance ({formatPHP(remaining, { decimals: false })}) to your brand
                  wallet in this demo. Paid and reserved amounts stay put. Total budget becomes paid + reserved after this
                  refund.
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
      ) : campaignTab === 'submissions' ? (
        <div className="space-y-6" role="tabpanel" aria-labelledby="campaign-tab-submissions">
          <section className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="font-display text-xl font-extrabold md:text-2xl">Submissions</h2>
              <p className="text-sm text-muted-foreground md:text-base">
                {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} · count by default unless you reject
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/90 px-4 py-3 text-sm text-muted-foreground dark:border-blue-900/50 dark:bg-blue-950/30">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
              <span>
                Stats freeze at submit. Reject a row now to exclude it from pay — reserved returns to available. Soft-flag and
                failing liveness rows still count unless you reject them.
              </span>
            </div>
            {submissions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <p className="font-medium">No submissions yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Creators will start submitting soon.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px] text-sm md:text-base">
                    <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground md:text-sm">
                      <tr>
                        <th className="px-5 py-4 font-medium md:px-6 md:py-4">Creator</th>
                        <th className="px-5 py-4 font-medium md:px-6 md:py-4">Platform</th>
                        <th className="px-5 py-4 font-medium md:px-6 md:py-4">Snapshot views</th>
                        <th className="px-5 py-4 font-medium md:px-6 md:py-4">Earnings</th>
                        <th className="hidden px-5 py-4 font-medium md:table-cell md:px-6 md:py-4">Trust</th>
                        <th className="px-5 py-4 text-right font-medium md:px-6 md:py-4"> </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {submissionsPageRows.map((content) => {
                        const submissionRejected = Boolean(submissionRejectReasons[content.id])
                        return (
                          <tr
                            key={content.id}
                            className={cn(
                              'transition-colors hover:bg-muted/30',
                              submissionRejected ? 'bg-muted/40 opacity-80' : ''
                            )}
                          >
                            <td
                              className={cn(
                                'px-5 py-4 md:px-6 md:py-5',
                                submissionRejected && 'text-muted-foreground'
                              )}
                            >
                              <div className={cn(submissionRejected && 'line-through')}>
                                <p className="font-semibold text-foreground">{content.creatorName}</p>
                                <a
                                  href={content.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm"
                                >
                                  View content <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                </a>
                                {content.hasTikTokYellowBasket ? (
                                  <div className="mt-2">
                                    <YellowBasketBadge />
                                  </div>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-5 py-4 md:px-6 md:py-5">
                              <div
                                className={cn(
                                  'flex justify-center sm:justify-start',
                                  submissionRejected && 'opacity-60'
                                )}
                              >
                                <PlatformIcon platform={content.platform} className="h-7 w-7 md:h-8 md:w-8" />
                              </div>
                            </td>
                            <td
                              className={cn(
                                'px-5 py-4 md:px-6 md:py-5',
                                submissionRejected && 'line-through text-muted-foreground'
                              )}
                            >
                              <p className="font-display text-lg font-bold tabular-nums md:text-xl">
                                {formatViews(content.views)}
                              </p>
                              <p className="text-[11px] text-muted-foreground">Locked at submit</p>
                            </td>
                            <td
                              className={cn(
                                'px-5 py-4 font-display text-lg font-bold tabular-nums text-phc-gradient md:px-6 md:py-5 md:text-xl',
                                submissionRejected && 'line-through opacity-70'
                              )}
                            >
                              {formatPHP(content.earnings, { decimals: false })}
                            </td>
                            <td className="hidden px-5 py-4 md:table-cell md:px-6 md:py-5">
                              <div className="flex flex-col items-start gap-1">
                                {content.ruleCheckResult ? (
                                  <RuleCheckBadge result={content.ruleCheckResult} />
                                ) : null}
                                {content.status !== 'rejected' && content.livenessStatus ? (
                                  <LivenessBadge status={content.livenessStatus} />
                                ) : null}
                                {content.retentionEndAt && content.status !== 'rejected' ? (
                                  <span className="text-[11px] text-muted-foreground">
                                    Retention until {formatDate(content.retentionEndAt)}
                                  </span>
                                ) : null}
                                {content.ruleCheckNote ? (
                                  <span className="max-w-xs text-[11px] text-amber-700 dark:text-amber-300">
                                    {content.ruleCheckNote}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-right md:px-6 md:py-5">
                              <Button
                                type="button"
                                variant={submissionRejected ? 'secondary' : 'outline'}
                                size="sm"
                                className="shrink-0 font-semibold"
                                onClick={() => {
                                  if (submissionRejected) restoreSubmission(content.id)
                                  else openRejectForSubmission(content.id)
                                }}
                              >
                                {submissionRejected ? 'Restore' : 'Reject'}
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
                    pageSize={SUBMISSIONS_PAGE_SIZE}
                    totalItems={submissions.length}
                    onPageChange={setSubmissionsPage}
                  />
                ) : null}
              </div>
            )}
          </section>
        </div>
      ) : campaignTab === 'payout' ? (
        <div className="space-y-4" role="tabpanel" aria-labelledby="campaign-tab-payout">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-xl font-extrabold md:text-2xl">Payout</h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Monthly cadence — Arpify prepares one batch per period. Expand the current period to review the breakdown,
              reject any line you want excluded, then release. Lines you don't reject count by default. Default split is{' '}
              {Math.round(CREATOR_PAYOUT_PERCENT * 100)}/{Math.round((1 - CREATOR_PAYOUT_PERCENT) * 100)} creator / platform
              on gross — TikTok yellow basket lines settle 50/50.
            </p>
          </div>
          {payoutBatches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
              <p className="font-medium">No payout periods yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Arpify generates breakdowns at the end of each cycle.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payoutBatches.map((batch) => {
                const isExpanded = Boolean(expandedBatches[batch.id])
                const isReleased = isBatchReleased(batch.id, batch.status)
                const includedLines = batch.lines.filter((l) => !monthlyBatchLineRejected[l.id])
                const includedTotal = includedLines.reduce((s, l) => s + l.grossAmount, 0)
                return (
                  <section
                    key={batch.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <header className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
                      <button
                        type="button"
                        onClick={() => toggleBatchExpanded(batch.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        aria-expanded={isExpanded}
                        aria-controls={`payout-batch-${batch.id}`}
                      >
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                            isExpanded ? 'rotate-0' : '-rotate-90'
                          )}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="font-display text-base font-extrabold text-foreground sm:text-lg">
                            {batch.periodLabel}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                            {batch.lines.length} {batch.lines.length === 1 ? 'submission' : 'submissions'} ·{' '}
                            <span className="tabular-nums">
                              {formatPHP(includedTotal, { decimals: false })}
                            </span>{' '}
                            {isReleased ? 'released' : 'pending'}
                          </p>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                        {isReleased ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Released
                          </span>
                        ) : (
                          <Button
                            type="button"
                            className="bg-phc-gradient text-white"
                            onClick={() => openReleasePayoutsModal(batch.id)}
                          >
                            Release payout
                          </Button>
                        )}
                      </div>
                    </header>
                    {isExpanded ? (
                      <div
                        id={`payout-batch-${batch.id}`}
                        className="border-t border-border bg-muted/20"
                      >
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[820px] text-sm">
                            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                              <tr>
                                <th className="px-5 py-3 font-medium md:px-6">Creator</th>
                                <th className="px-5 py-3 font-medium md:px-6">Platform</th>
                                <th className="hidden px-5 py-3 font-medium sm:table-cell md:px-6">
                                  Snapshot views
                                </th>
                                <th className="px-5 py-3 font-medium md:px-6">Gross</th>
                                <th className="hidden px-5 py-3 font-medium md:table-cell md:px-6">Creator net</th>
                                <th className="hidden px-5 py-3 font-medium md:table-cell md:px-6">Platform fee</th>
                                <th className="px-5 py-3 text-right font-medium md:px-6"> </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {batch.lines.map((line) => {
                                const lineRejected = Boolean(monthlyBatchLineRejected[line.id])
                                const contentUrl = getContentPostUrl(line.contentId)
                                return (
                                  <tr
                                    key={line.id}
                                    className={cn(
                                      'transition-colors hover:bg-muted/40',
                                      lineRejected ? 'bg-[#FFE0E0]/40 opacity-90' : ''
                                    )}
                                  >
                                    <td className="px-5 py-4 md:px-6">
                                      <div className={cn(lineRejected && 'line-through text-muted-foreground')}>
                                        {contentUrl ? (
                                          <a
                                            href={contentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-2 hover:text-blue-600 hover:underline"
                                          >
                                            {line.creatorName}
                                            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                                          </a>
                                        ) : (
                                          <span className="font-medium">{line.creatorName}</span>
                                        )}
                                        {line.isYellowBasket ? (
                                          <span className="ml-1 inline-flex items-center gap-1 rounded-full border border-yellow-300 bg-yellow-50 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
                                            Yellow basket · 50/50
                                          </span>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td className={cn('px-5 py-4 md:px-6', lineRejected && 'opacity-60')}>
                                      <div className="flex justify-start">
                                        <PlatformIcon platform={line.platform} className="h-7 w-7" />
                                        <span className="sr-only">{PLATFORM_LABEL[line.platform]}</span>
                                      </div>
                                    </td>
                                    <td
                                      className={cn(
                                        'hidden px-5 py-4 font-semibold sm:table-cell md:px-6',
                                        lineRejected && 'line-through text-muted-foreground'
                                      )}
                                    >
                                      {formatViews(line.snapshotViews)}
                                    </td>
                                    <td
                                      className={cn(
                                        'px-5 py-4 font-semibold md:px-6',
                                        lineRejected && 'line-through text-muted-foreground'
                                      )}
                                    >
                                      {formatPHP(line.grossAmount, { decimals: false })}
                                    </td>
                                    <td
                                      className={cn(
                                        'hidden px-5 py-4 font-semibold tabular-nums text-phc-gradient md:table-cell md:px-6',
                                        lineRejected && 'line-through opacity-70'
                                      )}
                                    >
                                      {formatPHP(line.creatorNet, { decimals: false })}
                                    </td>
                                    <td
                                      className={cn(
                                        'hidden px-5 py-4 font-medium tabular-nums text-muted-foreground md:table-cell md:px-6',
                                        lineRejected && 'line-through'
                                      )}
                                    >
                                      {formatPHP(line.platformFee, { decimals: false })}
                                    </td>
                                    <td className="px-5 py-4 text-right md:px-6">
                                      <Button
                                        type="button"
                                        variant={lineRejected ? 'secondary' : 'outline'}
                                        size="sm"
                                        disabled={isReleased}
                                        onClick={() => {
                                          if (isReleased) return
                                          if (lineRejected) restoreMonthlyBatchLine(line.id)
                                          else openRejectForMonthlyLine(line.id)
                                        }}
                                      >
                                        {lineRejected ? 'Restore' : 'Reject'}
                                      </Button>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </section>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      <Dialog
        open={activeReleaseBatchId !== null}
        onOpenChange={(open) => {
          if (!open) closeReleasePayoutsModal()
        }}
      >
        <DialogContent className="flex h-[min(92vh,900px)] max-h-[min(92vh,900px)] w-full max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 pt-6 sm:max-w-5xl sm:pt-8">
          <div className="border-border shrink-0 border-b px-6 py-5 pr-14 sm:px-8 sm:py-6 sm:pr-16">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <DialogHeader className="min-w-0 flex-1 space-y-2 pr-2 text-left">
                <DialogTitle className="font-display text-xl md:text-2xl">Release payout</DialogTitle>
                <DialogDescription className="text-base leading-relaxed">
                  {activeReleaseBatch
                    ? `${activeReleaseBatch.periodLabel}. Releasing disburses included lines below. Rows you rejected are not paid.`
                    : null}
                </DialogDescription>
              </DialogHeader>
              {activeReleaseBatch ? (
                <div className="max-w-full shrink-0 sm:max-w-48 sm:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Total (included only)
                  </p>
                  <p className="font-display text-xl font-extrabold tabular-nums text-foreground md:text-2xl">
                    {formatPHP(
                      activeReleaseBatch.lines
                        .filter((l) => !monthlyBatchLineRejected[l.id])
                        .reduce((s, l) => s + l.grossAmount, 0),
                      { decimals: false }
                    )}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <div className="min-h-0 max-h-[min(55vh,560px)] flex-1 overflow-x-auto overflow-y-auto px-4 pb-4 sm:px-8 sm:pb-5">
            {activeReleaseBatch ? (
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
                      Snapshot views
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
                  {activeReleaseBatch.lines.map((line) => {
                    const lineRejected = Boolean(monthlyBatchLineRejected[line.id])
                    const contentUrl = getContentPostUrl(line.contentId)
                    return (
                      <tr
                        key={line.id}
                        tabIndex={contentUrl ? 0 : undefined}
                        role={contentUrl ? 'link' : undefined}
                        aria-label={contentUrl ? `Open posted content for ${line.creatorName}` : undefined}
                        onClick={() => {
                          if (contentUrl) window.open(contentUrl, '_blank', 'noopener,noreferrer')
                        }}
                        onKeyDown={(e) => {
                          if (!contentUrl) return
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            window.open(contentUrl, '_blank', 'noopener,noreferrer')
                          }
                        }}
                        className={cn(
                          'bg-card transition-colors hover:bg-muted/40',
                          contentUrl &&
                            'cursor-pointer focus-visible:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                          lineRejected && 'bg-muted/50 opacity-80'
                        )}
                      >
                        <td className="px-4 py-4 md:px-5 md:py-4">
                          <div className={cn(lineRejected && 'line-through text-muted-foreground')}>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                              {line.creatorName}
                              {contentUrl ? (
                                <ExternalLink className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 md:px-5 md:py-4">
                          <div className={cn('flex justify-start', lineRejected && 'opacity-60')}>
                            <PlatformIcon platform={line.platform} className="h-7 w-7 md:h-8 md:w-8" />
                          </div>
                        </td>
                        <td
                          className={cn(
                            'px-4 py-4 text-right font-display text-lg font-bold tabular-nums md:px-5 md:py-4 md:text-xl',
                            lineRejected && 'line-through text-muted-foreground'
                          )}
                        >
                          {formatViews(line.snapshotViews)}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-4 text-right font-display text-lg font-bold tabular-nums md:px-5 md:py-4 md:text-xl',
                            lineRejected && 'line-through text-muted-foreground'
                          )}
                        >
                          {formatPHP(line.grossAmount, { decimals: false })}
                        </td>
                        <td className="px-4 py-4 text-right md:px-5 md:py-4">
                          <Button
                            type="button"
                            variant={lineRejected ? 'secondary' : 'outline'}
                            size="sm"
                            className="font-semibold"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (lineRejected) restoreMonthlyBatchLine(line.id)
                              else openRejectForMonthlyLine(line.id)
                            }}
                          >
                            {lineRejected ? 'Restore' : 'Reject'}
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
              onClick={closeReleasePayoutsModal}
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Confirming…
                </>
              ) : (
                'Confirm release'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) resetRejectDialog()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {rejectTarget?.scope === 'monthly-line'
                ? `Reject ${
                    payoutBatches
                      .flatMap((b) => b.lines)
                      .find((l) => l.id === rejectTarget.lineId)?.creatorName ?? 'this creator'
                  } from this batch?`
                : rejectTarget?.scope === 'submission'
                  ? `Reject ${submissions.find((c) => c.id === rejectTarget.contentId)?.creatorName ?? 'this creator'}'s submission?`
                  : 'Reject submission?'}
            </DialogTitle>
            <DialogDescription>
              {rejectTarget?.scope === 'monthly-line'
                ? 'This line will not be paid when you release the payout for this batch. Pick the closest reason.'
                : rejectTarget?.scope === 'submission'
                  ? 'Rejection excludes this content from pay and would notify the creator in product. There is no separate approve step — not rejected means it keeps accruing.'
                  : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {BRAND_REJECT_PRESETS.map((preset) => (
              <label
                key={preset.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  rejectPreset === preset.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <input
                  type="radio"
                  name="brand-reject-reason"
                  className="mt-1 size-4 shrink-0 accent-primary"
                  checked={rejectPreset === preset.id}
                  onChange={() => setRejectPreset(preset.id)}
                />
                <span className="text-sm leading-snug">{preset.label}</span>
              </label>
            ))}
            {rejectPreset === 'other' ? (
              <div className="space-y-1.5 pt-1 pl-1">
                <Label htmlFor="brand-reject-other" className="text-xs text-muted-foreground">
                  Describe the reason
                </Label>
                <Textarea
                  id="brand-reject-other"
                  rows={3}
                  placeholder="Short note for your records (e.g. creator requested removal)."
                  value={rejectOtherDetail}
                  onChange={(e) => setRejectOtherDetail(e.target.value)}
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
                resetRejectDialog()
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmBrandReject}
            >
              Reject (exclude from pay)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
