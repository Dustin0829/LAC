import api from '@/api/client'
import type {
  BrandDashboardData,
  BrandMeAnalyticsData,
  BrandMeAnalyticsParams,
} from '@/api/types/brands/dashboard.types'

export async function getBrandDashboard(): Promise<BrandDashboardData> {
  const res = await api.get<BrandDashboardData>('/me/dashboard')
  return res.data
}

export async function getBrandMeAnalytics(
  params: BrandMeAnalyticsParams
): Promise<BrandMeAnalyticsData> {
  const res = await api.get<BrandMeAnalyticsData>('/me/analytics', { params })
  return res.data
}
