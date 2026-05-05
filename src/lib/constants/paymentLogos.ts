import type { PaymentMethod } from '@/lib/mockData'

const BASE = '/payment-logos'

/** Short labels used in bank picker — maps to vendored SVG filenames under `public/payment-logos/`. */
export const BANK_LOGO_FILES: Record<string, string> = {
  BPI: 'bpi.svg',
  BDO: 'bdo.svg',
  Metrobank: 'metrobank.svg',
  UnionBank: 'unionbank.svg',
  Landbank: 'landbank.svg',
  PNB: 'pnb.svg',
  'Security Bank': 'securitybank.svg',
}

export function paymentLogoSrc(params: {
  type: PaymentMethod['type']
  bank?: string | null
}): string | null {
  const { type, bank } = params
  if (type === 'gcash') return `${BASE}/gcash.svg`
  if (type === 'maya') return `${BASE}/maya.svg`
  if (type === 'bank' && bank) {
    const file = BANK_LOGO_FILES[bank]
    return file ? `${BASE}/${file}` : null
  }
  return null
}
