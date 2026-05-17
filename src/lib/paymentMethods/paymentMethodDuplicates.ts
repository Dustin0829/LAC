import type { AddPaymentMethodFormValues } from '@/api/schema/paymentMethods.schema'
import type { PostPaymentMethodBody } from '@/api/types/payment-methods.types'
import { paymentChannelByDisplayName } from '@/lib/constants/paymentChannels'
import { buildPostPaymentMethodBody } from '@/lib/paymentMethods/paymentMethodApi'
import type { PaymentMethod } from '@/lib/paymentMethods/types'

export function paymentMethodDuplicateMessage() {
  return 'This payment method is already saved.'
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function lastFourFromMaskedOrDigits(value: string): string {
  return digitsOnly(value).slice(-4)
}

function channelCodeForPaymentMethod(method: PaymentMethod): string | null {
  if (method.type === 'bank') {
    const channel =
      paymentChannelByDisplayName(method.bank ?? '') ??
      paymentChannelByDisplayName(method.label)
    return channel?.channelCode ?? null
  }

  const byType: Record<Exclude<PaymentMethod['type'], 'bank'>, string> = {
    gcash: 'PH_GCASH',
    maya: 'PH_MAYA',
    grabpay: 'PH_GRABPAY',
    shopeepay: 'PH_SHOPEEPAY',
  }
  return byType[method.type as Exclude<PaymentMethod['type'], 'bank'>] ?? null
}

function accountsMatch(
  existingDigits: string,
  nextDigits: string,
  existingMasked: string
): boolean {
  if (existingDigits.length >= 4 && nextDigits.length >= 4) {
    return existingDigits === nextDigits
  }
  return (
    lastFourFromMaskedOrDigits(existingMasked) === nextDigits.slice(-4) &&
    nextDigits.length >= 4
  )
}

/** Client check before POST — compares channel + account digits (full when known, else last four). */
export function isDuplicatePostPaymentMethodBody(
  existing: PaymentMethod[],
  body: PostPaymentMethodBody
): boolean {
  const nextDigits = digitsOnly(body.accountNumber)
  const nextCode = body.xenditChannelCode.toUpperCase()

  return existing.some((method) => {
    const code = channelCodeForPaymentMethod(method)
    if (!code || code.toUpperCase() !== nextCode) return false

    const existingDigits = digitsOnly(method.accountNumber)
    if (!accountsMatch(existingDigits, nextDigits, method.accountNumber)) return false

    return (
      method.accountName.trim().toLowerCase() === body.accountName.trim().toLowerCase()
    )
  })
}

/** Local-only add flow — full account number is available in the store. */
export function isDuplicatePaymentMethodForm(
  existing: PaymentMethod[],
  form: AddPaymentMethodFormValues
): boolean {
  const body = buildPostPaymentMethodBody(form, false)
  return isDuplicatePostPaymentMethodBody(existing, body)
}
