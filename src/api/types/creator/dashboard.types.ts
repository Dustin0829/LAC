/** `GET /me/dashboard` — creator headline stats (API). */
export type CreatorDashboardData = {
  lifetimeEarnings: string
  totalVerifiedViews: string
  allSubmissions: number
  pendingSubmissions: number
  submissionCounts: {
    all: number
    pending: number
    paid: number
    rejected: number
  }
}

export type CreatorDashboardStatsView = {
  lifetimeEarnings: number
  totalVerifiedViews: number
  allSubmissions: number
  pendingSubmissions: number
  submissionCounts: CreatorDashboardData['submissionCounts']
}

export type CreatorAnalyticsPeriodRow = {
  period: string
  earnings: string
}

export type CreatorPerformanceRange = 'monthly' | 'yearly'

export type CreatorMeAnalyticsParams = {
  granularity: CreatorPerformanceRange
}

export type CreatorMeAnalyticsData = {
  granularity: CreatorPerformanceRange
  periods: CreatorAnalyticsPeriodRow[]
}

export type CreatorPerformanceChartRow = {
  period: string
  earnings: number
}
