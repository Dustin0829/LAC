import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useBrandCampaign,
  useBrandCampaignCheckout,
  usePatchBrandCampaign,
  useRefundBrandCampaign,
  useReleaseBrandCampaignPayout,
} from '@/api/queries/brands/use-campaigns'
import {
  useBrandCampaignSubmissions,
  useRejectBrandCampaignSubmission,
} from '@/api/queries/brands/use-submissions'
import { usePaymentMethods } from '@/api/queries/use-payment-methods'
import { brandCampaignDetailFromApi } from '@/lib/brands/campaigns/campaignCards'
import { useFundingReturn } from '@/api/queries/brands/use-funding-return'
import { useAuthStore } from '@/lib/stores/authStore'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'
import { formatPHP, isValidHttpOrHttpsUrl } from '@/lib/utils'
import {
  brandHeadlineRatePer1k,
  getCampaignReachViewGoal,
  getPlatformFeePercent,
  getPlannedGrossBudgetForFunding,
  type Campaign,
  type Platform,
} from '@/lib/mockData'
import { MIN_BRAND_RATE_PER_1K, MIN_PUBLISH_PHP, minPublishAvailableThresholdPhp } from '@/lib/constants'
import {
  BRAND_REJECT_PRESETS,
  type BrandRejectPresetId,
  type BrandRejectTarget,
  type CampaignTab,
  type DetailsEditSection,
  parseCampaignTabParam,
} from '@/lib/brands/campaigns/campaignDetailUi'
import type { DetailsTabProps } from './DetailsTab'
import type { BudgetTabProps } from './BudgetTab'
import type { SubmissionsTabProps } from './SubmissionsTab'
import type { CampaignDetailHeaderProps } from './CampaignDetailHeader'

