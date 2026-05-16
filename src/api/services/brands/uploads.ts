import api from '@/api/client'
import type { PresignUploadBody, PresignUploadData } from '@/api/types/brands/uploads.types'

export async function postUploadPresign(body: PresignUploadBody): Promise<PresignUploadData> {
  const res = await api.post<PresignUploadData>('/uploads/presign', body)
  return res.data
}
