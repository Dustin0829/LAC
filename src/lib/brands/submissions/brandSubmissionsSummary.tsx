import { formatPHP } from '@/lib/utils'

export type BrandCampaignSubmissionsSummary = {
  totalCount: number
  pendingCount: number
  pendingGrossPhp: number
}

/** Inline summary for brand campaign submissions table header. */
export function BrandCampaignSubmissionsSummaryLine({
  totalCount,
  pendingCount,
  pendingGrossPhp,
}: BrandCampaignSubmissionsSummary) {
  const submissionLabel = totalCount === 1 ? 'submission' : 'submissions'

  return (
    <p className="text-sm text-muted-foreground">
      <span className="tabular-nums">{totalCount.toLocaleString('en-PH')}</span> {submissionLabel}
      {pendingCount > 0 ? (
        <>
          {' · '}
          <span className="font-semibold tabular-nums text-foreground">
            {formatPHP(pendingGrossPhp, { decimals: false })}
          </span>{' '}
          pending
        </>
      ) : null}
    </p>
  )
}
