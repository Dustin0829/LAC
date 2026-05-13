import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  CircleDollarSign,
  Clock,
  ExternalLink,
  Link2,
  Loader2,
  Monitor,
  Pause,
  PencilLine,
  Play,
  Plus,
  Send,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Undo2,
  Wallet,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { useContentStore } from '@/lib/stores/contentStore'
import {
  brandReviewStatusForBadge,
  cn,
  creatorSocialHrefOrPost,
  formatPHP,
  formatViews,
  formatNumber,
} from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { IntegerInput } from '@/components/ui/integer-input'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PersonAvatar } from '@/components/PersonAvatar'
import { PlatformCell, PlatformIcon } from '@/components/PlatformIcon'
import { TablePagination } from '@/components/TablePagination'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  brandHeadlineRatePer1k,
  getAvailableBalance,
  getCreatorRatePer1k,
  getPlatformFeePercent,
  getPlannedGrossBudgetForFunding,
  MIN_GROSS_CAMPAIGN_BUDGET,
  mockMonthlyPayoutBatches,
  type ContentStatus,
  type Platform,
} from '@/lib/mockData'

/** Minimum spendable to publish / keep accepting submissions — docs/06-policies-and-trust.md#launch-policies. */
const PUBLISH_FLOOR = 10_000

/** Matches create-campaign minimum brand gross ₱/1k. */
const MIN_BRAND_RATE_PER_1K = 35

/** Details tab per-section Edit / Save (ghost + primary text). */
const DETAILS_SECTION_ACTION_BTN_CLASS =
  'h-auto shrink-0 gap-1.5 px-2 py-1.5 font-semibold text-primary hover:bg-primary/10 hover:text-primary'

const PLATFORM_OPTIONS: { id: Platform; label: string }[] = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'facebook', label: 'Facebook' },
]

/** Default hosted checkout — swap for the `invoice_url` from Xendit’s Create Invoice API in production. */
const XENDIT_CHECKOUT_URL = 'https://checkout.xendit.co/'

const BRAND_REJECT_PRESETS = [
  { id: 'fraud', label: 'Suspicious or fraudulent activity' },
  { id: 'duplicate', label: 'Duplicate or recycled content' },
  { id: 'engagement', label: 'Low engagement or questionable view quality' },
  { id: 'policy', label: 'Policy or brand-safety concern' },
  { id: 'other', label: 'Other' },
] as const

/** Rejected table row — submissions, payout accordion, release modal. */
const BRAND_REJECTED_ROW_CLASS = 'bg-red-50/90 dark:bg-red-950/35'

/** Red-outlined Reject CTA (outline variant + destructive border/text). */
const BRAND_REJECT_OUTLINE_BTN_CLASS =
  'border-destructive/60 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive'

type BrandRejectPresetId = (typeof BRAND_REJECT_PRESETS)[number]['id']

type BrandRejectTarget =
  | { scope: 'monthly-line'; lineId: string }
  | { scope: 'submission'; contentId: string }

const SUBMISSIONS_PAGE_SIZE = 10

type DetailsEditSection = 'copy' | 'platforms' | 'grossRate' | 'rules' | 'assets' | 'references'

type CampaignTab = 'details' | 'submissions' | 'payout' | 'budget'

const CAMPAIGN_TABS = new Set<CampaignTab>(['details', 'submissions', 'payout', 'budget'])

function parseCampaignTabParam(raw: string | null): CampaignTab {
  if (raw && CAMPAIGN_TABS.has(raw as CampaignTab)) return raw as CampaignTab
  return 'details'
}

