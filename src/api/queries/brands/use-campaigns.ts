import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createBrandCampaignCheckout,
  getBrandCampaign,
  getBrandCampaigns,
  getBrandCampaignTransactions,
  patchBrandCampaign,
  refundBrandCampaign,
  releaseBrandCampaignPayout,
  syncBrandCampaignCheckout,
} from '@/api/services/brands/campaigns'
import type {
  BrandCampaignCheckoutBody,
  BrandCampaignDetailDto,
  PatchBrandCampaignBody,
} from '@/api/types/brands/campaigns.types'
import { brandCampaignApiErrorMessage } from '@/lib/brands/campaigns/campaignDetail'
import {
  brandCampaignCheckoutToastMessage,
  brandCampaignRefundSuccessMessage,
  brandCampaignReleasePayoutSuccessMessage,
  brandCampaignSubmitCreateCheckoutOpenMessage,
  brandCampaignSubmitCreateDraftSavedMessage,
  brandCampaignSubmitCreatePartialErrorMessage,
  brandCampaignSyncCheckoutToast,
  brandCampaignTransactionsRefreshErrorMessage,
  brandCampaignTransactionsRefreshSuccessMessage,
  patchBrandCampaignSuccessMessage,
} from '@/lib/brands/campaigns/campaignMutationMessages'
import {
  buildCreateBrandCampaignBody,
  CampaignSubmitError,
  submitBrandCampaignCreate,
  validateCreateCampaignForm,
  type BrandSubmitCampaignCreateInput,
  type CreateCampaignFormInput,
  type CreateCampaignFormValidationIssue,
} from '@/lib/brands/campaigns/createCampaign'
import { brandCampaignCardFromApi } from '@/lib/brands/campaigns/campaignCards'
import { redirectToBrandCampaignCheckout } from '@/lib/brands/campaigns/campaignUiFeedback'
import { useBrandAuthEnabled } from '@/api/queries/brands/auth'
import { useAuthStore } from '@/lib/stores/authStore'

export const brandCampaignsQueryKeys = {
  all: ['brands', 'campaigns'] as const,
  list: () => [...brandCampaignsQueryKeys.all, 'list'] as const,
  detail: (id: string) => [...brandCampaignsQueryKeys.all, 'detail', id] as const,
  transactions: (id: string) => [...brandCampaignsQueryKeys.all, 'transactions', id] as const,
}

/** Brand campaigns list (`GET /brands/campaigns`). */
export function useBrandCampaigns() {
  const enabled = useBrandAuthEnabled()
  const brandUserId = useAuthStore((s) => s.user?.id)

  return useQuery({
    queryKey: brandCampaignsQueryKeys.list(),
    queryFn: async () => {
      const { items } = await getBrandCampaigns()
      const userId = brandUserId ?? ''
      return items.map((dto) => brandCampaignCardFromApi(dto, userId))
    },
    enabled: enabled && Boolean(brandUserId),
  })
}

/** Single brand campaign (`GET /brands/campaigns/:id`). */
export function useBrandCampaign(campaignId: string) {
  const enabled = useBrandAuthEnabled()

  return useQuery({
    queryKey: brandCampaignsQueryKeys.detail(campaignId),
    queryFn: () => getBrandCampaign(campaignId),
    enabled: enabled && Boolean(campaignId),
  })
}

/** Partial update (`PATCH /brands/campaigns/:id`). */
export function usePatchBrandCampaign(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...brandCampaignsQueryKeys.all, 'patch', campaignId] as const,
    mutationFn: (body: PatchBrandCampaignBody) => patchBrandCampaign(campaignId, body),
    retry: false,
    onSuccess: (data, body) => {
      qc.setQueryData(brandCampaignsQueryKeys.detail(campaignId), data.campaign)
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.list() })
      toast.success(patchBrandCampaignSuccessMessage(body))
    },
    onError: (err) => toast.error(brandCampaignApiErrorMessage(err)),
  })
}

/** Xendit checkout for add-funds or initial publish. */
export function useBrandCampaignCheckout(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...brandCampaignsQueryKeys.all, 'checkout', campaignId] as const,
    mutationFn: (body: BrandCampaignCheckoutBody) => createBrandCampaignCheckout(campaignId, body),
    retry: false,
    onSuccess: (checkout, body) => {
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.transactions(campaignId) })
      toast.info(brandCampaignCheckoutToastMessage(body.intent))
      redirectToBrandCampaignCheckout(checkout.checkoutUrl)
    },
    onError: (err) => toast.error(brandCampaignApiErrorMessage(err)),
  })
}

/** Campaign budget ledger + pending payments (`GET …/transactions`). */
export function useBrandCampaignTransactions(campaignId: string, enabled = true) {
  const authEnabled = useBrandAuthEnabled()
  const query = useQuery({
    queryKey: brandCampaignsQueryKeys.transactions(campaignId),
    queryFn: () => getBrandCampaignTransactions(campaignId),
    enabled: authEnabled && Boolean(campaignId) && enabled,
  })

  const refetchTransactions = useCallback(async () => {
    const result = await query.refetch()
    if (result.isError) {
      toast.error(brandCampaignTransactionsRefreshErrorMessage())
    } else {
      toast.success(brandCampaignTransactionsRefreshSuccessMessage())
    }
    return result
  }, [query])

  return { ...query, refetchTransactions }
}

