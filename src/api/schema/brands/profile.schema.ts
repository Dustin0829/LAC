import { z } from 'zod'

/** Social link keys on brand profile forms (excludes `brandName`). */
export const brandProfileLinkKeys = ['website', 'instagram', 'facebook', 'tiktok'] as const

export type BrandProfileLinkKey = (typeof brandProfileLinkKeys)[number]

const optionalLink = z.string().trim()

export const brandProfileFormSchema = z.object({
  brandName: z.string().trim(),
  logoDataUrl: z.string().nullable(),
  website: optionalLink,
  instagram: optionalLink,
  facebook: optionalLink,
  tiktok: optionalLink,
})

export type BrandProfileFormValues = z.infer<typeof brandProfileFormSchema>

/** Validates profile before save (brand name required). */
export const brandProfileSaveSchema = brandProfileFormSchema.extend({
  brandName: z.string().trim().min(1, 'Brand name is required'),
})

export function emptyBrandProfileForm(): BrandProfileFormValues {
  return {
    brandName: '',
    logoDataUrl: null,
    website: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  }
}
