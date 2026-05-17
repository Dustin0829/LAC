import type { LucideIcon } from 'lucide-react'
import { CircleDollarSign, Clock, LayoutGrid, XCircle } from 'lucide-react'
import type { ListMeSubmissionsParams } from '@/api/types/creator/submissions.types'
import { CREATOR_SUBMISSIONS_PAGE_SIZE } from '@/lib/constants'

export type CreatorSubmissionTab = 'all' | 'pending' | 'paid' | 'rejected'

export type CreatorSubmissionTabConfig = {
  id: CreatorSubmissionTab
  label: string
  shortLabel: string
  icon: LucideIcon
}

export const CREATOR_SUBMISSION_TABS: CreatorSubmissionTabConfig[] = [
  { id: 'all', label: 'All Submissions', shortLabel: 'All', icon: LayoutGrid },
  { id: 'pending', label: 'Pending', shortLabel: 'Pending', icon: Clock },
  { id: 'paid', label: 'Paid', shortLabel: 'Paid', icon: CircleDollarSign },
  { id: 'rejected', label: 'Rejected', shortLabel: 'Rejected', icon: XCircle },
]

export function creatorSubmissionEmptyFilterDescription(tab: CreatorSubmissionTab): string {
  if (tab === 'all') return 'Submit your first content from any active campaign.'
  if (tab === 'pending') return "You don't have any submissions waiting for review."
  if (tab === 'paid') return "You don't have any paid submissions yet."
  return "You don't have any rejected submissions."
}

export function creatorSubmissionEmptyPlaceholderTitle(
  tab: CreatorSubmissionTab,
  hasAny: boolean
): string {
  if (!hasAny && tab === 'all') return 'No submissions yet'
  if (tab === 'pending') return 'No pending submissions'
  if (tab === 'paid') return 'No paid submissions'
  if (tab === 'rejected') return 'No rejected submissions'
  return 'No submissions'
}

export function creatorSubmissionListParams(
  tab: CreatorSubmissionTab,
  page: number
): ListMeSubmissionsParams {
  return {
    page,
    limit: CREATOR_SUBMISSIONS_PAGE_SIZE,
    ...(tab !== 'all' ? { status: tab } : {}),
  }
}
