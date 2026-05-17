import api from '@/api/client'
import type {
  CreatorDashboardData,
  CreatorMeAnalyticsData,
  CreatorMeAnalyticsParams,
} from '@/api/types/creator/dashboard.types'

export async function getCreatorDashboard(): Promise<CreatorDashboardData> {
  const res = await api.get<CreatorDashboardData>('/me/dashboard')
  return res.data
}

export async function getCreatorMeAnalytics(
  params: CreatorMeAnalyticsParams
): Promise<CreatorMeAnalyticsData> {
  const res = await api.get<CreatorMeAnalyticsData>('/me/analytics', { params })
  return res.data
}
