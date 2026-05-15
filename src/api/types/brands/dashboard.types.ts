/** `GET /me/dashboard` — brand headline stats (API). */
export type BrandDashboardData = {
  totalCampaigns: number
  totalReached: string
  totalSpent: string
  avgCostPerView: string | null
}

/** Parsed dashboard stats for stat cards. */
export type BrandDashboardStatsView = {
  totalCampaigns: number
  totalReached: number
  totalSpent: number
  avgCostPerView: number | null
}

export type BrandAnalyticsPeriodRow = {
  period: string
  deposits: string
  spend: string
  views: string
  payout: string
}

export type BrandPerformanceRange = 'monthly' | 'yearly'

export type BrandMeAnalyticsParams = {
  granularity: BrandPerformanceRange
}

/** `GET /me/analytics?granularity=monthly|yearly` — single chart series. */
export type BrandMeAnalyticsData = {
  granularity: BrandPerformanceRange
  periods: BrandAnalyticsPeriodRow[]
}

/** Recharts row for brand campaign performance chart. */
export type BrandPerformanceChartRow = {
  period: string
  views: number
  payout: number
}
