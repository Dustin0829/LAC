export type PaymentMethodSurface = 'creator' | 'brand'

export function paymentMethodErrorMessage(err: unknown, fallback = 'Could not save payment method.'): string {
  return err instanceof Error ? err.message : fallback
}

export function paymentMethodAddedMessage(surface: PaymentMethodSurface): string {
  return surface === 'creator' ? 'Payment method added.' : 'Refund receiving account saved.'
}

export function paymentMethodDefaultUpdatedMessage(surface: PaymentMethodSurface): string {
  return surface === 'creator'
    ? 'Default payment method updated.'
    : 'Default refund account updated — refunds will be sent here.'
}

export function paymentMethodRemovedMessage(surface: PaymentMethodSurface): string {
  return surface === 'creator' ? 'Payment method removed.' : 'Refund receiving account removed.'
}

export function paymentMethodDefaultRequiredMessage(): string {
  return 'Set another account as default before removing this one.'
}
