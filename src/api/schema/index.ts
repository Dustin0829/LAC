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
} from './brands/profile.schema'

export { createBrandCampaignBodySchema } from './brands/createCampaign.schema'

export {
  addPaymentMethodFormSchema,
  addPaymentMethodFormFieldErrors,
  paymentMethodTypeSchema,
  postPaymentMethodBodySchema,
  type AddPaymentMethodFormValues,
  type AddPaymentMethodFormField,
  type PaymentMethodType,
} from './paymentMethods.schema'
