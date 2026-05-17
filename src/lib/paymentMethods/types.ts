export type PaymentMethod = {
  id: string
  type: 'gcash' | 'maya' | 'grabpay' | 'shopeepay' | 'bank'
  /** Provider / bank display title (e.g. "GCash", full bank legal name) */
  label: string
  /** Account number / phone (masked for display) */
  accountNumber: string
  accountName: string
  /** Full bank option label when `type === 'bank'` (matches bank picker). */
  bank?: string
  isDefault: boolean
}
