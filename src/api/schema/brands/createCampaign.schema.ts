import { z } from 'zod'
import {
  CAMPAIGN_PLATFORMS,
  MIN_BRAND_RATE_PER_1K,
  MIN_PUBLISH_PHP,
} from '@/lib/constants'

const platformSchema = z.enum(CAMPAIGN_PLATFORMS)

/** `POST /brands/campaigns` body (runtime check before submit). */
export const createBrandCampaignBodySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string(),
  ratePer1k: z.number().min(MIN_BRAND_RATE_PER_1K),
  plannedGrossBudget: z.number().min(MIN_PUBLISH_PHP),
  platforms: z.array(platformSchema).min(1),
  rules: z.array(z.string().trim().min(1)).min(1),
  referenceLinks: z.array(z.string().url()).optional(),
  assetUrls: z.array(z.string().url()).optional(),
})
