import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiRequestError } from '@/api/client'
import {
  postCampaignSubmission,
  postCampaignSubmissionPreview,
} from '@/api/services/creator/campaign-submissions'
import { parseCampaignSubmissionBody } from '@/api/schema/creator/submission.schema'
import type { CampaignSubmissionBody } from '@/api/types/creator/campaign-submissions.types'
import type { Platform } from '@/api/types/shared'
import { creatorCampaignsQueryKeys } from '@/api/queries/creator/use-campaigns'
import { creatorDashboardQueryKeys } from '@/api/queries/creator/use-dashboard'
import { creatorSubmissionsQueryKeys } from '@/api/queries/creator/use-submissions'
import { CREATOR_SUBMISSION_PREVIEW_DEBOUNCE_MS } from '@/lib/constants'
import { PLATFORM_RECONNECT_MESSAGE } from '@/lib/auth/sessionExpired'
import {
  campaignSubmissionConfirmErrorMessage,
  campaignSubmissionPreviewErrorMessage,
  campaignSubmissionSuccessMessage,
  campaignSubmissionUrlErrorMessage,
  isCampaignSubmissionViewsFloorError,
} from '@/lib/creators/submissions/campaignSubmissionMessages'
import {
  isSubmissionBelowMinViews,
  submissionPreviewSnapshotFromApi,
  type CampaignSubmissionPreviewSnapshot,
} from '@/lib/creators/submissions/campaignSubmissionPreview'

export type CampaignSubmissionLinkPhase = 'idle' | 'validating' | 'ready' | 'below_quota'

export const creatorCampaignSubmissionsQueryKeys = {
  all: ['creator', 'campaign-submissions'] as const,
  preview: (campaignId: string) =>
    [...creatorCampaignSubmissionsQueryKeys.all, 'preview', campaignId] as const,
  confirm: (campaignId: string) =>
    [...creatorCampaignSubmissionsQueryKeys.all, 'confirm', campaignId] as const,
}

/** `POST /campaigns/:id/submissions/preview` — live stats from linked platform. */
export function usePostCampaignSubmissionPreview(campaignId: string) {
  return useMutation({
    mutationKey: creatorCampaignSubmissionsQueryKeys.preview(campaignId),
    mutationFn: (body: CampaignSubmissionBody) => postCampaignSubmissionPreview(campaignId, body),
    retry: false,
  })
}

/** Debounced live preview while the submit modal is open. */
export function useCampaignSubmissionLinkPreview(options: {
  campaignId: string
  open: boolean
  url: string
  platform: Platform
  platformsAllowed: Platform[]
  hasPayoutMethod: boolean
  platformConnected: boolean
  onPaymentMethodRequired?: () => void
  onPlatformReconnect?: () => void
}) {
  const {
    campaignId,
    open,
    url,
    platform,
    platformsAllowed,
    hasPayoutMethod,
    platformConnected,
    onPaymentMethodRequired,
    onPlatformReconnect,
  } = options

  const { mutateAsync: runSubmissionPreview } = usePostCampaignSubmissionPreview(campaignId)
  const [linkPhase, setLinkPhase] = useState<CampaignSubmissionLinkPhase>('idle')
  const [snapshot, setSnapshot] = useState<CampaignSubmissionPreviewSnapshot | null>(null)
  const [previewError, setPreviewError] = useState<string | undefined>()
  const validationGenRef = useRef(0)

  function resetLinkPreview() {
    setLinkPhase('idle')
    setSnapshot(null)
    setPreviewError(undefined)
  }

  function clearLinkPreviewProgress() {
    setLinkPhase('idle')
    setSnapshot(null)
    setPreviewError(undefined)
  }

  useEffect(() => {
    if (!open) return

    const gen = ++validationGenRef.current
    const trimmed = url.trim()

    if (!trimmed) {
      resetLinkPreview()
      return
    }
    if (!hasPayoutMethod || !platformConnected) {
      resetLinkPreview()
      return
    }

    const parsed = parseCampaignSubmissionBody(trimmed, platform)
    if (!parsed.success) {
      setLinkPhase('idle')
      setSnapshot(null)
      setPreviewError(parsed.error.issues[0]?.message ?? campaignSubmissionUrlErrorMessage())
      return
    }

    setLinkPhase('validating')
    setSnapshot(null)
    setPreviewError(undefined)

    const t = window.setTimeout(() => {
      void (async () => {
        if (gen !== validationGenRef.current) return
        if (!platformsAllowed.includes(platform)) {
          setLinkPhase('idle')
          setSnapshot(null)
          return
        }

        try {
          const data = await runSubmissionPreview(parsed.data)
          if (gen !== validationGenRef.current) return

          const snap = submissionPreviewSnapshotFromApi(data, platform)
          setSnapshot(snap)
          setPreviewError(undefined)
          const belowMin = !data.eligible || isSubmissionBelowMinViews(snap.views)
          setLinkPhase(belowMin ? 'below_quota' : 'ready')
        } catch (err) {
          if (gen !== validationGenRef.current) return

          const message = campaignSubmissionPreviewErrorMessage(err, platform)
          if (
            err instanceof ApiRequestError &&
            err.message === 'creator_default_payment_method_required'
          ) {
            toast.error(message)
            onPaymentMethodRequired?.()
            resetLinkPreview()
            return
          }
          if (err instanceof ApiRequestError && err.message === PLATFORM_RECONNECT_MESSAGE) {
            toast.error(message)
            onPlatformReconnect?.()
            resetLinkPreview()
            return
          }
          if (isCampaignSubmissionViewsFloorError(err)) {
            setSnapshot(null)
            setPreviewError(message)
            setLinkPhase('below_quota')
            return
          }

          toast.error(message)
          setPreviewError(message)
          setLinkPhase('idle')
          setSnapshot(null)
        }
      })()
    }, CREATOR_SUBMISSION_PREVIEW_DEBOUNCE_MS)

    return () => window.clearTimeout(t)
  }, [
    open,
    url,
    platform,
    platformsAllowed,
    hasPayoutMethod,
    platformConnected,
    runSubmissionPreview,
    onPaymentMethodRequired,
    onPlatformReconnect,
  ])

  return {
    linkPhase,
    snapshot,
    previewError,
    resetLinkPreview,
    clearLinkPreviewProgress,
  }
}

/** `POST /campaigns/:id/submissions` — persist submission. */
export function useConfirmCampaignSubmission(campaignId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationKey: creatorCampaignSubmissionsQueryKeys.confirm(campaignId),
    mutationFn: (body: CampaignSubmissionBody) => postCampaignSubmission(campaignId, body),
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: creatorSubmissionsQueryKeys.all }),
        qc.invalidateQueries({ queryKey: creatorDashboardQueryKeys.all }),
        qc.invalidateQueries({ queryKey: creatorCampaignsQueryKeys.detail(campaignId) }),
      ])
      toast.success(campaignSubmissionSuccessMessage())
    },
    onError: (err, variables) => {
      toast.error(campaignSubmissionConfirmErrorMessage(err, variables.platform))
    },
  })
}
