import type { ContentStatus } from '@/lib/mockData'

/**
 * Brand review UI: session reject overrides store; otherwise map store → badge.
 * Submissions stay pending/rejected only — bulk settlement is on payout batches, not `paid` rows.
 */
export function brandReviewStatusForBadge(
  status: ContentStatus,
  sessionRejected: boolean
): ContentStatus {
  if (sessionRejected) return 'rejected'
  if (status === 'rejected') return 'rejected'
  return 'pending'
}
