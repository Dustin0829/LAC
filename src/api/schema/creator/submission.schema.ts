import { z } from 'zod'

export const campaignSubmissionBodySchema = z
  .object({
    url: z.string().trim().url('Enter a valid content URL'),
    platform: z.enum(['tiktok', 'facebook']),
  })
  .strict()

export type CampaignSubmissionBodyInput = z.infer<typeof campaignSubmissionBodySchema>

export function parseCampaignSubmissionBody(url: string, platform: string) {
  return campaignSubmissionBodySchema.safeParse({ url: url.trim(), platform })
}
