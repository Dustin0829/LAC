import type { QueryClient } from '@tanstack/react-query'
import { getCreatorDashboard, getCreatorMeAnalytics } from '@/api/services/creator/dashboard'
import { getMeSubmissions } from '@/api/services/creator/submissions'
import { getBrandDashboard, getBrandMeAnalytics } from '@/api/services/brands/dashboard'
import { getBrandRecentSubmissions } from '@/api/services/brands/submissions'
import { creatorDashboardQueryKeys } from '@/api/queries/creator/use-dashboard'
import { creatorSubmissionsQueryKeys } from '@/api/queries/creator/use-submissions'
import { brandDashboardQueryKeys } from '@/api/queries/brands/use-dashboard'
import { brandSubmissionsQueryKeys } from '@/api/queries/brands/use-submissions'
import {
  creatorDashboardStatsFromApi,
  creatorPerformanceChartFromAnalytics,
} from '@/lib/creators/dashboard/creatorDashboard'
import {
  brandDashboardStatsFromApi,
  brandPerformanceChartFromAnalytics,
} from '@/lib/brands/dashboard/brandDashboard'
import { creatorSubmissionRowFromApi } from '@/lib/creators/submissions/creatorSubmissionRows'
import { brandSubmissionRowFromApi } from '@/lib/brands/submissions/brandSubmissionRows'
import { CREATOR_SUBMISSIONS_PAGE_SIZE } from '@/lib/constants'
import type { UserRole } from '@/lib/stores/authStore'

const DEFAULT_CHART_RANGE = 'monthly' as const

const creatorRecentListParams = {
  page: 1,
  limit: CREATOR_SUBMISSIONS_PAGE_SIZE,
  scope: 'recent' as const,
}

const brandRecentListParams = {
  page: 1,
  limit: CREATOR_SUBMISSIONS_PAGE_SIZE,
}

async function prefetchCreatorDashboard(qc: QueryClient): Promise<void> {
  await Promise.all([
    qc.prefetchQuery({
      queryKey: creatorDashboardQueryKeys.stats(),
      queryFn: async () => creatorDashboardStatsFromApi(await getCreatorDashboard()),
    }),
    qc.prefetchQuery({
      queryKey: creatorDashboardQueryKeys.analytics(DEFAULT_CHART_RANGE),
      queryFn: async () => {
        const data = await getCreatorMeAnalytics({ granularity: DEFAULT_CHART_RANGE })
        return creatorPerformanceChartFromAnalytics(data.periods, data.granularity)
      },
    }),
    qc.prefetchQuery({
      queryKey: creatorSubmissionsQueryKeys.list(creatorRecentListParams),
      queryFn: async () => {
        const { items, meta } = await getMeSubmissions(creatorRecentListParams)
        return {
          rows: items.map(creatorSubmissionRowFromApi),
          meta,
        }
      },
    }),
  ])
}

async function prefetchBrandDashboard(qc: QueryClient): Promise<void> {
  await Promise.all([
    qc.prefetchQuery({
      queryKey: brandDashboardQueryKeys.stats(),
      queryFn: async () => brandDashboardStatsFromApi(await getBrandDashboard()),
    }),
    qc.prefetchQuery({
      queryKey: brandDashboardQueryKeys.analytics(DEFAULT_CHART_RANGE),
      queryFn: async () => {
        const data = await getBrandMeAnalytics({ granularity: DEFAULT_CHART_RANGE })
        return brandPerformanceChartFromAnalytics(data.periods, data.granularity)
      },
    }),
    qc.prefetchQuery({
      queryKey: brandSubmissionsQueryKeys.recent(brandRecentListParams),
      queryFn: async () => {
        const { items, meta } = await getBrandRecentSubmissions(brandRecentListParams)
        return {
          rows: items.map(brandSubmissionRowFromApi),
          meta,
        }
      },
    }),
  ])
}

/** Warm dashboard queries while the bootstrap splash is visible. */
export async function prefetchDashboardData(
  qc: QueryClient,
  role: UserRole | null
): Promise<void> {
  if (!role) return
  try {
    if (role === 'creator') {
      await prefetchCreatorDashboard(qc)
    } else if (role === 'brand') {
      await prefetchBrandDashboard(qc)
    }
  } catch {
    /* Prefetch failure must not block leaving the splash. */
  }
}
