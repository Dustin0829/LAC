/**
 * Payment method icons from `src/assets` (e-wallets, banks).
 * Mirrors option lists / lookups from BugHyve `paymentMethodIcons.ts`.
 */
import gcashIcon from '@/assets/e-wallets/gcash.svg'
import mayaIcon from '@/assets/e-wallets/maya.svg'
import grabPayIcon from '@/assets/e-wallets/grab-pay.svg'
import shopeePayIcon from '@/assets/e-wallets/shopee-pay.svg'
import bdoIcon from '@/assets/banks/bdo.svg'
import bpiIcon from '@/assets/banks/bpi.svg'
import metrobankIcon from '@/assets/banks/metrobank.svg'
import landbankIcon from '@/assets/banks/landbank.svg'
import pnbIcon from '@/assets/banks/pnb.svg'
import rcbcIcon from '@/assets/banks/rcbc.svg'
import securityBankIcon from '@/assets/banks/security-bank.svg'
import unionbankIcon from '@/assets/banks/unionbank.svg'
import cimbIcon from '@/assets/banks/cimb.svg'
import tonikIcon from '@/assets/banks/tonik.svg'
import gotymeIcon from '@/assets/banks/gotyme.svg'
import maribankIcon from '@/assets/banks/maribank.png'

export const eWalletIcons: Record<string, string> = {
  GCash: gcashIcon,
  Maya: mayaIcon,
  'PayMaya (Maya)': mayaIcon,
  GrabPay: grabPayIcon,
  ShopeePay: shopeePayIcon,
}

export const bankIcons: Record<string, string> = {
  'Banco De Oro Unibank, Inc. (BDO)': bdoIcon,
  'Bank of the Philippine Islands (BPI)': bpiIcon,
  'Metropolitan Bank and Trust Company (Metrobank)': metrobankIcon,
  'Land Bank of the Philippines (Landbank)': landbankIcon,
  'Philippine National Bank (PNB)': pnbIcon,
  'Rizal Commercial Banking Corporation (RCBC)': rcbcIcon,
  'Security Bank Corporation': securityBankIcon,
  'Union Bank of the Philippines (UBP)': unionbankIcon,
  'CIMB Bank Philippines': cimbIcon,
  'Tonik Digital Bank, Inc.': tonikIcon,
  'GoTyme Bank': gotymeIcon,
  MariBank: maribankIcon,
  'Union Digital Bank': unionbankIcon,
}

/** E-wallet options for dropdowns (excludes backward-compat key). */
export const E_WALLET_OPTIONS = Object.keys(eWalletIcons).filter(
  (k) => k !== 'PayMaya (Maya)'
) as readonly string[]

/** Local bank options for dropdowns (order matches `bankIcons`). */
export const LOCAL_BANK_OPTIONS = Object.keys(bankIcons) as readonly string[]

/** Cryptocurrency network labels (UI only; no bundled icons yet). */
export const CRYPTO_OPTIONS = ['Solana', 'Base'] as const

export function getPaymentMethodIcon(
  type: 'e-wallet' | 'local-bank' | 'cryptocurrency',
  label: string
): string | undefined {
  if (type === 'e-wallet') return eWalletIcons[label]
  if (type === 'local-bank') return bankIcons[label]
  return undefined
}
