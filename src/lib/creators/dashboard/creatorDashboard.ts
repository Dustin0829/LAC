import type {
  CreatorAnalyticsPeriodRow,
  CreatorDashboardData,
  CreatorDashboardStatsView,
  CreatorPerformanceChartRow,
  CreatorPerformanceRange,
} from '@/api/types/creator/dashboard.types'

export function creatorDashboardStatsFromApi(data: CreatorDashboardData): CreatorDashboardStatsView {
  return {
    lifetimeEarnings: Number(data.lifetimeEarnings) || 0,
    totalVerifiedViews: Number(data.totalVerifiedViews) || 0,
    allSubmissions: data.allSubmissions,
    pendingSubmissions: data.pendingSubmissions,
    submissionCounts: data.submissionCounts,
  }
}

function formatAnalyticsPeriodLabel(period: string, range: CreatorPerformanceRange): string {
  if (range === 'yearly') return period
  const [year, month] = period.split('-').map(Number)
  if (!year || !month) return period
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    timeZone: 'UTC',
  })
}

export function creatorPerformanceChartFromAnalytics(
  rows: CreatorAnalyticsPeriodRow[],
  range: CreatorPerformanceRange
): CreatorPerformanceChartRow[] {
  const sorted = [...rows].sort((a, b) => a.period.localeCompare(b.period))
  return sorted.map((row) => ({
    period: formatAnalyticsPeriodLabel(row.period, range),
    earnings: Number(row.earnings) || 0,
  }))
}