export default function BrandCampaignDetailPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam?.trim() ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const campaignTab = parseCampaignTabParam(searchParams.get('tab'))

  function setCampaignTab(tab: CampaignTab) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (tab === 'details') next.delete('tab')
        else next.set('tab', tab)
        return next
      },
      { replace: false }
    )
  }

  const campaigns = useCampaignsStore((s) => s.campaigns)
  const campaign = useMemo(
    () => (id ? campaigns.find((c) => c.id === id) : undefined),
    [campaigns, id]
  )
  const updateCampaign = useCampaignsStore((s) => s.updateCampaign)
  const contents = useContentStore((s) => s.contents)
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [isAddingFunds, setIsAddingFunds] = useState(false)
  const [fundPublishOpen, setFundPublishOpen] = useState(false)
  const [fundPublishGross, setFundPublishGross] = useState('')
  const [isFundingPublish, setIsFundingPublish] = useState(false)
  /** Accrual line id → reject reason for this session (per-batch review). */
  const [monthlyBatchLineRejected, setMonthlyBatchLineRejected] = useState<Record<string, string>>(
    {}
  )
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
  /** contentId → reject reason (session-only; no separate “approve”). */
  const [submissionRejectReasons, setSubmissionRejectReasons] = useState<Record<string, string>>({})
  const [submissionsPage, setSubmissionsPage] = useState(1)

  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftRules, setDraftRules] = useState<string[]>([''])
  const [draftAssetUrl, setDraftAssetUrl] = useState('')
  const [draftReferenceLinks, setDraftReferenceLinks] = useState('')
  const [draftPlatforms, setDraftPlatforms] = useState<Platform[]>(['tiktok'])
  const [draftGrossRateDigits, setDraftGrossRateDigits] = useState('')
  /** Multiple sections can be in edit mode at once. */
  const [detailsEditingSections, setDetailsEditingSections] = useState<
    ReadonlySet<DetailsEditSection>
  >(() => new Set())

  /** Primitive signature so draft reset runs when persisted campaign fields change (not object identity). */
  const campaignDraftSyncSignature = useMemo(() => {
    if (!campaign) return ''
    return [
      campaign.id,
      campaign.title,
      campaign.description,
      campaign.rules.join('\u0001'),
      campaign.assetUrl ?? '',
      (campaign.referenceLinks ?? []).join('\u0001'),
      [...campaign.platforms].sort().join('|'),
      String(Math.round(brandHeadlineRatePer1k(campaign))),
    ].join('\u0002')
  }, [campaign])

  useEffect(() => {
    if (!campaign) return
    if (!detailsEditingSections.has('copy')) {
      setDraftTitle(campaign.title)
      setDraftDescription(campaign.description)
    }
    if (!detailsEditingSections.has('platforms')) {
      setDraftPlatforms(campaign.platforms.length > 0 ? [...campaign.platforms] : ['tiktok'])
    }
    if (!detailsEditingSections.has('grossRate')) {
      setDraftGrossRateDigits(String(Math.round(brandHeadlineRatePer1k(campaign))))
    }
    if (!detailsEditingSections.has('rules')) {
      setDraftRules(campaign.rules.length > 0 ? [...campaign.rules] : [''])
    }
    if (!detailsEditingSections.has('assets')) {
      setDraftAssetUrl(campaign.assetUrl ?? '')
    }
    if (!detailsEditingSections.has('references')) {
      setDraftReferenceLinks((campaign.referenceLinks ?? []).join('\n'))
    }
  }, [campaignDraftSyncSignature, campaign, detailsEditingSections])

  useEffect(() => {
    if (campaignTab !== 'details') setDetailsEditingSections(new Set())
  }, [campaignTab])

  useEffect(() => {
    setSubmissionsPage(1)
    setExpandedBatches({})
  }, [id])

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-lg font-bold">Campaign not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/brand/campaigns">
            <ArrowLeft className="h-4 w-4" /> Back to campaigns
          </Link>
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

  const fundGrossInput = Number(fundAmount)
  /** Breakdown for this payment only (excludes existing campaign pool). Mirrors create-campaign sidebar math. */
  const addFundsGross = Number.isFinite(fundGrossInput) && fundGrossInput > 0 ? fundGrossInput : 0
  const addFundsBreakdownPlatformFee = addFundsGross * platformFeePercent
  const addFundsBreakdownNetPool = Math.max(0, addFundsGross - addFundsBreakdownPlatformFee)
  const addFundsBrandRate = brandHeadlineRatePer1k(campaign)
  const addFundsCpv = addFundsBrandRate > 0 ? addFundsBrandRate / 1000 : 0
  const addFundsReach =
    addFundsCpv > 0 && addFundsBreakdownNetPool > 0
      ? Math.floor(addFundsBreakdownNetPool / addFundsCpv)
      : 0

  const fundPublishGrossNum = Number(fundPublishGross)
  const fundPublishGrossAmount =
    Number.isFinite(fundPublishGrossNum) && fundPublishGrossNum > 0 ? fundPublishGrossNum : 0
  const fundPublishPlatformFee = fundPublishGrossAmount * platformFeePercent
  const fundPublishPayoutPool = Math.max(0, fundPublishGrossAmount - fundPublishPlatformFee)
  const fundPublishBrandRate = brandHeadlineRatePer1k(campaign)
  const fundPublishCpv = fundPublishBrandRate > 0 ? fundPublishBrandRate / 1000 : 0
  const fundPublishReach =
    fundPublishCpv > 0 && fundPublishPayoutPool > 0
      ? Math.floor(fundPublishPayoutPool / fundPublishCpv)
      : 0

  const submissions = contents.filter((c) => c.campaignId === campaignId)
  const canEditPreSubmission = submissions.length === 0

  function addDraftRule() {
    setDraftRules((r) => [...r, ''])
  }

  function removeDraftRule(index: number) {
    setDraftRules((r) => (r.length <= 1 ? r : r.filter((_, i) => i !== index)))
  }

  function setDraftRuleAt(index: number, value: string) {
    setDraftRules((r) => r.map((x, i) => (i === index ? value : x)))
  }

  function togglePlatformPill(platform: Platform) {
    setDraftPlatforms((prev) => {
      const on = prev.includes(platform)
      if (on && prev.length === 1) return prev
      if (on) return prev.filter((p) => p !== platform)
      return [...prev, platform]
    })
  }

  function beginEditSection(section: DetailsEditSection) {
    const latest = useCampaignsStore.getState().campaigns.find((c) => c.id === campaignId)
    if (!latest) return

    let opened = false
    setDetailsEditingSections((prev) => {
      if (prev.has(section)) return prev
      opened = true
      return new Set(prev).add(section)
    })

    if (!opened) return

    switch (section) {
      case 'copy':
        setDraftTitle(latest.title)
        setDraftDescription(latest.description)
        break
      case 'platforms':
        setDraftPlatforms(latest.platforms.length > 0 ? [...latest.platforms] : ['tiktok'])
        break
      case 'grossRate':
        setDraftGrossRateDigits(String(Math.round(brandHeadlineRatePer1k(latest))))
        break
      case 'rules':
        setDraftRules(latest.rules.length > 0 ? [...latest.rules] : [''])
        break
      case 'assets':
        setDraftAssetUrl(latest.assetUrl ?? '')
        break
      case 'references':
        setDraftReferenceLinks((latest.referenceLinks ?? []).join('\n'))
        break
      default:
        break
    }
  }

  function endDetailsEditSection(section: DetailsEditSection) {
    setDetailsEditingSections((prev) => {
      if (!prev.has(section)) return prev
      const next = new Set(prev)
      next.delete(section)
      return next
    })
  }

  function saveCopySection() {
    if (!canEditPreSubmission) return
    if (!draftTitle.trim()) {
      toast.error('Add a campaign title.')
      return
    }
    updateCampaign(campaignId, {
      title: draftTitle.trim(),
      description: draftDescription.trim(),
    })
    toast.success('Title and description saved.')
    endDetailsEditSection('copy')
  }

  function savePlatformsSection() {
    if (!canEditPreSubmission) return
    if (draftPlatforms.length === 0) {
      toast.error('Select at least one platform.')
      return
    }
    updateCampaign(campaignId, { platforms: draftPlatforms })
    toast.success('Platforms updated.')
    endDetailsEditSection('platforms')
  }

  function saveRulesSection() {
    if (!canEditPreSubmission) return
    const rules = draftRules.map((r) => r.trim()).filter(Boolean)
    updateCampaign(campaignId, { rules })
    toast.success('Campaign rules saved.')
    endDetailsEditSection('rules')
  }

  function saveAssetsSection() {
    if (!canEditPreSubmission) return
    updateCampaign(campaignId, {
      assetUrl: draftAssetUrl.trim() || undefined,
    })
    toast.success('Asset link saved.')
    endDetailsEditSection('assets')
  }

  function saveRefsSection() {
    if (!canEditPreSubmission) return
    const links = draftReferenceLinks
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    updateCampaign(campaignId, {
      referenceLinks: links.length > 0 ? links : undefined,
    })
    toast.success('Reference links saved.')
    endDetailsEditSection('references')
  }

  function saveGrossRateFromDraft() {
    if (!campaign || !canEditPreSubmission) return
    const gross = Number(draftGrossRateDigits) || 0
    if (gross < MIN_BRAND_RATE_PER_1K) {
      toast.error(`Gross rate must be at least ₱${MIN_BRAND_RATE_PER_1K} per 1,000 views.`)
      return
    }
    const cpv = gross / 1000
    const nextReach =
      cpv > 0 ? Math.max(1, Math.floor(campaign.budget / cpv)) : campaign.estimatedReach
    updateCampaign(campaignId, {
      brandRatePer1k: gross,
      ratePer1k: getCreatorRatePer1k(gross),
      estimatedReach: nextReach,
    })
    toast.success('Gross rate updated.')
    endDetailsEditSection('grossRate')
  }

  const paidOut = campaign.spent
  const payoutBatches = mockMonthlyPayoutBatches
    .filter((p) => p.campaignId === campaign.id)
    .slice()
    .sort((a, b) => new Date(b.periodStart).getTime() - new Date(a.periodStart).getTime())
  const activeReleaseBatch = activeReleaseBatchId
    ? (payoutBatches.find((p) => p.id === activeReleaseBatchId) ?? null)
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

    const checkout = window.open(XENDIT_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
    if (!checkout) {
      toast.error('Allow pop-ups to open the Xendit checkout.')
      return
    }

    setIsAddingFunds(true)
    await new Promise((resolve) => setTimeout(resolve, 650))
    const net = Math.round(amount * (1 - platformFeePercent))
    const prevRemaining = getAvailableBalance(campaign)
    const nextBudget = campaign.budget + net
    const newRemaining = getAvailableBalance({ ...campaign, budget: nextBudget })
    const nextPatch: Parameters<typeof updateCampaign>[1] = { budget: nextBudget }
    if (campaign.status === 'paused' && prevRemaining === 0 && newRemaining >= PUBLISH_FLOOR) {
      nextPatch.status = 'active'
    }
    updateCampaign(campaignId, nextPatch)
    setIsAddingFunds(false)
    setAddFundsOpen(false)
    setFundAmount('')
    let publishNote = ''
    if (nextPatch.status === 'active' && campaign.status === 'paused' && prevRemaining === 0) {
      publishNote = ' Campaign resumed — spendable balance is back above the floor.'
    }
    toast.success(
      `${formatPHP(net, { decimals: false })} added to this campaign pool (${formatPHP(amount, { decimals: false })} payment after the platform fee).` +
        publishNote
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
    const wasActive = latest.status === 'active'
    updateCampaign(campaignId, {
      budget: newBudget,
      ...(wasActive ? { status: 'paused' as const } : {}),
    })
    setIsRefunding(false)
    setRefundOpen(false)
    toast.success(
      `${formatPHP(net, { decimals: false })} available balance refunded. Budget updated to ${formatPHP(newBudget, { decimals: false })}.` +
        (wasActive ? ' Campaign paused until you add new spendable balance.' : '')
    )
  }

  async function handleFundPublishSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!campaign) return
    const gross = Number(fundPublishGross) || 0
    if (!Number.isFinite(gross) || gross < MIN_GROSS_CAMPAIGN_BUDGET) {
      toast.error(
        `Total budget must be at least ${formatPHP(MIN_GROSS_CAMPAIGN_BUDGET, { decimals: false })} (gross).`
      )
      return
    }
    const brandRate = brandHeadlineRatePer1k(campaign)
    if (brandRate < MIN_BRAND_RATE_PER_1K) {
      toast.error(`Set a brand rate of at least ₱${MIN_BRAND_RATE_PER_1K} per 1,000 views first.`)
      return
    }
    const netPool = Math.max(0, Math.round(gross * (1 - platformFeePercent)))
    if (netPool < PUBLISH_FLOOR) {
      toast.error(
        'After the platform fee, spendable must be at least ₱10,000 to publish. Increase total budget.'
      )
      return
    }
    if (!campaign.assetUrl?.trim()) {
      toast.error('Add an asset link on the campaign details tab before publishing.')
      return
    }

    const checkout = window.open(XENDIT_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
    if (!checkout) {
      toast.error('Allow pop-ups to open the Xendit checkout.')
      return
    }

    setIsFundingPublish(true)
    await new Promise((resolve) => setTimeout(resolve, 650))

    const cpv = brandRate / 1000
    const platformFeeAmount = gross * platformFeePercent
    const payoutPoolForReach = Math.max(0, gross - platformFeeAmount)
    const newReach =
      cpv > 0 ? Math.max(1, Math.floor(payoutPoolForReach / cpv)) : campaign.estimatedReach

    updateCampaign(campaignId, {
      budget: netPool,
      plannedGrossBudget: gross,
      estimatedReach: newReach,
      status: 'active',
    })
    setIsFundingPublish(false)
    setFundPublishOpen(false)
    setFundPublishGross('')
    toast.success(
      `${formatPHP(netPool, { decimals: false })} is now in your campaign pool. The campaign is live for creators.`
    )
  }

  function openFundAndPublishDialog() {
    if (!campaign) return
    setFundPublishGross(String(getPlannedGrossBudgetForFunding(campaign)))
    setFundPublishOpen(true)
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
      toast.success('Submission rejected — excluded from this payout batch.')
    } else {
      setSubmissionRejectReasons((prev) => ({ ...prev, [rejectTarget.contentId]: reason }))
      toast.success('Submission rejected — excluded from payout. The creator is notified.')
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
    <div className="min-w-0 max-w-full space-y-6 rounded-2xl bg-muted/35 px-4 py-6 sm:px-5 sm:py-8 md:-mx-2 md:px-6">
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
            <h1 className="min-w-0 wrap-break-word font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {campaign.title}
            </h1>
            {/* <p className="max-w-full min-w-0 wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-base">
              {campaign.description}
            </p> */}
          </div>
          <div className="shrink-0 lg:pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {campaign.status === 'draft' ? (
                <Button
                  className="bg-phc-gradient font-semibold text-white hover:opacity-90"
                  onClick={openFundAndPublishDialog}
                >
                  <Play className="h-4 w-4" /> Fund &amp; Publish
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="border font-semibold" onClick={togglePause}>
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
                  <Button
                    className="bg-phc-gradient font-semibold text-white hover:opacity-90"
                    onClick={() => setAddFundsOpen(true)}
                  >
                    <Plus className="h-4 w-4" /> Add funds
                  </Button>
                </>
              )}
            </div>
            <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add funds to campaign</DialogTitle>
                  <DialogDescription>
                    Funds will be added after payment confirmation. Confirming opens Xendit checkout
                    in a new tab.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleAddFunds} className="space-y-4">
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground">Current campaign balance</p>
                    <p className="mt-1 font-display text-2xl font-bold">
                      {formatPHP(remaining, { decimals: false })}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="fund-amount">Amount to add</Label>
                    <IntegerInput
                      id="fund-amount"
                      pesoPrefix
                      placeholder={(10_000).toLocaleString('en-PH')}
                      value={fundAmount}
                      onValueChange={setFundAmount}
                    />
                  </div>

                  <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
                    <div className="rounded-xl bg-phc-gradient-soft p-4">
                      <p className="text-xs text-muted-foreground">Estimated reach to add</p>
                      <p className="font-display text-3xl font-extrabold text-phc-gradient">
                        {addFundsReach.toLocaleString('en-PH')}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        views, based on the post-fee payout pool
                      </p>
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Brand rate</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(addFundsBrandRate, { decimals: false })} / 1,000
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Total budget</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(addFundsGross, { decimals: false })}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Platform fee</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(addFundsBreakdownPlatformFee, { decimals: false })} (
                          {Math.round(platformFeePercent * 100)}%)
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Payout pool</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(addFundsBreakdownNetPool, { decimals: false })}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Cost / view</span>
                        <span className="shrink-0 font-semibold">₱{addFundsCpv.toFixed(3)}</span>
                      </li>
                    </ul>
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
                        'Confirm'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog
              open={fundPublishOpen}
              onOpenChange={(open) => {
                setFundPublishOpen(open)
                if (!open) setIsFundingPublish(false)
              }}
            >
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Fund &amp; publish</DialogTitle>
                  <DialogDescription>
                    Pay your total campaign budget. After checkout, your payout pool updates and the
                    campaign goes live
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={(e) => void handleFundPublishSubmit(e)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="fund-publish-budget">Total budget</Label>
                    <IntegerInput
                      id="fund-publish-budget"
                      pesoPrefix
                      min={MIN_GROSS_CAMPAIGN_BUDGET}
                      placeholder={MIN_GROSS_CAMPAIGN_BUDGET.toLocaleString('en-PH')}
                      value={fundPublishGross}
                      onValueChange={setFundPublishGross}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum gross ₱{MIN_GROSS_CAMPAIGN_BUDGET.toLocaleString('en-PH')}; after the{' '}
                      {Math.round(platformFeePercent * 100)}% fee, spendable must meet the ₱
                      {PUBLISH_FLOOR.toLocaleString('en-PH')} publish floor. Requires an asset link
                      on this campaign.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-border bg-card p-4 space-y-3">
                    <div className="rounded-xl bg-phc-gradient-soft p-4">
                      <p className="text-xs text-muted-foreground">Estimated reach</p>
                      <p className="font-display text-3xl font-extrabold text-phc-gradient">
                        {fundPublishReach.toLocaleString('en-PH')}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        views, based on the post-fee payout pool
                      </p>
                    </div>
                    <ul className="space-y-1.5 text-sm">
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Brand rate</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(fundPublishBrandRate, { decimals: false })} / 1,000
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Total budget</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(fundPublishGrossAmount, { decimals: false })}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Platform fee</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(fundPublishPlatformFee, { decimals: false })} (
                          {Math.round(platformFeePercent * 100)}%)
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Payout pool</span>
                        <span className="shrink-0 font-semibold">
                          {formatPHP(fundPublishPayoutPool, { decimals: false })}
                        </span>
                      </li>
                      <li className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Cost / view</span>
                        <span className="shrink-0 font-semibold">₱{fundPublishCpv.toFixed(3)}</span>
                      </li>
                    </ul>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFundPublishOpen(false)}
                      disabled={isFundingPublish}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-phc-gradient text-white hover:opacity-90"
                      disabled={isFundingPublish}
                    >
                      {isFundingPublish ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing
                        </>
                      ) : (
                        'Pay & publish'
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
          <p className="font-display text-2xl font-bold tabular-nums text-foreground md:text-3xl">
            {reachGoal > 0 ? `${reachProgressPct.toFixed(1)}%` : '—'}
          </p>
          <p className="text-sm font-semibold tabular-nums text-primary sm:text-right">
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

      <div className="min-w-0 border-b border-border" role="tablist" aria-label="Campaign sections">
        <div className="grid w-full grid-cols-4">
          <button
            type="button"
            role="tab"
            id="campaign-tab-details"
            aria-selected={campaignTab === 'details'}
            onClick={() => setCampaignTab('details')}
            className={cn(
              'relative flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 px-2 py-3.5 text-center text-xs font-semibold transition-colors sm:text-sm',
              campaignTab === 'details'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span className="leading-snug">Details</span>
            {campaignTab === 'details' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-submissions"
            aria-selected={campaignTab === 'submissions'}
            onClick={() => setCampaignTab('submissions')}
            className={cn(
              'relative flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 px-2 py-3.5 text-center text-xs font-semibold transition-colors sm:text-sm',
              campaignTab === 'submissions'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Play className="h-4 w-4 shrink-0" />
            <span className="leading-snug">
              Submissions
              <span className="ml-1 tabular-nums text-xs font-medium opacity-80">
                ({submissions.length})
              </span>
            </span>
            {campaignTab === 'submissions' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-payout"
            aria-selected={campaignTab === 'payout'}
            onClick={() => setCampaignTab('payout')}
            className={cn(
              'relative flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 px-2 py-3.5 text-center text-xs font-semibold transition-colors sm:text-sm',
              campaignTab === 'payout'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CircleDollarSign className="h-4 w-4 shrink-0" />
            <span className="leading-snug">Payout</span>
            {campaignTab === 'payout' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-budget"
            aria-selected={campaignTab === 'budget'}
            onClick={() => setCampaignTab('budget')}
            className={cn(
              'relative flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 px-2 py-3.5 text-center text-xs font-semibold transition-colors sm:text-sm',
              campaignTab === 'budget'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Wallet className="h-4 w-4 shrink-0" />
            <span className="leading-snug">Budget</span>
            {campaignTab === 'budget' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
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
            {canEditPreSubmission ? (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Title &amp; description
                    </p>
                    {detailsEditingSections.has('copy') ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={DETAILS_SECTION_ACTION_BTN_CLASS}
                        onClick={saveCopySection}
                      >
                        <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                        Save
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
                          className="font-display text-xl font-bold tracking-tight"
                        />
                      </div>
                      <div className="h-px w-full min-w-0 bg-border" aria-hidden />
                      <div className="space-y-1.5">
                        <Label htmlFor="campaign-detail-description">Description</Label>
                        <Textarea
                          id="campaign-detail-description"
                          value={draftDescription}
                          onChange={(e) => setDraftDescription(e.target.value)}
                          rows={5}
                          className="min-h-[120px] resize-y text-sm leading-relaxed"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="wrap-break-word font-display text-2xl font-bold leading-tight tracking-tight">
                        {campaign.title}
                      </h3>
                      <div className="h-px w-full min-w-0 bg-border" aria-hidden />
                      <div className="min-w-0 space-y-2">
                        <p className="max-w-full min-w-0 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-base">
                          {campaign.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>

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
                          size="sm"
                          className={DETAILS_SECTION_ACTION_BTN_CLASS}
                          onClick={savePlatformsSection}
                        >
                          <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                          Save
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className={DETAILS_SECTION_ACTION_BTN_CLASS}
                          onClick={() => beginEditSection('platforms')}
                        >
                          <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
                          Edit
                        </Button>
                      )}
                    </div>
                    {detailsEditingSections.has('platforms') ? (
                      <div className="flex flex-wrap gap-3">
                        {PLATFORM_OPTIONS.map(({ id: platformId, label }) => {
                          const selected = draftPlatforms.includes(platformId)
                          return (
                            <button
                              key={platformId}
                              type="button"
                              onClick={() => togglePlatformPill(platformId)}
                              className={cn(
                                'inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
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
                      <div className="flex min-w-0 shrink-0 flex-wrap items-end gap-2">
                        {campaign.platforms.map((p) => (
                          <div key={p} className="flex flex-col items-center gap-1.5">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                              <PlatformIcon platform={p} className="h-6 w-6" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="wrap-break-word font-display text-2xl font-bold leading-tight tracking-tight">
                  {campaign.title}
                </h3>
                <div className="h-px w-full min-w-0 bg-border" aria-hidden />

                <div className="min-w-0 space-y-2">
                  <p className="max-w-full min-w-0 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-muted-foreground md:text-base">
                    {campaign.description}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-border/80 bg-muted/25 p-4">
                  <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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
                    <div className="flex min-w-0 shrink-0 flex-wrap items-end gap-2 sm:justify-end">
                      {campaign.platforms.map((p) => (
                        <div key={p} className="flex flex-col items-center gap-1.5">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border bg-card">
                            <PlatformIcon platform={p} className="h-6 w-6" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="rounded-2xl border border-border bg-muted/25 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950/45 dark:text-teal-300">
                    <TrendingUp className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Gross rate per 1K views
                  </p>
                </div>
                {canEditPreSubmission ? (
                  detailsEditingSections.has('grossRate') ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={DETAILS_SECTION_ACTION_BTN_CLASS}
                      onClick={saveGrossRateFromDraft}
                    >
                      <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                      Save
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={DETAILS_SECTION_ACTION_BTN_CLASS}
                      onClick={() => beginEditSection('grossRate')}
                    >
                      <PencilLine className="h-4 w-4 shrink-0" aria-hidden />
                      Edit
                    </Button>
                  )
                ) : null}
              </div>
              {canEditPreSubmission && detailsEditingSections.has('grossRate') ? (
                <>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Minimum ₱{MIN_BRAND_RATE_PER_1K.toLocaleString('en-PH')} per 1,000 views.
                  </p>
                  <div className="mt-2 space-y-1.5">
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
                </>
              ) : canEditPreSubmission ? (
                <>
                  <p className="mt-4 font-display text-2xl font-bold tabular-nums text-foreground">
                    {formatPHP(brandHeadlineRatePer1k(campaign), { decimals: false })} / 1,000 views
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-4 font-display text-2xl font-bold tabular-nums text-foreground">
                    {formatPHP(brandHeadlineRatePer1k(campaign), { decimals: false })} / 1,000 views
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Rate is fixed once creators have submitted to this campaign.
                  </p>
                </>
              )}
            </div>

            <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-violet-200/80 bg-violet-50/90 px-4 py-4 dark:border-violet-900/40 dark:bg-violet-950/35 sm:items-center sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-200/80 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="wrap-break-word font-display font-bold text-violet-950 dark:text-violet-50">
                  The more engaging your content, the higher your payout.
                </p>
                <p className="wrap-break-word text-sm leading-snug text-violet-800/90 dark:text-violet-200/90">
                  Focus on creativity, authenticity, and high-quality content.
                </p>
              </div>
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
                        size="sm"
                        className={DETAILS_SECTION_ACTION_BTN_CLASS}
                        onClick={saveRulesSection}
                      >
                        <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                        Save
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
                          <div
                            key={index}
                            className="grid min-w-0 grid-cols-[2.25rem_1fr_auto] items-center gap-x-3 rounded-xl border border-border bg-muted/30 px-2 py-2"
                          >
                            <span className="justify-self-end font-display text-base font-bold tabular-nums leading-none text-phc-gradient">
                              {index + 1}.
                            </span>
                            <Input
                              value={rule}
                              onChange={(e) => setDraftRuleAt(index, e.target.value)}
                              placeholder={`Rule ${index + 1}`}
                              className="min-w-0 border-0 bg-transparent px-0 text-sm font-medium leading-snug shadow-none focus-visible:ring-0 md:text-base"
                            />
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
                        size="sm"
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
                        size="sm"
                        className={DETAILS_SECTION_ACTION_BTN_CLASS}
                        onClick={saveAssetsSection}
                      >
                        <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                        Save
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
                      Reference links
                    </p>
                    {detailsEditingSections.has('references') ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={DETAILS_SECTION_ACTION_BTN_CLASS}
                        onClick={saveRefsSection}
                      >
                        <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                        Save
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
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
                      <Label htmlFor="campaign-detail-refs">URLs (one per line)</Label>
                      <Textarea
                        id="campaign-detail-refs"
                        value={draftReferenceLinks}
                        onChange={(e) => setDraftReferenceLinks(e.target.value)}
                        rows={3}
                        placeholder="One URL per line"
                        className="resize-none text-sm"
                      />
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
      ) : campaignTab === 'budget' ? (
        <div className="space-y-6" role="tabpanel" aria-labelledby="campaign-tab-budget">
          <section className="space-y-6 rounded-3xl border border-border bg-card p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-4 items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <Wallet className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                    Budget
                  </h2>
                  <p className="text-sm text-muted-foreground">Manage funds for this campaign.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="font-semibold"
                  disabled={remaining <= 0}
                  onClick={() => setRefundOpen(true)}
                >
                  <Undo2 className="h-4 w-4" /> Refund Available Balance
                </Button>
                <Button
                  type="button"
                  className="shrink-0 bg-phc-gradient font-semibold text-white hover:opacity-90"
                  onClick={
                    campaign.status === 'draft'
                      ? openFundAndPublishDialog
                      : () => setAddFundsOpen(true)
                  }
                >
                  {campaign.status === 'draft' ? (
                    <>
                      <Play className="h-4 w-4" /> Fund &amp; publish
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" /> Add funds
                    </>
                  )}
                </Button>
              </div>
            </div>

            {remaining + reserved < PUBLISH_FLOOR && campaign.status === 'active' ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
                <Pause
                  className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-300"
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Spendable below publish floor ({formatPHP(PUBLISH_FLOOR, { decimals: false })})
                  </p>
                  <p className="mt-0.5 text-amber-800 dark:text-amber-200/90">
                    New submissions will be auto-paused until you top up. Included lines still
                    settle on next payout.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex justify-between items-center rounded-2xl border border-border bg-card p-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                    {formatPHP(campaign.budget, { decimals: false })}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/45 dark:text-blue-300">
                  <Wallet className="h-5 w-5" aria-hidden />
                </div>
              </div>

              <div className="flex justify-between items-center rounded-2xl border border-border bg-card p-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                    {formatPHP(remaining, { decimals: false })}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/45 dark:text-emerald-300">
                  <Wallet className="h-5 w-5" aria-hidden />
                </div>
              </div>

              <div className="flex justify-between items-center rounded-2xl border border-border bg-card p-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Reserved</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                    {formatPHP(reserved, { decimals: false })}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/45 dark:text-orange-300">
                  <Clock className="h-5 w-5" aria-hidden />
                </div>
              </div>

              <div className="flex justify-between items-center rounded-2xl border border-border bg-card p-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Paid</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                    {formatPHP(paidOut, { decimals: false })}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/45 dark:text-violet-300">
                  <CircleDollarSign className="h-5 w-5" aria-hidden />
                </div>
              </div>
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
                  This returns your available balance ({formatPHP(remaining, { decimals: false })})
                  to your brand wallet. Paid and reserved amounts are unchanged. Total budget
                  becomes paid plus reserved after this refund.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRefundOpen(false)}
                  disabled={isRefunding}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-phc-gradient font-semibold text-white hover:opacity-90"
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
            {submissions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                <p className="font-medium">No submissions yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Creators will start submitting soon.
                </p>
              </div>
            ) : (
              <TableContainer>
                <Table className="min-w-3xl">
                  <TableHeader>
                    <TableRow className="cursor-default hover:bg-transparent">
                      <TableHead>Creator</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right"> </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissionsPageRows.map((content) => {
                      const submissionRejected = Boolean(submissionRejectReasons[content.id])
                      const postHref = content.url
                      return (
                        <TableRow
                          key={content.id}
                          className={cn(
                            'cursor-pointer',
                            submissionRejected
                              ? cn(
                                  BRAND_REJECTED_ROW_CLASS,
                                  'hover:bg-red-100/80 dark:hover:bg-red-950/45'
                                )
                              : 'hover:bg-muted/40'
                          )}
                          onClick={() => window.open(postHref, '_blank', 'noopener,noreferrer')}
                        >
                          <TableCell
                            className={cn(
                              'max-w-56',
                              submissionRejected && 'text-muted-foreground'
                            )}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <a
                              href={creatorSocialHrefOrPost(content.url, content.platform)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              <PersonAvatar
                                name={content.creatorName}
                                src={content.creatorAvatarUrl}
                                size="xs"
                                className="shrink-0"
                              />
                              <span
                                className={cn(
                                  'min-w-0 font-medium leading-snug text-foreground underline-offset-2 hover:underline',
                                  submissionRejected && 'line-through'
                                )}
                              >
                                {content.creatorName}
                              </span>
                            </a>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <PlatformCell
                              platform={content.platform}
                              iconClassName="h-5 w-5"
                              className={cn(submissionRejected && 'opacity-60')}
                              hasYellowBasket={Boolean(content.hasTikTokYellowBasket)}
                            />
                          </TableCell>
                          <TableCell
                            className={cn(
                              'font-semibold',
                              submissionRejected && 'line-through text-muted-foreground'
                            )}
                          >
                            {formatViews(content.views)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              'font-display text-sm font-bold tabular-nums text-phc-gradient',
                              submissionRejected && 'line-through opacity-70'
                            )}
                          >
                            {formatPHP(content.earnings, { decimals: false })}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <ContentStatusBadge
                              status={brandReviewStatusForBadge(content.status, submissionRejected)}
                            />
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              type="button"
                              variant={submissionRejected ? 'secondary' : 'outline'}
                              size="xs"
                              className={cn(
                                'shrink-0 rounded-md font-normal',
                                !submissionRejected && BRAND_REJECT_OUTLINE_BTN_CLASS
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (submissionRejected) restoreSubmission(content.id)
                                else openRejectForSubmission(content.id)
                              }}
                            >
                              {submissionRejected ? 'Restore' : 'Reject'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <TablePagination
                  page={submissionsPage}
                  pageSize={SUBMISSIONS_PAGE_SIZE}
                  totalItems={submissions.length}
                  onPageChange={setSubmissionsPage}
                  itemLabel="submissions"
                />
              </TableContainer>
            )}
          </section>
        </div>
      ) : campaignTab === 'payout' ? (
        <div className="space-y-4" role="tabpanel" aria-labelledby="campaign-tab-payout">
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
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
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
                          <p className="font-display text-base font-bold text-foreground sm:text-lg">
                            {batch.periodLabel}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                            {batch.lines.length}{' '}
                            {batch.lines.length === 1 ? 'submission' : 'submissions'} ·{' '}
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
                            className="bg-phc-gradient font-semibold text-white hover:opacity-90"
                            onClick={() => openReleasePayoutsModal(batch.id)}
                          >
                            <Send className="h-4 w-4" /> Release payout
                          </Button>
                        )}
                      </div>
                    </header>
                    {isExpanded ? (
                      <div
                        id={`payout-batch-${batch.id}`}
                        className="border-t border-border bg-muted/20"
                      >
                        <Table className="min-w-3xl">
                          <TableHeader>
                            <TableRow className="cursor-default border-border bg-muted/40 hover:bg-muted/40">
                              <TableHead>Creator</TableHead>
                              <TableHead>Platform</TableHead>
                              <TableHead>Views</TableHead>
                              <TableHead>Earnings</TableHead>
                              <TableHead>Status</TableHead>
                              {isReleased ? null : <TableHead className="text-right"> </TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batch.lines.map((line) => {
                              const lineRejected = Boolean(monthlyBatchLineRejected[line.id])
                              const contentUrl = getContentPostUrl(line.contentId)
                              const linkedContent = contents.find((c) => c.id === line.contentId)
                              const lineAvatar = linkedContent?.creatorAvatarUrl
                              const lineStatus: ContentStatus = isReleased
                                ? lineRejected
                                  ? 'rejected'
                                  : 'paid'
                                : brandReviewStatusForBadge(
                                    linkedContent?.status ?? 'pending',
                                    lineRejected
                                  )
                              return (
                                <TableRow
                                  key={line.id}
                                  onClick={() => {
                                    if (contentUrl)
                                      window.open(contentUrl, '_blank', 'noopener,noreferrer')
                                  }}
                                  className={cn(
                                    'border-border',
                                    contentUrl &&
                                      cn(
                                        'cursor-pointer',
                                        lineRejected
                                          ? 'hover:bg-red-100/75 dark:hover:bg-red-950/45'
                                          : 'hover:bg-muted/25'
                                      ),
                                    lineRejected ? BRAND_REJECTED_ROW_CLASS : ''
                                  )}
                                >
                                  <TableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                      <PersonAvatar
                                        name={line.creatorName}
                                        src={lineAvatar}
                                        size="xs"
                                        className="shrink-0"
                                      />
                                      <div
                                        className={cn(
                                          'min-w-0 max-w-56 leading-snug',
                                          lineRejected && 'line-through text-muted-foreground'
                                        )}
                                      >
                                        {contentUrl ? (
                                          <a
                                            href={creatorSocialHrefOrPost(
                                              contentUrl,
                                              line.platform
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-medium text-foreground underline-offset-2 hover:underline"
                                          >
                                            {line.creatorName}
                                          </a>
                                        ) : (
                                          <span className="font-medium">{line.creatorName}</span>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell
                                    className={cn(lineRejected && 'opacity-60')}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <PlatformCell
                                      platform={line.platform}
                                      iconClassName="h-5 w-5"
                                      hasYellowBasket={Boolean(line.isYellowBasket)}
                                    />
                                  </TableCell>
                                  <TableCell
                                    className={cn(
                                      'font-semibold',
                                      lineRejected && 'line-through text-muted-foreground'
                                    )}
                                  >
                                    {formatViews(line.snapshotViews)}
                                  </TableCell>
                                  <TableCell
                                    className={cn(
                                      'font-display text-sm font-bold tabular-nums text-phc-gradient',
                                      lineRejected && 'line-through opacity-70'
                                    )}
                                  >
                                    {formatPHP(line.creatorNet, { decimals: false })}
                                  </TableCell>
                                  <TableCell>
                                    <ContentStatusBadge status={lineStatus} />
                                  </TableCell>
                                  {isReleased ? null : (
                                    <TableCell
                                      className="text-right"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Button
                                        type="button"
                                        variant={lineRejected ? 'secondary' : 'outline'}
                                        size="xs"
                                        className={cn(
                                          'rounded-md font-normal',
                                          !lineRejected && BRAND_REJECT_OUTLINE_BTN_CLASS
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (lineRejected) restoreMonthlyBatchLine(line.id)
                                          else openRejectForMonthlyLine(line.id)
                                        }}
                                      >
                                        {lineRejected ? 'Restore' : 'Reject'}
                                      </Button>
                                    </TableCell>
                                  )}
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Release payout</DialogTitle>
            <DialogDescription>
              Confirm totals for this batch. To exclude someone from payment, use{' '}
              <span className="text-red-500 font-bold">Reject</span> in the payout table before
              confirming.
            </DialogDescription>
          </DialogHeader>
          {activeReleaseBatch
            ? (() => {
                const includedLines = activeReleaseBatch.lines.filter(
                  (l) => !monthlyBatchLineRejected[l.id]
                )
                const excludedCount = activeReleaseBatch.lines.length - includedLines.length
                const totalGross = includedLines.reduce((s, l) => s + l.grossAmount, 0)
                const totalCreatorNet = includedLines.reduce((s, l) => s + l.creatorNet, 0)
                const noPayable = includedLines.length === 0
                return (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Payout period
                      </p>
                      <p className="mt-1 font-medium text-foreground">
                        {activeReleaseBatch.periodLabel}
                      </p>
                      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Total gross releasing
                      </p>
                      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
                        {formatPHP(totalGross, { decimals: false })}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {includedLines.length} submission{includedLines.length === 1 ? '' : 's'}{' '}
                        included
                        {excludedCount > 0 ? ` · ${excludedCount} rejected and skipped` : null}
                      </p>
                      <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                        Estimated to creators (net):{' '}
                        <span className="font-semibold tabular-nums text-foreground">
                          {formatPHP(totalCreatorNet, { decimals: false })}
                        </span>
                      </p>
                    </div>
                    {noPayable ? (
                      <p className="text-sm text-destructive">
                        Nothing left to release — restore a row in the table or cancel.
                      </p>
                    ) : null}
                  </div>
                )
              })()
            : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isConfirmingRelease}
              onClick={closeReleasePayoutsModal}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-phc-gradient font-semibold text-white hover:opacity-90"
              disabled={
                isConfirmingRelease ||
                !activeReleaseBatch ||
                activeReleaseBatch.lines.filter((l) => !monthlyBatchLineRejected[l.id]).length === 0
              }
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
                    payoutBatches.flatMap((b) => b.lines).find((l) => l.id === rejectTarget.lineId)
                      ?.creatorName ?? 'this creator'
                  } from this batch?`
                : rejectTarget?.scope === 'submission'
                  ? `Reject ${submissions.find((c) => c.id === rejectTarget.contentId)?.creatorName ?? 'this creator'}'s submission?`
                  : 'Reject submission?'}
            </DialogTitle>
            <DialogDescription>
              {rejectTarget?.scope === 'monthly-line'
                ? 'This submission will not be paid when you release the payout for this batch. Pick the closest reason.'
                : rejectTarget?.scope === 'submission'
                  ? 'Rejection excludes this content from pay and would notify the creator in product. There is no separate approve step — not rejected means it keeps accruing.'
                  : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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
                  className="mt-0.5 size-4 shrink-0"
                  checked={rejectPreset === preset.id}
                  onChange={() => setRejectPreset(preset.id)}
                />
                <span className="text-sm leading-snug">{preset.label}</span>
              </label>
            ))}
            {rejectPreset === 'other' ? (
              <div className="space-y-1.5 p-1">
                <Label htmlFor="brand-reject-other" className="text-xs text-muted-foreground">
                  Describe the reason
                </Label>
                <Textarea
                  id="brand-reject-other"
                  rows={3}
                  placeholder="Short note for your records (e.g. creator requested removal)."
                  value={rejectOtherDetail}
                  onChange={(e) => setRejectOtherDetail(e.target.value)}
                  className="resize-none text-sm leading-snug"
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
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
