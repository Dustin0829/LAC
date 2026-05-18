import { useState } from 'react'
import { Building2, Loader2, Plus, Trash2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import {
  useDeletePaymentMethod,
  usePatchPaymentMethod,
  usePaymentMethods,
} from '@/api/queries/use-payment-methods'
import {
  buildPatchPaymentMethodBody,
  paymentMethodDisplayDetail,
} from '@/lib/paymentMethods/paymentMethodApi'
import {
  paymentMethodDefaultRequiredMessage,
  paymentMethodDefaultUpdatedMessage,
  paymentMethodRemovedMessage,
} from '@/lib/paymentMethods/paymentMethodMessages'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'
import { AddPaymentMethodDialog } from '@/components/account/AddPaymentMethodDialog'
import { PaymentBrandLogo } from '@/components/account/PaymentBrandLogo'
import { Button } from '@/components/ui/button'
import type { PaymentMethod } from '@/lib/paymentMethods/types'

const VISIBLE_BEFORE_OVERFLOW = 3

function rowTitle(m: PaymentMethod): string {
  if (m.label === 'PayMaya (Maya)') return 'Maya'
  if (m.type === 'bank') return m.label
  return m.label
}

interface PaymentMethodsSectionProps {
  mode: 'creator' | 'brand'
  /** Load and mutate via `/me/payment-methods` (default on account pages). */
  useApi?: boolean
  /** Hide success/error toasts (e.g. during onboarding). */
  suppressToasts?: boolean
}

export function PaymentMethodsSection({
  mode,
  useApi = true,
  suppressToasts = false,
}: PaymentMethodsSectionProps) {
  const storeMethods = usePaymentMethodsStore((s) => s.methods)
  const removeMethodLocal = usePaymentMethodsStore((s) => s.removeMethod)
  const setDefaultLocal = usePaymentMethodsStore((s) => s.setDefault)
  const mutationOptions = { surface: mode, suppressToasts }
  const { data: apiMethods = [], isLoading, isError } = usePaymentMethods(useApi)
  const { mutate: patchPaymentMethod, isPending: isPatching, variables: patchVariables } =
    usePatchPaymentMethod(mutationOptions)
  const { mutate: deletePaymentMethod, isPending: isDeleting, variables: deletingId } =
    useDeletePaymentMethod(mutationOptions)
  const methods = useApi ? apiMethods : storeMethods

  const [addOpen, setAddOpen] = useState(false)
  const [dialogPreset, setDialogPreset] = useState<'e-wallet' | 'local-bank' | null>(null)
  const [showAll, setShowAll] = useState(false)

  const chooseCardClass =
    'flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/50'

  const creator = mode === 'creator'

  function handleSetDefault(id: string) {
    if (useApi) {
      patchPaymentMethod({
        paymentMethodId: id,
        body: buildPatchPaymentMethodBody({ isDefault: true }),
      })
      return
    }
    setDefaultLocal(id)
    if (!suppressToasts) {
      toast.success(paymentMethodDefaultUpdatedMessage(mode))
    }
  }

  function handleRemove(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const target = methods.find((m) => m.id === id)
    if (target?.isDefault) {
      if (!suppressToasts) {
        toast.error(paymentMethodDefaultRequiredMessage())
      }
      return
    }
    if (useApi) {
      deletePaymentMethod(id)
      return
    }
    removeMethodLocal(id)
    if (!suppressToasts) {
      toast.success(paymentMethodRemovedMessage(mode))
    }
  }

  const overflowing = methods.length > VISIBLE_BEFORE_OVERFLOW && !showAll
  const displayed = overflowing ? methods.slice(0, VISIBLE_BEFORE_OVERFLOW) : methods
  const hiddenCount = Math.max(0, methods.length - VISIBLE_BEFORE_OVERFLOW)

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className="font-display text-xl font-semibold">
          {creator ? 'Payment methods' : 'Refund receiving account'}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {creator ? (
            <>
              Add an e-wallet or bank account. Payouts go to your default method when a campaign
              releases funds.
            </>
          ) : (
            <>
              Add a bank or e-wallet where we should send money when you refund available balance
              from a campaign.
            </>
          )}
        </p>
      </div>

      <div className="space-y-4 lg:col-span-2">
        {useApi && isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading accounts…
          </div>
        ) : null}
        {useApi && isError ? (
          <p className="text-sm text-destructive">
            Could not load payment methods. Try again later.
          </p>
        ) : null}
        <div className="space-y-4">
          {methods.length > 0 ? (
            <>
              <ul className="space-y-2">
                {displayed.map((m) => {
                  const isDefault = m.isDefault
                  const isSettingDefault =
                    isPatching && patchVariables?.paymentMethodId === m.id
                  const isRemoving = isDeleting && deletingId === m.id
                  const rowBusy = isSettingDefault || isRemoving
                  return (
                    <li
                      key={m.id}
                      role="button"
                      tabIndex={rowBusy ? -1 : 0}
                      onClick={() => {
                        if (rowBusy || isDefault) return
                        handleSetDefault(m.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (rowBusy || isDefault) return
                          handleSetDefault(m.id)
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
                          <p className="truncate text-sm text-muted-foreground">{paymentMethodDisplayDetail(m)}</p>
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
                          disabled={rowBusy || isPatching || isDeleting}
                          onClick={(e) => handleRemove(m.id, e)}
                          aria-label={creator ? 'Remove payment method' : 'Remove refund account'}
                        >
                          {isRemoving ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
                onClick={() => {
                  setDialogPreset(null)
                  setAddOpen(true)
                }}
              >
                <Plus className="h-4 w-4" />
                {creator ? 'Add Another Payment Method' : 'Add Another Refund Account'}
              </Button>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setDialogPreset('e-wallet')
                  setAddOpen(true)
                }}
                className={chooseCardClass}
              >
                <Wallet className="h-8 w-8 text-primary" aria-hidden />
                <span className="font-semibold">E-wallets</span>
                <span className="text-center text-sm text-muted-foreground">
                  GCash, Maya, GrabPay, ShopeePay
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDialogPreset('local-bank')
                  setAddOpen(true)
                }}
                className={chooseCardClass}
              >
                <Building2 className="h-8 w-8 text-primary" aria-hidden />
                <span className="font-semibold">Bank</span>
                <span className="text-center text-sm text-muted-foreground">
                  BDO, BPI, Metrobank, and more
                </span>
              </button>
            </div>
          )}
        </div>

        <AddPaymentMethodDialog
          mode={mode}
          useApi={useApi}
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open)
            if (!open) setDialogPreset(null)
          }}
          presetType={dialogPreset}
          suppressToasts={suppressToasts}
        />
      </div>
    </div>
  )
}
