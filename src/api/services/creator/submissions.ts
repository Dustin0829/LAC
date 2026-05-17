import api from '@/api/client'
import type { PaginationMeta } from '@/api/types/global.types'
import type { ListMeSubmissionsParams, MeSubmissionsListData } from '@/api/types/creator/submissions.types'

export async function getMeSubmissions(
  params: ListMeSubmissionsParams = {}
): Promise<{ items: MeSubmissionsListData['items']; meta: PaginationMeta }> {
  const res = await api.get<MeSubmissionsListData>('/me/submissions', { params })
  const meta = (res as { meta?: PaginationMeta }).meta
  if (!meta) {
    throw new Error('Missing pagination metadata from submissions list.')
  }
  return { items: res.data.items, meta }
}
