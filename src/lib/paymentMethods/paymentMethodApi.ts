import type { AddPaymentMethodFormValues } from '@/api/schema/paymentMethods.schema'
import type {
  PatchPaymentMethodBody,
  PaymentMethodDto,
  PostPaymentMethodBody,
} from '@/api/types/payment-methods.types'
import {
  BANK_CHANNEL_CODES,
  E_WALLET_CHANNEL_CODES,
  paymentChannelByCode,
  paymentChannelByDisplayName,
} from '@/lib/constants/paymentChannels'
import type { PaymentMethod } from '@/lib/mockData'

const E_WALLET_UI_TYPES = new Set<Exclude<PaymentMethod['type'], 'bank'>>([
  'gcash',
  'maya',
  'grabpay',
  'shopeepay',
])

const XENDIT_TO_UI_TYPE: Record<string, Exclude<PaymentMethod['type'], 'bank'>> = {
  PH_GCASH: 'gcash',
  PH_MAYA: 'maya',
  PH_PAYMAYA: 'maya',
  PH_GRABPAY: 'grabpay',
  PH_SHOPEEPAY: 'shopeepay',
}

export function paymentMethodFromApi(dto: PaymentMethodDto): PaymentMethod {
  const code = dto.xenditChannelCode.toUpperCase()
  const channel = paymentChannelByCode(code)

  if (dto.kind === 'bank' || BANK_CHANNEL_CODES.has(code)) {
    const bank = dto.bankName ?? channel?.displayName ?? channel?.channelName ?? dto.label
    return {
      id: dto.id,
      type: 'bank',
      label: bank,
      bank,
      accountNumber: maskBankAccountNumber(dto.lastFour),
      accountName: dto.accountName,
      isDefault: dto.isDefault,
    }
  }

  const type = XENDIT_TO_UI_TYPE[code] ?? 'gcash'
  const label = channel?.displayName ?? dto.label
  return {
    id: dto.id,
    type,
    label,
    accountNumber: maskEWalletAccountNumber(dto.lastFour),
    accountName: dto.accountName,
    isDefault: dto.isDefault,
  }
}

export function isEWalletPaymentMethod(method: PaymentMethod): boolean {
  return E_WALLET_UI_TYPES.has(method.type as Exclude<PaymentMethod['type'], 'bank'>)
}

function extractLastFour(accountNumber: string): string {
  return accountNumber.replace(/\D/g, '').slice(-4)
}

/** Mask bank accounts — variable length; show last four only. */
function maskBankAccountNumber(lastFour: string): string {
  const digits = extractLastFour(lastFour)
  return digits ? `•••• ${digits}` : '••••'
}

/** Domestic display grouping for PH e-wallet mobiles: 09XX XXX XXXX (11 digits). */
export const PH_EWALLET_MOBILE_DISPLAY_PATTERN = /^09•• ••• •(\d{4}|••••)$/

/** Mask e-wallet numbers as 09XX XXX XXXX (09•• ••• ••••). */
function maskEWalletAccountNumber(lastFour: string): string {
  const digits = extractLastFour(lastFour)
  return digits ? `09•• ••• •${digits}` : '09•• ••• ••••'
}

/** Account / mobile number for lists and refund confirmation. */
export function formatPaymentMethodAccountNumber(method: PaymentMethod): string {
  if (!isEWalletPaymentMethod(method)) {
    return maskBankAccountNumber(extractLastFour(method.accountNumber))
  }

  const raw = method.accountNumber.trim()
  if (PH_EWALLET_MOBILE_DISPLAY_PATTERN.test(raw)) return raw

  if (/^09•• •••• \d{4}$/.test(raw)) {
    return maskEWalletAccountNumber(extractLastFour(raw))
  }

  if (/^••••\s*\d{4}$/.test(raw)) {
    return maskEWalletAccountNumber(extractLastFour(raw))
  }

  const digits = raw.replace(/\D/g, '')
  if (digits.length >= 4) {
    return maskEWalletAccountNumber(digits.slice(-4))
  }

  return maskEWalletAccountNumber('')
}

/**
 * Normalize PH e-wallet mobiles to 11 digits (09XXXXXXXXX).
 * Accepts 09XXXXXXXXX, 9XXXXXXXXX, or 639XXXXXXXXX.
 */
export function normalizeEWalletAccountNumber(digits: string): string | null {
  if (/^639\d{9}$/.test(digits)) return `0${digits.slice(2)}`
  if (/^9\d{9}$/.test(digits)) return `0${digits}`
  if (/^09\d{9}$/.test(digits)) return digits
  return null
}

export function isValidEWalletAccountNumber(digits: string): boolean {
  return normalizeEWalletAccountNumber(digits) !== null
}

export function buildPostPaymentMethodBody(
  form: AddPaymentMethodFormValues,
  isDefault: boolean
): PostPaymentMethodBody {
  const channel = paymentChannelByDisplayName(form.provider)!
  const digits = form.accountNumber.replace(/\D/g, '')
  const accountNumber =
    channel.kind === 'e_wallet' ? (normalizeEWalletAccountNumber(digits) ?? digits) : digits
  const body: PostPaymentMethodBody = {
    xenditChannelCode: channel.channelCode,
    label: channel.displayName,
    accountNumber,
    accountName: form.accountName,
    isDefault,
  }

  if (channel.kind === 'bank') {
    body.bankName = channel.channelName
  }

  return body
}

export function buildPatchPaymentMethodBody(patch: {
  isDefault?: boolean
  label?: string
}): PatchPaymentMethodBody {
  const body: PatchPaymentMethodBody = {}
  if (patch.isDefault !== undefined) body.isDefault = patch.isDefault
  if (patch.label !== undefined) body.label = patch.label
  return body
}

/** Codes the UI can add today (backend allowlist may be smaller). */
export function isKnownPaymentChannelCode(code: string): boolean {
  const upper = code.toUpperCase()
  return BANK_CHANNEL_CODES.has(upper) || E_WALLET_CHANNEL_CODES.has(upper)
}

export function paymentMethodDisplayTitle(method: PaymentMethod): string {
  if (method.label === 'PayMaya (Maya)') return 'Maya'
  if (method.type === 'bank') return method.bank ?? method.label
  return method.label
}

export function paymentMethodDisplayDetail(method: PaymentMethod): string {
  return `${method.accountName} · ${formatPaymentMethodAccountNumber(method)}`
}
