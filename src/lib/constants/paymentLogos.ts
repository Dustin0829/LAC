import type { PaymentMethod } from '@/lib/mockData'
import { getPaymentMethodIcon } from '@/lib/constants/paymentMethodIcons'

const EWALLET_LABEL_BY_TYPE: Record<Exclude<PaymentMethod['type'], 'bank'>, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  grabpay: 'GrabPay',
  shopeepay: 'ShopeePay',
}

/**
 * Logo URL for a saved {@link PaymentMethod} or picker row (Vite-resolved asset URLs).
 */
export function paymentLogoSrc(params: {
  type: PaymentMethod['type']
  bank?: string | null
}): string | undefined {
  const { type, bank } = params
  if (type === 'bank' && bank) {
    return getPaymentMethodIcon('local-bank', bank)
  }
  const label = EWALLET_LABEL_BY_TYPE[type as Exclude<PaymentMethod['type'], 'bank'>]
  if (label) return getPaymentMethodIcon('e-wallet', label)
  return undefined
}
