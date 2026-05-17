export type PaymentMethod = {
  id: string
  type: 'gcash' | 'maya' | 'grabpay' | 'shopeepay' | 'bank'
  /** Provider / bank display title (e.g. "GCash", full bank legal name) */
  label: string
  /** Account number / phone (masked for display) */
  accountNumber: string
  accountName: string
  /** Short bank picker key (e.g. `BDO`) for icons; `label` holds the display title. */
  bank?: string
  isDefault: boolean
}
