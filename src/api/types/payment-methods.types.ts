export type PaymentMethodDto = {
  id: string
  purpose: string
  kind: 'e_wallet' | 'bank'
  xenditChannelCode: string
  label: string
  bankName: string | null
  lastFour: string
  accountName: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type PaymentMethodsListData = {
  items: PaymentMethodDto[]
}

export type PostPaymentMethodBody = {
  xenditChannelCode: string
  label: string
  bankName?: string
  accountNumber: string
  accountName: string
  isDefault?: boolean
}

export type PatchPaymentMethodBody = {
  isDefault?: boolean
  label?: string
  bankName?: string | null
}

export type PaymentMethodMutationData = {
  method: PaymentMethodDto
}

export type DeletePaymentMethodData = {
  ok: true
}
