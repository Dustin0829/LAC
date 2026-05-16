import { z } from 'zod'
import { paymentChannelByDisplayName } from '@/lib/constants/paymentChannels'
import { LOCAL_BANK_OPTIONS, E_WALLET_OPTIONS } from '@/lib/constants/paymentMethodIcons'

export const paymentMethodTypeSchema = z.enum(['e-wallet', 'local-bank'])

export type PaymentMethodType = z.infer<typeof paymentMethodTypeSchema>

const providerLabelsForType = (methodType: PaymentMethodType) =>
  methodType === 'e-wallet' ? E_WALLET_OPTIONS : LOCAL_BANK_OPTIONS

export const addPaymentMethodFormSchema = z
  .object({
    methodType: paymentMethodTypeSchema,
    provider: z.string().trim(),
    accountNumber: z
      .string()
      .trim()
      .min(1, 'Account number is required')
      .min(4, 'Account number must be at least 4 digits')
      .max(80, 'Account number is too long')
      .regex(/^\d+$/, 'Account number must contain only digits'),
    accountName: z
      .string()
      .trim()
      .min(1, 'Account name is required')
      .max(200, 'Account name is too long'),
  })
  .superRefine((data, ctx) => {
    if (!data.provider) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.methodType === 'e-wallet' ? 'Please select a provider' : 'Please select a bank',
        path: ['provider'],
      })
      return
    }

    const allowed = providerLabelsForType(data.methodType)
    if (!allowed.includes(data.provider)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unsupported payment provider for payouts.',
        path: ['provider'],
      })
      return
    }

    const channel = paymentChannelByDisplayName(data.provider)
    if (!channel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unsupported payment provider for payouts.',
        path: ['provider'],
      })
      return
    }

    const expectedKind = data.methodType === 'local-bank' ? 'bank' : 'e_wallet'
    if (channel.kind !== expectedKind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unsupported payment provider for payouts.',
        path: ['provider'],
      })
    }
  })

export type AddPaymentMethodFormValues = z.infer<typeof addPaymentMethodFormSchema>

export type AddPaymentMethodFormField = keyof AddPaymentMethodFormValues

export function addPaymentMethodFormFieldErrors(
  error: z.ZodError
): Partial<Record<AddPaymentMethodFormField, string>> {
  const out: Partial<Record<AddPaymentMethodFormField, string>> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !(key in out)) {
      out[key as AddPaymentMethodFormField] = issue.message
    }
  }
  return out
}

/** API body aligned with backend `postPaymentMethodBodySchema`. */
export const postPaymentMethodBodySchema = z.object({
  xenditChannelCode: z.string().min(1).max(40),
  label: z.string().min(1).max(120),
  bankName: z.string().min(1).max(120).optional(),
  accountNumber: z.string().min(4).max(80),
  accountName: z.string().min(1).max(200),
  isDefault: z.boolean().optional(),
})

export type PostPaymentMethodBodySchema = z.infer<typeof postPaymentMethodBodySchema>