/** Confirm a paid Xendit invoice when the webhook did not credit the campaign. */
export function useSyncBrandCampaignCheckout(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...brandCampaignsQueryKeys.all, 'checkout-sync', campaignId] as const,
    mutationFn: (externalId: string) => syncBrandCampaignCheckout(campaignId, externalId),
    retry: false,
    onSuccess: (data, externalId) => {
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.transactions(campaignId) })
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.detail(campaignId) })
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.list() })
      const toastPayload = brandCampaignSyncCheckoutToast(data, externalId)
      if (toastPayload?.type === 'success') toast.success(toastPayload.message)
      else if (toastPayload?.type === 'info') toast.info(toastPayload.message)
      else if (toastPayload) toast.error(toastPayload.message)
    },
    onError: (err) => toast.error(brandCampaignApiErrorMessage(err)),
  })
}

/** Release pending / failed payouts (`POST …/release-payout`). */
export function useReleaseBrandCampaignPayout(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...brandCampaignsQueryKeys.all, 'release-payout', campaignId] as const,
    mutationFn: () => releaseBrandCampaignPayout(campaignId),
    retry: false,
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.detail(campaignId) })
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.list() })
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.transactions(campaignId) })
      void qc.invalidateQueries({
        queryKey: ['brands', 'submissions', 'campaign', campaignId],
      })
      toast.success(brandCampaignReleasePayoutSuccessMessage(result))
    },
    onError: (err) => toast.error(brandCampaignApiErrorMessage(err)),
  })
}

/** Refund spendable balance (`POST …/refund`). */
export function useRefundBrandCampaign(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...brandCampaignsQueryKeys.all, 'refund', campaignId] as const,
    mutationFn: () => refundBrandCampaign(campaignId),
    retry: false,
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.detail(campaignId) })
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.list() })
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.transactions(campaignId) })
      void qc.invalidateQueries({
        queryKey: ['brands', 'submissions', 'campaign', campaignId],
      })
      const campaign = qc.getQueryData<BrandCampaignDetailDto>(
        brandCampaignsQueryKeys.detail(campaignId)
      )
      toast.success(brandCampaignRefundSuccessMessage(result, campaign))
    },
    onError: (err) => toast.error(brandCampaignApiErrorMessage(err)),
  })
}

export type BrandSubmitCampaignCreateParams = {
  form: CreateCampaignFormInput
  coverFile: File | null
  openCheckout: boolean
  onValidationIssue?: (issue: CreateCampaignFormValidationIssue) => void
}

/** Create draft, optional cover, optional checkout — validation, toasts, and navigation. */
export function useBrandSubmitCampaignCreate() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [persistedDraftId, setPersistedDraftId] = useState<string | null>(null)
  const [submitMode, setSubmitMode] = useState<'draft' | 'publish' | null>(null)
  const hadExistingDraftRef = useRef(false)

  const mutation = useMutation({
    mutationKey: [...brandCampaignsQueryKeys.all, 'submit-create'] as const,
    mutationFn: (input: BrandSubmitCampaignCreateInput) => submitBrandCampaignCreate(input),
    retry: false,
    onSuccess: (result) => {
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.list() })
      setPersistedDraftId(result.campaign.id)

      if (result.checkoutUrl) {
        toast.success(brandCampaignSubmitCreateCheckoutOpenMessage())
        redirectToBrandCampaignCheckout(result.checkoutUrl)
        return
      }

      toast.success(brandCampaignSubmitCreateDraftSavedMessage(hadExistingDraftRef.current))
      navigate(`/brand/campaigns/${result.campaign.id}?tab=budget`)
    },
    onError: (e) => {
      if (e instanceof CampaignSubmitError) {
        setPersistedDraftId(e.campaignId)
        toast.error(brandCampaignSubmitCreatePartialErrorMessage(e.message))
      } else {
        toast.error(brandCampaignApiErrorMessage(e))
      }
    },
    onSettled: () => setSubmitMode(null),
  })

  function submitCreateCampaign(params: BrandSubmitCampaignCreateParams) {
    const issue = validateCreateCampaignForm(params.form, {
      requirePublishFunding: params.openCheckout,
    })
    if (issue) {
      params.onValidationIssue?.(issue)
      return
    }

    hadExistingDraftRef.current = Boolean(persistedDraftId)
    setSubmitMode(params.openCheckout ? 'publish' : 'draft')

    mutation.mutate({
      body: buildCreateBrandCampaignBody(params.form),
      coverFile: params.coverFile,
      checkout: params.openCheckout
        ? { grossAmount: params.form.plannedGrossBudget }
        : undefined,
      existingCampaignId: persistedDraftId ?? undefined,
    })
  }

  return {
    submitCreateCampaign,
    persistedDraftId,
    setPersistedDraftId,
    isSubmitting: mutation.isPending,
    isPublishing: mutation.isPending && submitMode === 'publish',
    isSavingDraft: mutation.isPending && submitMode === 'draft',
  }
}
