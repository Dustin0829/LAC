import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMeSubmissions } from '@/api/services/creator/submissions'
import type { ListMeSubmissionsParams } from '@/api/types/creator/submissions.types'
import { creatorSubmissionRowFromApi } from '@/lib/creators/submissions/creatorSubmissionRows'
import { useCreatorAuthEnabled } from '@/api/queries/creator/auth'
import { useCreatorDashboardStats } from '@/api/queries/creator/use-dashboard'

export const creatorSubmissionsQueryKeys = {
  all: ['creator', 'submissions'] as const,
  list: (params: ListMeSubmissionsParams) => [...creatorSubmissionsQueryKeys.all, 'list', params] as const,
}

/** Dashboard inbox — pending, paying, rejected, payout_failed (`GET /me/submissions?scope=recent`). */
export function useCreatorRecentSubmissions(params: Omit<ListMeSubmissionsParams, 'scope' | 'status'>) {
  return useMeSubmissions({ ...params, scope: 'recent' })
}

/** Creator submissions table (`GET /me/submissions`). */
export function useMeSubmissions(params: ListMeSubmissionsParams) {
  const enabled = useCreatorAuthEnabled()

  return useQuery({
    queryKey: creatorSubmissionsQueryKeys.list(params),
    queryFn: async () => {
      const { items, meta } = await getMeSubmissions(params)
      return {
        rows: items.map(creatorSubmissionRowFromApi),
        meta,
      }
    },
    enabled,
  })
}

/** Parallel refetch for submissions page stat cards + table. */
export function useRefreshCreatorSubmissionsPage(listParams: ListMeSubmissionsParams) {
  const { refetch: refetchStats, isFetching: statsFetching } = useCreatorDashboardStats()
  const { refetch: refetchList, isFetching: listFetching } = useMeSubmissions(listParams)

  const refresh = useCallback(
    () => Promise.all([refetchStats(), refetchList()]),
    [refetchStats, refetchList]
  )

  return {
    refresh,
    isRefreshing: statsFetching || listFetching,
  }
}
