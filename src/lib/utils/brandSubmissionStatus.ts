import type { ContentStatus } from '@/lib/mockData'

/**
 * Brand review UI: per-row pay doesn’t exist yet, so don’t surface `paid` in submissions —
 * treat it as still in the review/accrual queue (`pending`).
 */
export function brandReviewStatusForBadge(
  status: ContentStatus,
  sessionRejected: boolean
): ContentStatus {
  if (sessionRejected) return 'rejected'
  if (status === 'paid') return 'pending'
  if (status === 'rejected') return 'rejected'
  return 'pending'
}
