/**
 * Xendit PH payout channels we expose in the UI (subset of the full allowlist).
 * `channelName` matches Xendit’s official channel name; `displayName` is the picker label.
 */
export type PaymentChannelKind = 'e_wallet' | 'bank'

export interface PaymentChannelOption {
  channelCode: string
  channelName: string
  displayName: string
  kind: PaymentChannelKind
}

/** E-wallets shown in Add payment method (icons in paymentMethodIcons.ts). */
export const E_WALLET_CHANNELS: readonly PaymentChannelOption[] = [
  {
    channelCode: 'PH_GCASH',
    channelName: 'GCash',
    displayName: 'GCash',
    kind: 'e_wallet',
  },
  {
    channelCode: 'PH_MAYA',
    channelName: 'Maya Bank, Inc.',
    displayName: 'Maya',
    kind: 'e_wallet',
  },
  {
    channelCode: 'PH_GRABPAY',
    channelName: 'Grabpay',
    displayName: 'GrabPay',
    kind: 'e_wallet',
  },
  {
    channelCode: 'PH_SHOPEEPAY',
    channelName: 'ShopeePay',
    displayName: 'ShopeePay',
    kind: 'e_wallet',
  },
] as const

/** Banks shown in Add payment method (icons in paymentMethodIcons.ts). */
export const BANK_CHANNELS: readonly PaymentChannelOption[] = [
  {
    channelCode: 'PH_BDO',
    channelName: 'Banco De Oro Unibank, Inc.',
    displayName: 'BDO',
    kind: 'bank',
  },
  {
    channelCode: 'PH_BPI',
    channelName: 'Bank of the Philippine Islands (BPI)',
    displayName: 'BPI',
    kind: 'bank',
  },
  {
    channelCode: 'PH_MET',
    channelName: 'Metropolitan Bank and Trust Company (Metrobank)',
    displayName: 'Metrobank',
    kind: 'bank',
  },
  {
    channelCode: 'PH_LBP',
    channelName: 'Land Bank of The Philippines',
    displayName: 'Landbank',
    kind: 'bank',
  },
  {
    channelCode: 'PH_PNB',
    channelName: 'Philippine National Bank (PNB)',
    displayName: 'PNB',
    kind: 'bank',
  },
  {
    channelCode: 'PH_RCBC',
    channelName: 'Rizal Commercial Banking Corporation (RCBC)',
    displayName: 'RCBC',
    kind: 'bank',
  },
  {
    channelCode: 'PH_SEC',
    channelName: 'Security Bank Corporation',
    displayName: 'Security Bank',
    kind: 'bank',
  },
  {
    channelCode: 'PH_UBP',
    channelName: 'Union Bank of the Philippines (UBP)',
    displayName: 'UnionBank',
    kind: 'bank',
  },
  {
    channelCode: 'PH_CIMB',
    channelName: 'CIMB Bank Philippines',
    displayName: 'CIMB',
    kind: 'bank',
  },
  {
    channelCode: 'PH_TONIK',
    channelName: 'Tonik Digital Bank, Inc.',
    displayName: 'Tonik',
    kind: 'bank',
  },
  {
    channelCode: 'PH_GOTYME',
    channelName: 'GoTyme Bank',
    displayName: 'GoTyme',
    kind: 'bank',
  },
  {
    channelCode: 'PH_SEA',
    channelName: 'Seabank Philippines Inc.',
    displayName: 'MariBank',
    kind: 'bank',
  },
  {
    channelCode: 'PH_UDP',
    channelName: 'Union Digital Bank',
    displayName: 'Union Digital Bank',
    kind: 'bank',
  },
] as const

const byDisplayName = new Map<string, PaymentChannelOption>()

for (const ch of [...E_WALLET_CHANNELS, ...BANK_CHANNELS]) {
  byDisplayName.set(ch.displayName, ch)
}

export function paymentChannelByDisplayName(displayName: string): PaymentChannelOption | undefined {
  return byDisplayName.get(displayName)
}

export function paymentChannelByCode(channelCode: string): PaymentChannelOption | undefined {
  const code = channelCode.trim().toUpperCase()
  return [...E_WALLET_CHANNELS, ...BANK_CHANNELS].find((ch) => ch.channelCode === code)
}

/** Resolve a saved/API bank label (legal name or picker label) to a known channel. */
export function paymentChannelByBankLabel(bankLabel: string): PaymentChannelOption | undefined {
  const trimmed = bankLabel.trim()
  if (!trimmed) return undefined

  const byDisplay = byDisplayName.get(trimmed)
  if (byDisplay?.kind === 'bank') return byDisplay

  const lower = trimmed.toLowerCase()
  return BANK_CHANNELS.find((ch) => {
    if (ch.displayName === trimmed) return true
    if (ch.channelName === trimmed) return true
    const channelLower = ch.channelName.toLowerCase()
    return channelLower === lower || channelLower.startsWith(`${lower} `) || lower.startsWith(channelLower)
  })
}

export const BANK_CHANNEL_CODES = new Set(
  BANK_CHANNELS.map((ch) => ch.channelCode)
)

export const E_WALLET_CHANNEL_CODES = new Set(
  E_WALLET_CHANNELS.map((ch) => ch.channelCode)
)
