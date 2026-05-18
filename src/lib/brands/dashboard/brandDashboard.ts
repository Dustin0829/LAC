import type {
  BrandAnalyticsPeriodRow,
  BrandDashboardData,
  BrandDashboardStatsView,
  BrandPerformanceChartRow,
  BrandPerformanceRange,
} from '@/api/types/brands/dashboard.types'

export function brandDashboardStatsFromApi(data: BrandDashboardData): BrandDashboardStatsView {
  return {
    totalCampaigns: data.totalCampaigns,
    totalReached: Number(data.totalReached) || 0,
    totalSpent: Number(data.totalSpent) || 0,
    avgCostPerView: data.avgCostPerView != null ? Number(data.avgCostPerView) : null,
  }
}

function formatAnalyticsPeriodLabel(period: string, range: BrandPerformanceRange): string {
  if (range === 'yearly') return period
  const [year, month] = period.split('-').map(Number)
  if (!year || !month) return period
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  })
}

export function brandPerformanceChartFromAnalytics(
  rows: BrandAnalyticsPeriodRow[],
  range: BrandPerformanceRange
): BrandPerformanceChartRow[] {
  return rows.map((row) => ({
    period: formatAnalyticsPeriodLabel(row.period, range),
    views: Number(row.views) || 0,
    payout: Number(row.payout) || 0,
  }))
}

/** True when at least one period has views or payout (not an all-zero placeholder series). */
export function brandPerformanceChartHasActivity(rows: BrandPerformanceChartRow[]): boolean {
  return rows.some((row) => row.views > 0 || row.payout > 0)
}
