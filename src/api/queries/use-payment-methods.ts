import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deletePaymentMethod,
  getPaymentMethods,
  patchPaymentMethod,
  postPaymentMethod,
} from '@/api/services/payment-methods'
import type {
  PatchPaymentMethodBody,
  PostPaymentMethodBody,
} from '@/api/types/payment-methods.types'
import { paymentMethodFromApi } from '@/lib/paymentMethods/paymentMethodApi'
import { useAuthStore } from '@/lib/stores/authStore'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'

export const paymentMethodsQueryKeys = {
  all: ['me', 'payment-methods'] as const,
  list: () => [...paymentMethodsQueryKeys.all, 'list'] as const,
}

function syncPaymentMethodsStore(items: ReturnType<typeof paymentMethodFromApi>[]) {
  usePaymentMethodsStore.setState({ methods: items })
}

/** `GET /me/payment-methods` — purpose from JWT role (creator vs brand). */
export function usePaymentMethods(enabled = true) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const role = useAuthStore((s) => s.role)

  return useQuery({
    queryKey: [...paymentMethodsQueryKeys.list(), role] as const,
    queryFn: async () => {
      const data = await getPaymentMethods()
      const items = data.items.map(paymentMethodFromApi)
      syncPaymentMethodsStore(items)
      return items
    },
    enabled: enabled && Boolean(accessToken && role),
  })
}

export function usePostPaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...paymentMethodsQueryKeys.all, 'create'] as const,
    mutationFn: (body: PostPaymentMethodBody) => postPaymentMethod(body),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentMethodsQueryKeys.list() })
    },
  })
}

export function usePatchPaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...paymentMethodsQueryKeys.all, 'patch'] as const,
    mutationFn: ({
      paymentMethodId,
      body,
    }: {
      paymentMethodId: string
      body: PatchPaymentMethodBody
    }) => patchPaymentMethod(paymentMethodId, body),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentMethodsQueryKeys.list() })
    },
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...paymentMethodsQueryKeys.all, 'delete'] as const,
    mutationFn: (paymentMethodId: string) => deletePaymentMethod(paymentMethodId),
    retry: false,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentMethodsQueryKeys.list() })
    },
  })
}
