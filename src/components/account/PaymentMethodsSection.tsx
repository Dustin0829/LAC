import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'
import { AddPaymentMethodDialog } from '@/components/account/AddPaymentMethodDialog'
import { PaymentBrandLogo } from '@/components/account/PaymentBrandLogo'
import { Button } from '@/components/ui/button'
import type { PaymentMethod } from '@/lib/mockData'

const VISIBLE_BEFORE_OVERFLOW = 3

function rowTitle(m: PaymentMethod): string {
  if (m.label === 'PayMaya (Maya)') return 'Maya'
  if (m.type === 'bank') return m.bank ?? m.label
  return m.label
}

function rowDetail(m: PaymentMethod): string {
  return `${m.accountName} • ${m.accountNumber}`
}

interface PaymentMethodsSectionProps {
  mode: 'creator' | 'brand'
}

export function PaymentMethodsSection({ mode }: PaymentMethodsSectionProps) {
  const methods = usePaymentMethodsStore((s) => s.methods)
  const removeMethod = usePaymentMethodsStore((s) => s.removeMethod)
  const setDefault = usePaymentMethodsStore((s) => s.setDefault)

  const [addOpen, setAddOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const creator = mode === 'creator'

  function handleSetDefault(id: string) {
    setDefault(id)
    toast.success(
      creator
        ? 'Default payment method updated.'
        : 'Default refund account updated — refunds will be sent here.'
    )
  }

  function handleRemove(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const target = methods.find((m) => m.id === id)
    if (target?.isDefault) {
      toast.error('Set another account as default before removing this one.')
      return
    }
    removeMethod(id)
    toast.success(creator ? 'Payment method removed.' : 'Refund receiving account removed.')
  }

  const overflowing = methods.length > VISIBLE_BEFORE_OVERFLOW && !showAll
  const displayed = overflowing ? methods.slice(0, VISIBLE_BEFORE_OVERFLOW) : methods
  const hiddenCount = Math.max(0, methods.length - VISIBLE_BEFORE_OVERFLOW)

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className="mb-2 font-display text-xl font-semibold ">
          {creator ? 'Payment methods' : 'Refund receiving account'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {creator ? (
            <>
              Add an e-wallet or bank account. Payouts are sent to your default method when a
              campaign releases funds.
            </>
          ) : (
            <>
              Add where we should send money when you refund available balance from a campaign —
              bank or e-wallet.
            </>
          )}
        </p>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="space-y-4">
          <h3 className="hidden md:block text-base font-semibold text-foreground">
            {creator ? 'Your payment methods' : 'Your accounts for refunds'}
          </h3>
          <p className="hidden md:block -mt-2 text-sm text-muted-foreground">
            {creator
              ? 'Tap a non-default method to make it the default for payouts. You can remove extra methods with the trash icon; the default cannot be deleted until another is default.'
              : 'Tap a non-default row to make it the default for refunds. You can remove extra accounts with the trash icon; the default cannot be deleted until another is default.'}
          </p>

          {methods.length > 0 ? (
            <>
              <ul className="space-y-2">
                {displayed.map((m) => {
                  const isDefault = m.isDefault
                  return (
                    <li
                      key={m.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (!isDefault) handleSetDefault(m.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (!isDefault) handleSetDefault(m.id)
                        }
                      }}
                      className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-2 md:p-4 transition-colors ${
                        isDefault
                          ? 'border-primary/40 bg-phc-gradient-soft ring ring-primary/20'
                          : 'border-border bg-card hover:border-foreground/20'
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <PaymentBrandLogo
                          type={m.type}
                          bank={m.bank}
                          className="h-8 w-8 md:h-11 md:w-11"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{rowTitle(m)}</p>
                          <p className="truncate text-sm text-muted-foreground">{rowDetail(m)}</p>
                        </div>
                        {isDefault && (
                          <span className="ml-auto shrink-0 text-xs md:text-sm font-medium text-muted-foreground">
                            Default
                          </span>
                        )}
                      </div>
                      {!isDefault ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleRemove(m.id, e)}
                          aria-label={creator ? 'Remove payment method' : 'Remove refund account'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
              {overflowing && hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {hiddenCount} more
                </button>
              )}
              <Button
                type="button"
                className="w-full bg-phc-gradient text-white"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {creator ? 'Add Another Payment Method' : 'Add Another Refund Account'}
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="mt-1 w-full cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/50"
              >
                <p className="text-sm font-semibold text-foreground">
                  {creator ? 'No payment methods yet' : 'No refund receiving account yet'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {creator
                    ? 'Add a GCash, Maya, or bank account so we can send you payouts.'
                    : 'Add a bank or e-wallet so we can send refunded campaign balance.'}
                </p>
              </button>
              <Button
                type="button"
                className="w-full bg-phc-gradient text-white"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-4 w-4" />
                {creator ? 'Choose Payment Method' : 'Add Receiving Account'}
              </Button>
            </div>
          )}
        </div>

        <AddPaymentMethodDialog mode={mode} open={addOpen} onOpenChange={setAddOpen} />
      </div>
    </div>
  )
}
