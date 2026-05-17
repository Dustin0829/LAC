import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCreatorDashboard, getCreatorMeAnalytics } from '@/api/services/creator/dashboard'
import type { CreatorPerformanceRange } from '@/api/types/creator/dashboard.types'
import {
  creatorDashboardStatsFromApi,
  creatorPerformanceChartFromAnalytics,
} from '@/lib/creators/dashboard/creatorDashboard'
import { useCreatorAuthEnabled } from '@/api/queries/creator/auth'

export const creatorDashboardQueryKeys = {
  all: ['creator', 'dashboard'] as const,
  stats: () => [...creatorDashboardQueryKeys.all, 'stats'] as const,
  analytics: (granularity: CreatorPerformanceRange) =>
    [...creatorDashboardQueryKeys.all, 'analytics', granularity] as const,
}

/** Creator headline stats (`GET /me/dashboard`). Paid-only for earnings & views. */
export function useCreatorDashboardStats() {
  const enabled = useCreatorAuthEnabled()
  return useQuery({
    queryKey: creatorDashboardQueryKeys.stats(),
    queryFn: async () => creatorDashboardStatsFromApi(await getCreatorDashboard()),
    enabled,
  })
}

/** Earnings chart (`GET /me/analytics?granularity=…`). */
export function useCreatorPerformanceChart(granularity: CreatorPerformanceRange) {
  const enabled = useCreatorAuthEnabled()
  const query = useQuery({
    queryKey: creatorDashboardQueryKeys.analytics(granularity),
    queryFn: async () => {
      const data = await getCreatorMeAnalytics({ granularity })
      return creatorPerformanceChartFromAnalytics(data.periods, data.granularity)
    },
    enabled,
  })
  return { ...query, chartData: query.data ?? [] }
}

/** Parallel refetch for stat cards, chart, and recent inbox (`refetchRecent` from `useCreatorRecentSubmissions`). */
export function useRefreshCreatorDashboard(
  earningsRange: CreatorPerformanceRange,
  refetchRecent: () => Promise<unknown>
) {
  const { refetch: refetchStats, isFetching: statsFetching } = useCreatorDashboardStats()
  const { refetch: refetchAnalytics, isFetching: analyticsFetching } =
    useCreatorPerformanceChart(earningsRange)

  const refresh = useCallback(
    () => Promise.all([refetchStats(), refetchAnalytics(), refetchRecent()]),
    [refetchStats, refetchAnalytics, refetchRecent]
  )

  return {
    refresh,
    isRefreshing: statsFetching || analyticsFetching,
  }
}
