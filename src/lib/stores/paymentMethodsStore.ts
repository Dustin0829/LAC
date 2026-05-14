import { create } from 'zustand'
import type { PaymentMethod } from '@/lib/mockData'

interface PaymentMethodsState {
  methods: PaymentMethod[]
  addMethod: (method: PaymentMethod) => void
  removeMethod: (id: string) => void
  setDefault: (id: string) => void
}

export const usePaymentMethodsStore = create<PaymentMethodsState>((set) => ({
  methods: [],
  addMethod: (method) =>
    set((s) => ({
      methods: s.methods.length === 0 ? [{ ...method, isDefault: true }] : [...s.methods, method],
    })),
  removeMethod: (id) =>
    set((s) => {
      const remaining = s.methods.filter((m) => m.id !== id)
      const removedWasDefault = s.methods.find((m) => m.id === id)?.isDefault
      if (removedWasDefault && remaining.length > 0) {
        remaining[0].isDefault = true
      }
      return { methods: remaining }
    }),
  setDefault: (id) =>
    set((s) => ({
      methods: s.methods.map((m) => ({ ...m, isDefault: m.id === id })),
    })),
}))
