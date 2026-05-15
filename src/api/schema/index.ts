/**
 * Zod schemas for request bodies and forms (`z.infer`, resolvers).
 * Pages import from `@/api/schema/...` per api-layer rules.
 */

export {
  brandProfileFormSchema,
  brandProfileSaveSchema,
  brandProfileLinkKeys,
  emptyBrandProfileForm,
  type BrandProfileFormValues,
  type BrandProfileLinkKey,
} from './brandProfile.schema'
