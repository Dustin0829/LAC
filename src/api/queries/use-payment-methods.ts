import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
import {
  paymentMethodAddedMessage,
  paymentMethodDefaultUpdatedMessage,
  paymentMethodErrorMessage,
  paymentMethodRemovedMessage,
  type PaymentMethodSurface,
} from '@/lib/paymentMethods/paymentMethodMessages'
import { paymentMethodFromApi } from '@/lib/paymentMethods/paymentMethodApi'
import { useAuthStore } from '@/lib/stores/authStore'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'

export const paymentMethodsQueryKeys = {
  all: ['me', 'payment-methods'] as const,
  list: () => [...paymentMethodsQueryKeys.all, 'list'] as const,
}

export type PaymentMethodMutationOptions = {
  surface: PaymentMethodSurface
  suppressToasts?: boolean
}

function shouldToast(opts: PaymentMethodMutationOptions) {
  return !opts.suppressToasts
}

function syncPaymentMethodsStore(items: ReturnType<typeof paymentMethodFromApi>[]) {
  usePaymentMethodsStore.setState({ methods: items })
}

async function refetchAndSyncPaymentMethods(qc: QueryClient) {
  const role = useAuthStore.getState().role
  const items = await qc.fetchQuery({
    queryKey: [...paymentMethodsQueryKeys.list(), role] as const,
    queryFn: async () => {
      const data = await getPaymentMethods()
      const mapped = data.items.map(paymentMethodFromApi)
      syncPaymentMethodsStore(mapped)
      return mapped
    },
  })
  return items
}

/** `GET /me/payment-methods` — purpose from JWT role (creator vs brand). */
export function usePaymentMethods(enabled = true) {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)

  return useQuery({
    queryKey: [...paymentMethodsQueryKeys.list(), role] as const,
    queryFn: async () => {
      const data = await getPaymentMethods()
      const items = data.items.map(paymentMethodFromApi)
      syncPaymentMethodsStore(items)
      return items
    },
    enabled: enabled && Boolean(user && role),
  })
}

export function usePostPaymentMethod(options: PaymentMethodMutationOptions) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...paymentMethodsQueryKeys.all, 'create'] as const,
    mutationFn: (body: PostPaymentMethodBody) => postPaymentMethod(body),
    retry: false,
    onSuccess: async () => {
      await refetchAndSyncPaymentMethods(qc)
      if (shouldToast(options)) {
        toast.success(paymentMethodAddedMessage(options.surface))
      }
    },
    onError: (err) => {
      if (shouldToast(options)) {
        toast.error(paymentMethodErrorMessage(err))
      }
    },
  })
}

export function usePatchPaymentMethod(options: PaymentMethodMutationOptions) {
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
    onSuccess: async () => {
      await refetchAndSyncPaymentMethods(qc)
      if (shouldToast(options)) {
        toast.success(paymentMethodDefaultUpdatedMessage(options.surface))
      }
    },
    onError: (err) => {
      if (shouldToast(options)) {
        toast.error(paymentMethodErrorMessage(err, 'Could not update default account.'))
      }
    },
  })
}

export function useDeletePaymentMethod(options: PaymentMethodMutationOptions) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: [...paymentMethodsQueryKeys.all, 'delete'] as const,
    mutationFn: (paymentMethodId: string) => deletePaymentMethod(paymentMethodId),
    retry: false,
    onSuccess: async () => {
      await refetchAndSyncPaymentMethods(qc)
      if (shouldToast(options)) {
        toast.success(paymentMethodRemovedMessage(options.surface))
      }
    },
    onError: (err) => {
      if (shouldToast(options)) {
        toast.error(paymentMethodErrorMessage(err, 'Could not remove account.'))
      }
    },
  })
}
