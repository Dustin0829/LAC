import api from '@/api/client'
import type {
  DeletePaymentMethodData,
  PatchPaymentMethodBody,
  PaymentMethodMutationData,
  PaymentMethodsListData,
  PostPaymentMethodBody,
} from '@/api/types/payment-methods.types'

export async function getPaymentMethods(): Promise<PaymentMethodsListData> {
  const res = await api.get<PaymentMethodsListData>('/me/payment-methods')
  return res.data
}

export async function postPaymentMethod(
  body: PostPaymentMethodBody
): Promise<PaymentMethodMutationData> {
  const res = await api.post<PaymentMethodMutationData>('/me/payment-methods', body)
  return res.data
}

export async function patchPaymentMethod(
  paymentMethodId: string,
  body: PatchPaymentMethodBody
): Promise<PaymentMethodMutationData> {
  const res = await api.patch<PaymentMethodMutationData>(
    `/me/payment-methods/${paymentMethodId}`,
    body
  )
  return res.data
}

export async function deletePaymentMethod(
  paymentMethodId: string
): Promise<DeletePaymentMethodData> {
  const res = await api.delete<DeletePaymentMethodData>(`/me/payment-methods/${paymentMethodId}`)
  return res.data
}
