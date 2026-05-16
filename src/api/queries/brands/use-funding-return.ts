import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { brandCampaignsQueryKeys } from '@/api/queries/brands/use-campaigns'

export type FundingReturn = 'success' | 'failed'

function parseFundingReturn(raw: string | null): FundingReturn | null {
  if (raw === 'success' || raw === 'failed') return raw
  return null
}

/**
 * After Xendit redirects back with `?tab=budget&funding=success|failed`, refresh campaign + transactions.
 * Credits appear in transaction history (Xendit webhook or "Apply credit" on Payment received rows).
 */
export function useFundingReturn(opts?: { campaignId?: string; onRefresh?: () => void }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const qc = useQueryClient()
  const handled = useRef(false)

  useEffect(() => {
    const funding = parseFundingReturn(searchParams.get('funding'))
    if (!funding || handled.current) return
    handled.current = true

    void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.list() })
    if (opts?.campaignId) {
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.detail(opts.campaignId) })
      void qc.invalidateQueries({ queryKey: brandCampaignsQueryKeys.transactions(opts.campaignId) })
    }
    opts?.onRefresh?.()

    if (funding === 'success') {
      toast.success('Payment received.')
    } else {
      toast.error('Payment not completed.')
    }

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('funding')
        if (!next.get('tab')) next.set('tab', 'budget')
        return next
      },
      { replace: true }
    )
  }, [opts, qc, searchParams, setSearchParams])
}