const STATUS_VISUAL = {
  active: { chip: 'border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  paused: { chip: 'border-amber-200 bg-amber-50 text-amber-900', dot: 'bg-amber-500' },
  ended: { chip: 'border-zinc-200 bg-zinc-50 text-zinc-700', dot: 'bg-zinc-400' },
  draft: { chip: 'border-blue-200 bg-blue-50 text-blue-800', dot: 'bg-blue-500' },
} as const

export function useCampaignDetail() {
  const { id: idParam } = useParams<{ id: string }>()
  const id = idParam?.trim() ?? ''
  const [searchParams, setSearchParams] = useSearchParams()
  const campaignTab = parseCampaignTabParam(searchParams.get('tab'))

  const setCampaignTab = useCallback(
    (tab: CampaignTab) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (tab === 'details') next.delete('tab')
          else next.set('tab', tab)
          return next
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )

  const brandUserId = useAuthStore((s) => s.user?.id) ?? ''
  const {
    data: apiCampaignDto,
    isLoading: apiCampaignLoading,
    isError: apiCampaignError,
    refetch: refetchApiCampaign,
    isFetching: apiCampaignFetching,
  } = useBrandCampaign(id)

  const campaign = useMemo((): Campaign | undefined => {
    if (!apiCampaignDto || !brandUserId) return undefined
    return brandCampaignDetailFromApi(apiCampaignDto, brandUserId)
  }, [apiCampaignDto, brandUserId])

  const { mutate: patchCampaign } = usePatchBrandCampaign(id)
  const { mutate: createCheckout } = useBrandCampaignCheckout(id)
  const { mutate: releasePayout, isPending: isReleasingPayout } = useReleaseBrandCampaignPayout(id)
  const { mutate: refundCampaign } = useRefundBrandCampaign(id)
  const { mutate: rejectSubmission } = useRejectBrandCampaignSubmission(id)

  usePaymentMethods()
  const {
    data: campaignSubmissions = [],
    isLoading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useBrandCampaignSubmissions(id)

  useFundingReturn({
    campaignId: id,
    onRefresh: () => {
      void refetchApiCampaign()
      void refetchSubmissions()
    },
  })

  const [headerRefreshing, setHeaderRefreshing] = useState(false)
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [isAddingFunds, setIsAddingFunds] = useState(false)
  const [fundPublishOpen, setFundPublishOpen] = useState(false)
  const [fundPublishGross, setFundPublishGross] = useState('')
  const [isFundingPublish, setIsFundingPublish] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<BrandRejectTarget | null>(null)
  const [rejectPreset, setRejectPreset] = useState<BrandRejectPresetId>('fraud')
  const [rejectOtherDetail, setRejectOtherDetail] = useState('')
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundNeedAccountOpen, setRefundNeedAccountOpen] = useState(false)
  const [addRefundAccountOpen, setAddRefundAccountOpen] = useState(false)
  const [isRefunding, setIsRefunding] = useState(false)
  const skipRefundPromptRestoreRef = useRef(false)
  const refundReceivingMethods = usePaymentMethodsStore((s) => s.methods)
  const hasRefundReceivingAccount = refundReceivingMethods.length > 0
  const [releasePayoutOpen, setReleasePayoutOpen] = useState(false)

  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftRules, setDraftRules] = useState<string[]>([''])
  const [draftAssetUrl, setDraftAssetUrl] = useState('')
  const [draftReferenceLinks, setDraftReferenceLinks] = useState('')
  const [draftPlatforms, setDraftPlatforms] = useState<Platform[]>(['tiktok'])
  const [draftGrossRateDigits, setDraftGrossRateDigits] = useState('')
  const [detailsEditingSections, setDetailsEditingSections] = useState<
    ReadonlySet<DetailsEditSection>
  >(() => new Set())

  const countedViewsForReach = useMemo(
    () => campaignSubmissions.reduce((sum, row) => sum + row.views, 0),
    [campaignSubmissions]
  )

  const pendingPayoutSubmissions = useMemo(
    () => campaignSubmissions.filter((s) => s.status === 'pending' || s.status === 'payout_failed'),
    [campaignSubmissions]
  )

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

  const invalidReferenceDraftLines = useMemo(() => {
    const lines = draftReferenceLinks.split('\n')
    const bad: { lineNum: number; text: string }[] = []
    for (let i = 0; i < lines.length; i += 1) {
      const t = lines[i].trim()
      if (!t) continue
      if (!isValidHttpOrHttpsUrl(t)) bad.push({ lineNum: i + 1, text: t })
    }
    return bad
  }, [draftReferenceLinks])

  useEffect(() => {
    if (campaignTab !== 'details') setDetailsEditingSections(new Set())
  }, [campaignTab])

  const platformFeePercent = campaign?.platformFeePercent ?? getPlatformFeePercent()
  const remaining = apiCampaignDto ? Number(apiCampaignDto.availableBudget) || 0 : 0
  const payoutPool = apiCampaignDto ? Number(apiCampaignDto.payoutPoolBudget) || 0 : 0
  const reserved = campaign?.reservedBalance ?? 0
  const reachGoal = campaign ? getCampaignReachViewGoal(campaign) : 0
  const reachProgressPct =
    reachGoal > 0 ? Math.min(100, (countedViewsForReach / reachGoal) * 100) : 0

  const fundGrossInput = Number(fundAmount)
  const addFundsGross = Number.isFinite(fundGrossInput) && fundGrossInput > 0 ? fundGrossInput : 0
  const addFundsBreakdownPlatformFee = addFundsGross * platformFeePercent
  const addFundsBreakdownNetPool = Math.max(0, addFundsGross - addFundsBreakdownPlatformFee)
  const addFundsBrandRate = campaign ? brandHeadlineRatePer1k(campaign) : 0
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
  const fundPublishBrandRate = campaign ? brandHeadlineRatePer1k(campaign) : 0
  const fundPublishCpv = fundPublishBrandRate > 0 ? fundPublishBrandRate / 1000 : 0
  const fundPublishReach =
    fundPublishCpv > 0 && fundPublishPayoutPool > 0
      ? Math.floor(fundPublishPayoutPool / fundPublishCpv)
      : 0

  const canEditPreSubmission =
    campaign != null && (campaign.status === 'draft' || campaignSubmissions.length === 0)
  const paidOut = campaign?.spent ?? 0
  const pendingPayoutTotal = pendingPayoutSubmissions.reduce((s, row) => s + row.payoutGross, 0)
  const statusUi = campaign ? STATUS_VISUAL[campaign.status] : STATUS_VISUAL.draft

  const endDetailsEditSection = useCallback((section: DetailsEditSection) => {
    setDetailsEditingSections((prev) => {
      if (!prev.has(section)) return prev
      const next = new Set(prev)
      next.delete(section)
      return next
    })
  }, [])

  const beginEditSection = useCallback(
    (section: DetailsEditSection) => {
      if (!campaign) return
      let opened = false
      setDetailsEditingSections((prev) => {
        if (prev.has(section)) return prev
        opened = true
        return new Set(prev).add(section)
      })
      if (!opened) return

      switch (section) {
        case 'copy':
          setDraftTitle(campaign.title)
          setDraftDescription(campaign.description)
          break
        case 'platforms':
          setDraftPlatforms(
            campaign.platforms.length > 0 ? [...campaign.platforms] : ['tiktok']
          )
          break
        case 'grossRate':
          setDraftGrossRateDigits(String(Math.round(brandHeadlineRatePer1k(campaign))))
          break
        case 'rules':
          setDraftRules(campaign.rules.length > 0 ? [...campaign.rules] : [''])
          break
        case 'assets':
          setDraftAssetUrl(campaign.assetUrl ?? '')
          break
        case 'references':
          setDraftReferenceLinks((campaign.referenceLinks ?? []).join('\n'))
          break
        default:
          break
      }
    },
    [campaign]
  )

  const addDraftRule = useCallback(() => {
    setDraftRules((r) => [...r, ''])
  }, [])

  const removeDraftRule = useCallback((index: number) => {
    setDraftRules((r) => (r.length <= 1 ? r : r.filter((_, i) => i !== index)))
  }, [])

  const setDraftRuleAt = useCallback((index: number, value: string) => {
    setDraftRules((r) => r.map((x, i) => (i === index ? value : x)))
  }, [])

  const togglePlatformPill = useCallback((platform: Platform) => {
    setDraftPlatforms((prev) => {
      const on = prev.includes(platform)
      if (on && prev.length === 1) return prev
      if (on) return prev.filter((p) => p !== platform)
      return [...prev, platform]
    })
  }, [])

  const saveCopySection = useCallback(() => {
    if (!canEditPreSubmission) return
    if (!draftTitle.trim()) {
      toast.error('Add a campaign title.')
      return
    }
    patchCampaign(
      { title: draftTitle.trim(), description: draftDescription.trim() },
      { onSuccess: () => endDetailsEditSection('copy') }
    )
  }, [
    canEditPreSubmission,
    draftTitle,
    draftDescription,
    patchCampaign,
    endDetailsEditSection,
  ])

  const savePlatformsSection = useCallback(() => {
    if (!canEditPreSubmission) return
    if (draftPlatforms.length === 0) {
      toast.error('Select at least one platform.')
      return
    }
    patchCampaign(
      { platforms: draftPlatforms },
      { onSuccess: () => endDetailsEditSection('platforms') }
    )
  }, [canEditPreSubmission, draftPlatforms, patchCampaign, endDetailsEditSection])

  const saveRulesSection = useCallback(() => {
    if (!canEditPreSubmission) return
    const rules = draftRules.map((r) => r.trim()).filter(Boolean)
    patchCampaign({ rules }, { onSuccess: () => endDetailsEditSection('rules') })
  }, [canEditPreSubmission, draftRules, patchCampaign, endDetailsEditSection])

  const saveAssetsSection = useCallback(() => {
    if (!canEditPreSubmission) return
    const url = draftAssetUrl.trim()
    patchCampaign(
      { assetUrls: url ? [url] : null },
      { onSuccess: () => endDetailsEditSection('assets') }
    )
  }, [canEditPreSubmission, draftAssetUrl, patchCampaign, endDetailsEditSection])

  const saveRefsSection = useCallback(() => {
    if (!canEditPreSubmission) return
    const links = draftReferenceLinks
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    for (const link of links) {
      if (!isValidHttpOrHttpsUrl(link)) {
        toast.error(
          'Each line must be a full http(s) URL (for example https://example.com/page). Fix or remove invalid lines before saving.'
        )
        return
      }
    }
    patchCampaign(
      { referenceLinks: links.length > 0 ? links : null },
      { onSuccess: () => endDetailsEditSection('references') }
    )
  }, [canEditPreSubmission, draftReferenceLinks, patchCampaign, endDetailsEditSection])

  const saveGrossRateFromDraft = useCallback(() => {
    if (!canEditPreSubmission) return
    const gross = Number(draftGrossRateDigits) || 0
    if (gross < MIN_BRAND_RATE_PER_1K) {
      toast.error(`Gross rate must be at least ₱${MIN_BRAND_RATE_PER_1K} per 1,000 views.`)
      return
    }
    patchCampaign({ ratePer1k: gross }, { onSuccess: () => endDetailsEditSection('grossRate') })
  }, [canEditPreSubmission, draftGrossRateDigits, patchCampaign, endDetailsEditSection])

  const togglePause = useCallback(() => {
    if (!campaign) return
    const nextStatus = campaign.status !== 'paused' ? 'paused' : 'active'
    if (nextStatus === 'active' && remaining < minPublishAvailableThresholdPhp()) {
      setAddFundsOpen(true)
      toast.info('Not enough balance to resume. Add funds to continue.')
      return
    }
    patchCampaign({ status: nextStatus })
  }, [campaign, remaining, patchCampaign])

  const handleAddFunds = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const amount = Number(fundAmount)
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error('Enter a valid amount to add.')
        return
      }
      setIsAddingFunds(true)
      createCheckout(
        { grossAmount: amount, intent: 'add_funds' },
        {
          onSuccess: () => {
            setAddFundsOpen(false)
            setFundAmount('')
          },
          onSettled: () => setIsAddingFunds(false),
        }
      )
    },
    [fundAmount, createCheckout]
  )

  const openAddRefundAccountFromPrompt = useCallback(() => {
    setRefundNeedAccountOpen(false)
    setAddRefundAccountOpen(true)
  }, [])

  const confirmRefundAvailable = useCallback(() => {
    if (!hasRefundReceivingAccount) {
      setRefundOpen(false)
      setRefundNeedAccountOpen(true)
      return
    }
    if (remaining <= 0) {
      toast.error('There is no available balance to refund.')
      setRefundOpen(false)
      return
    }
    setIsRefunding(true)
    refundCampaign(undefined, {
      onSuccess: () => setRefundOpen(false),
      onSettled: () => setIsRefunding(false),
    })
  }, [hasRefundReceivingAccount, remaining, refundCampaign])

  const handleFundPublishSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!campaign) return
      const gross = Number(fundPublishGross) || 0
      if (!Number.isFinite(gross) || gross < MIN_PUBLISH_PHP) {
        toast.error(
          `Total budget must be at least ${formatPHP(MIN_PUBLISH_PHP, { decimals: false })}.`
        )
        return
      }
      const brandRate = brandHeadlineRatePer1k(campaign)
      if (brandRate < MIN_BRAND_RATE_PER_1K) {
        toast.error(`Set a brand rate of at least ₱${MIN_BRAND_RATE_PER_1K} per 1,000 views first.`)
        return
      }
      if (!campaign.assetUrl?.trim()) {
        toast.error('Add an asset link on the campaign details tab before publishing.')
        return
      }

      setIsFundingPublish(true)
      createCheckout(
        { grossAmount: gross, intent: 'initial_publish' },
        {
          onSuccess: () => {
            setFundPublishOpen(false)
            setFundPublishGross('')
            setCampaignTab('budget')
          },
          onSettled: () => setIsFundingPublish(false),
        }
      )
    },
    [campaign, fundPublishGross, createCheckout, setCampaignTab]
  )

  const openFundAndPublishDialog = useCallback(() => {
    if (!campaign) return
    setFundPublishGross(String(getPlannedGrossBudgetForFunding(campaign)))
    setFundPublishOpen(true)
  }, [campaign])

  const confirmReleasePayouts = useCallback(() => {
    if (pendingPayoutSubmissions.length === 0) {
      toast.error('No pending submissions ready for payout.')
      return
    }
    releasePayout(undefined, {
      onSuccess: () => {
        setReleasePayoutOpen(false)
        void refetchSubmissions()
      },
    })
  }, [pendingPayoutSubmissions.length, releasePayout, refetchSubmissions])

  const openRejectForSubmission = useCallback((submissionId: string, creatorName: string) => {
    setRejectTarget({ submissionId, creatorName })
    setRejectPreset('fraud')
    setRejectOtherDetail('')
  }, [])

  const resetRejectDialog = useCallback(() => {
    setRejectTarget(null)
    setRejectPreset('fraud')
    setRejectOtherDetail('')
  }, [])

  const confirmBrandReject = useCallback(() => {
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
    rejectSubmission(
      { submissionId: rejectTarget.submissionId, body: { reason } },
      { onSuccess: resetRejectDialog }
    )
  }, [rejectTarget, rejectPreset, rejectOtherDetail, rejectSubmission, resetRejectDialog])

  const header: CampaignDetailHeaderProps | null = useMemo(() => {
    if (!campaign) return null
    return {
      campaign,
      statusUi,
      remaining,
      platformFeePercent,
      addFundsGross,
      addFundsBreakdownPlatformFee,
      addFundsBreakdownNetPool,
      addFundsBrandRate,
      addFundsCpv,
      addFundsReach,
      fundPublishGross,
      setFundPublishGross,
      fundPublishGrossAmount,
      fundPublishPlatformFee,
      fundPublishPayoutPool,
      fundPublishBrandRate,
      fundPublishCpv,
      fundPublishReach,
      addFundsOpen,
      setAddFundsOpen,
      isAddingFunds,
      fundAmount,
      setFundAmount,
      handleAddFunds,
      fundPublishOpen,
      setFundPublishOpen,
      isFundingPublish,
      setIsFundingPublish,
      handleFundPublishSubmit,
      togglePause,
      openFundAndPublishDialog,
      countedViewsForReach,
      reachGoal,
      reachProgressPct,
      headerRefreshing,
      apiCampaignFetching,
      refetchApiCampaign,
      refetchSubmissions,
      setHeaderRefreshing,
    }
  }, [
    campaign,
    statusUi,
    remaining,
    platformFeePercent,
    addFundsGross,
    addFundsBreakdownPlatformFee,
    addFundsBreakdownNetPool,
    addFundsBrandRate,
    addFundsCpv,
    addFundsReach,
    fundPublishGross,
    fundPublishGrossAmount,
    fundPublishPlatformFee,
    fundPublishPayoutPool,
    fundPublishBrandRate,
    fundPublishCpv,
    fundPublishReach,
    addFundsOpen,
    isAddingFunds,
    fundAmount,
    handleAddFunds,
    fundPublishOpen,
    isFundingPublish,
    setIsFundingPublish,
    handleFundPublishSubmit,
    togglePause,
    openFundAndPublishDialog,
    countedViewsForReach,
    reachGoal,
    reachProgressPct,
    headerRefreshing,
    apiCampaignFetching,
    refetchApiCampaign,
    refetchSubmissions,
  ])

  const tabs = useMemo((): {
    details: DetailsTabProps
    budget: BudgetTabProps
    submissions: SubmissionsTabProps
  } | null => {
    if (!campaign) return null
    return {
      details: {
        campaign,
        canEditPreSubmission,
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
      },
      budget: {
        campaignId: id,
        campaign,
        remaining,
        payoutPool,
        reserved,
        paidOut,
        platformFeePercent,
        minPublishThreshold: minPublishAvailableThresholdPhp(),
        hasRefundReceivingAccount,
        refundReceivingMethods,
        onOpenRefund: () => {
          if (apiCampaignDto?.refundInProgress) return
          if (!hasRefundReceivingAccount) {
            setRefundNeedAccountOpen(true)
            return
          }
          setRefundOpen(true)
        },
        refundInProgress: apiCampaignDto?.refundInProgress ?? false,
        onOpenAddFunds: () => setAddFundsOpen(true),
        onOpenFundAndPublish: openFundAndPublishDialog,
        refundOpen,
        setRefundOpen,
        isRefunding,
        setIsRefunding,
        confirmRefundAvailable,
        refundNeedAccountOpen,
        setRefundNeedAccountOpen,
        openAddRefundAccountFromPrompt,
        addRefundAccountOpen,
        setAddRefundAccountOpen,
        skipRefundPromptRestoreRef,
      },
      submissions: {
        campaign,
        submissionsLoading,
        campaignSubmissions,
        pendingPayoutSubmissions,
        pendingPayoutTotal,
        isReleasingPayout,
        releasePayoutOpen,
        setReleasePayoutOpen,
        confirmReleasePayouts,
        rejectTarget,
        rejectPreset,
        setRejectPreset,
        rejectOtherDetail,
        setRejectOtherDetail,
        openRejectForSubmission,
        resetRejectDialog,
        confirmBrandReject,
      },
    }
  }, [
    campaign,
    id,
    canEditPreSubmission,
    detailsEditingSections,
    draftTitle,
    draftDescription,
    draftRules,
    draftGrossRateDigits,
    draftAssetUrl,
    draftReferenceLinks,
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
    remaining,
    payoutPool,
    reserved,
    paidOut,
    platformFeePercent,
    hasRefundReceivingAccount,
    refundReceivingMethods,
    apiCampaignDto?.refundInProgress,
    apiCampaignDto?.availableBudget,
    apiCampaignDto?.payoutPoolBudget,
    openFundAndPublishDialog,
    refundOpen,
    isRefunding,
    confirmRefundAvailable,
    refundNeedAccountOpen,
    openAddRefundAccountFromPrompt,
    addRefundAccountOpen,
    submissionsLoading,
    campaignSubmissions,
    pendingPayoutSubmissions,
    pendingPayoutTotal,
    isReleasingPayout,
    releasePayoutOpen,
    rejectTarget,
    rejectPreset,
    rejectOtherDetail,
    openRejectForSubmission,
    resetRejectDialog,
    confirmBrandReject,
    confirmReleasePayouts,
  ])

  return {
    id,
    campaignTab,
    setCampaignTab,
    apiCampaignLoading,
    apiCampaignError,
    refetchApiCampaign,
    campaign,
    campaignSubmissions,
    submissionsLoading,
    tabs,
    header,
  }
}
