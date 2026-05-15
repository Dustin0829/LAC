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
    const bank =
      dto.bankName ??
      channel?.displayName ??
      channel?.channelName ??
      dto.label
    return {
      id: dto.id,
      type: 'bank',
      label: bank,
      bank,
      accountNumber: maskLastFour(dto.lastFour),
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
    accountNumber: maskLastFour(dto.lastFour),
    accountName: dto.accountName,
    isDefault: dto.isDefault,
  }
}

function maskLastFour(lastFour: string): string {
  const digits = lastFour.replace(/\D/g, '').slice(-4)
  return digits ? `•••• ${digits}` : '••••'
}

export function buildPostPaymentMethodBody(input: {
  methodType: 'e-wallet' | 'local-bank'
  providerLabel: string
  accountNumber: string
  accountName: string
  isDefault: boolean
}): PostPaymentMethodBody {
  const channel = paymentChannelByDisplayName(input.providerLabel)
  if (!channel) {
    throw new Error('Unsupported payment provider for payouts.')
  }

  const expectedKind = input.methodType === 'local-bank' ? 'bank' : 'e_wallet'
  if (channel.kind !== expectedKind) {
    throw new Error('Unsupported payment provider for payouts.')
  }

  const body: PostPaymentMethodBody = {
    xenditChannelCode: channel.channelCode,
    label: channel.displayName,
    accountNumber: input.accountNumber.trim(),
    accountName: input.accountName.trim(),
    isDefault: input.isDefault,
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
