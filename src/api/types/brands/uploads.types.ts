export type CampaignCoverContentType = 'image/jpeg' | 'image/png' | 'image/webp'

export type PresignUploadBody = {
  purpose: 'brand_logo' | 'campaign_cover'
  contentType: CampaignCoverContentType
  campaignId?: string
}

export type PresignUploadData = {
  uploadUrl: string
  objectKey: string
  publicUrl: string | null
  method: 'PUT'
  expiresIn: number
  maxBytes: number
  headers: { 'Content-Type': string }
}
