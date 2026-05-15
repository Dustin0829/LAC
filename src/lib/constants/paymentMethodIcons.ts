/**
 * Payment method icons from `src/assets` (e-wallets, banks).
 * Option lists are driven by `paymentChannels.ts` (official channel name + code).
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
import {
  BANK_CHANNELS,
  E_WALLET_CHANNELS,
  type PaymentChannelOption,
} from '@/lib/constants/paymentChannels'

/** Icons keyed by picker `displayName` (see paymentChannels.ts). */
export const eWalletIcons: Record<string, string> = {
  GCash: gcashIcon,
  Maya: mayaIcon,
  GrabPay: grabPayIcon,
  ShopeePay: shopeePayIcon,
}

export const bankIcons: Record<string, string> = {
  BDO: bdoIcon,
  BPI: bpiIcon,
  Metrobank: metrobankIcon,
  Landbank: landbankIcon,
  PNB: pnbIcon,
  RCBC: rcbcIcon,
  'Security Bank': securityBankIcon,
  UnionBank: unionbankIcon,
  CIMB: cimbIcon,
  Tonik: tonikIcon,
  GoTyme: gotymeIcon,
  MariBank: maribankIcon,
  'Union Digital Bank': unionbankIcon,
}

export const E_WALLET_OPTIONS = E_WALLET_CHANNELS.map((ch) => ch.displayName)

export const LOCAL_BANK_OPTIONS = BANK_CHANNELS.map((ch) => ch.displayName)

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

export function getPaymentChannelForPicker(
  type: 'e-wallet' | 'local-bank',
  displayName: string
): PaymentChannelOption | undefined {
  const list = type === 'e-wallet' ? E_WALLET_CHANNELS : BANK_CHANNELS
  return list.find((ch) => ch.displayName === displayName)
}
