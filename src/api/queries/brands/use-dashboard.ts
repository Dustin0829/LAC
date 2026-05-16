import { useQuery } from '@tanstack/react-query'
import { getBrandDashboard, getBrandMeAnalytics } from '@/api/services/brands/dashboard'
import type { BrandPerformanceRange } from '@/api/types/brands/dashboard.types'
import {
  brandDashboardStatsFromApi,
  brandPerformanceChartFromAnalytics,
} from '@/lib/brands/dashboard/brandDashboard'
import { useBrandAuthEnabled } from '@/api/queries/brands/auth'

export const brandDashboardQueryKeys = {
  all: ['brands', 'dashboard'] as const,
  stats: () => [...brandDashboardQueryKeys.all, 'stats'] as const,
  analytics: (granularity: BrandPerformanceRange) =>
    [...brandDashboardQueryKeys.all, 'analytics', granularity] as const,
}

/** Brand dashboard stat cards (`GET /me/dashboard`). */
export function useBrandDashboardStats() {
  const enabled = useBrandAuthEnabled()
  return useQuery({
    queryKey: brandDashboardQueryKeys.stats(),
    queryFn: async () => brandDashboardStatsFromApi(await getBrandDashboard()),
    enabled,
  })
}

/** Chart rows for the selected monthly/yearly range (`GET /me/analytics?granularity=…`). */
export function useBrandPerformanceChart(granularity: BrandPerformanceRange) {
  const enabled = useBrandAuthEnabled()
  const query = useQuery({
    queryKey: brandDashboardQueryKeys.analytics(granularity),
    queryFn: async () => {
      const data = await getBrandMeAnalytics({ granularity })
      return brandPerformanceChartFromAnalytics(data.periods, data.granularity)
    },
    enabled,
  })
  return { ...query, chartData: query.data ?? [] }
}
