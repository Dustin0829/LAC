import { useEffect, useLayoutEffect, useState } from 'react'
import { Building2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import {
  addPaymentMethodFormFieldErrors,
  addPaymentMethodFormSchema,
  type AddPaymentMethodFormField,
} from '@/api/schema/paymentMethods.schema'
import { usePostPaymentMethod } from '@/api/queries/use-payment-methods'
import { buildPostPaymentMethodBody } from '@/lib/paymentMethods/paymentMethodApi'
import { paymentMethodAddedMessage } from '@/lib/paymentMethods/paymentMethodMessages'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'
import {
  E_WALLET_OPTIONS,
  LOCAL_BANK_OPTIONS,
  getPaymentMethodIcon,
} from '@/lib/constants/paymentMethodIcons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { PaymentMethod } from '@/lib/paymentMethods/types'

type AddMethodType = 'e-wallet' | 'local-bank' | null

const EWL_LABEL_TO_TYPE: Record<string, Exclude<PaymentMethod['type'], 'bank'>> = {
  GCash: 'gcash',
  Maya: 'maya',
  'PayMaya (Maya)': 'maya',
  GrabPay: 'grabpay',
  ShopeePay: 'shopeepay',
}

export interface AddPaymentMethodDialogProps {
  mode: 'creator' | 'brand'
  useApi?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a method is saved (after the dialog begins closing). */
  onSuccess?: () => void
  /** Hide success/error toasts (e.g. during onboarding). */
  suppressToasts?: boolean
  /** When set while opening, skip the type chooser and go straight to that flow. */
  presetType?: 'e-wallet' | 'local-bank' | null
}

export function AddPaymentMethodDialog({
  mode,
  useApi = true,
  open,
  onOpenChange,
  onSuccess,
  suppressToasts = false,
  presetType = null,
}: AddPaymentMethodDialogProps) {
  const methods = usePaymentMethodsStore((s) => s.methods)
  const addMethodLocal = usePaymentMethodsStore((s) => s.addMethod)
  const { mutate: postPaymentMethod } = usePostPaymentMethod({ surface: mode, suppressToasts })

  const [methodType, setMethodType] = useState<AddMethodType>(null)
  const [provider, setProvider] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [errors, setErrors] = useState<Partial<Record<AddPaymentMethodFormField, string>>>({})

  const creator = mode === 'creator'

  useEffect(() => {
    if (methodType === 'e-wallet' || methodType === 'local-bank') {
      setProvider('')
    }
  }, [methodType])

  useLayoutEffect(() => {
    if (!open) return
    if (presetType === 'e-wallet' || presetType === 'local-bank') {
      setMethodType(presetType)
    } else {
      setMethodType(null)
    }
  }, [open, presetType])

  function resetModal() {
    setMethodType(null)
    setProvider('')
    setAccountNumber('')
    setAccountName('')
    setErrors({})
  }

  function closeModal() {
    onOpenChange(false)
    resetModal()
  }

  const openedWithPreset = presetType === 'e-wallet' || presetType === 'local-bank'

  function goBackFromForm() {
    if (openedWithPreset) {
      closeModal()
      return
    }
    setMethodType(null)
    setProvider('')
    setAccountNumber('')
    setAccountName('')
    setErrors({})
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!methodType) return

    const parsed = addPaymentMethodFormSchema.safeParse({
      methodType,
      provider,
      accountNumber,
      accountName,
    })
    if (!parsed.success) {
      setErrors(addPaymentMethodFormFieldErrors(parsed.error))
      return
    }
    setErrors({})

    if (useApi) {
      postPaymentMethod(buildPostPaymentMethodBody(parsed.data, methods.length === 0), {
        onSuccess: () => {
          onSuccess?.()
          closeModal()
        },
      })
      return
    }

    if (parsed.data.methodType === 'e-wallet') {
      const mapped = EWL_LABEL_TO_TYPE[parsed.data.provider]
      if (!mapped) {
        if (!suppressToasts) {
          toast.error('Invalid e-wallet selection.')
        }
        return
      }
      const title = parsed.data.provider === 'PayMaya (Maya)' ? 'Maya' : parsed.data.provider
      addMethodLocal({
        id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: mapped,
        label: title,
        accountNumber: parsed.data.accountNumber,
        accountName: parsed.data.accountName,
        isDefault: methods.length === 0,
      })
    } else {
      addMethodLocal({
        id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'bank',
        label: parsed.data.provider,
        accountNumber: parsed.data.accountNumber,
        accountName: parsed.data.accountName,
        bank: parsed.data.provider,
        isDefault: methods.length === 0,
      })
    }

    if (!suppressToasts) {
      toast.success(paymentMethodAddedMessage(mode))
    }
    onSuccess?.()
    closeModal()
  }

  const modalTitleAdd = creator ? 'Add Payment Method' : 'Add Receiving Account'
  const modalTitleEw = methodType === 'e-wallet' ? 'Add E-Wallet' : 'Add Local Bank'
  const chooseCardClass =
    'flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/50'

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) resetModal()
      }}
    >
      <DialogContent className="max-w-xl">
        {methodType === null ? (
          <>
            <DialogHeader>
              <DialogTitle>{modalTitleAdd}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMethodType('e-wallet')}
                className={chooseCardClass}
              >
                <Wallet className="h-10 w-10 text-primary" />
                <span className="font-semibold">E-Wallet</span>
                <span className="text-center text-sm text-muted-foreground">
                  GCash, Maya, GrabPay, ShopeePay
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMethodType('local-bank')}
                className={chooseCardClass}
              >
                <Building2 className="h-10 w-10 text-primary" />
                <span className="font-semibold">Local Bank</span>
                <span className="text-center text-sm text-muted-foreground">
                  BDO, BPI, Metrobank, and more
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{modalTitleEw}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <Label>{methodType === 'e-wallet' ? 'E-Wallet' : 'Bank'}</Label>
                <Select
                  value={provider || undefined}
                  onValueChange={(v) => {
                    setProvider(v)
                    setErrors((e) => ({ ...e, provider: undefined }))
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={methodType === 'e-wallet' ? 'Select e-wallet' : 'Select bank'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(methodType === 'e-wallet' ? E_WALLET_OPTIONS : LOCAL_BANK_OPTIONS).map(
                      (opt) => {
                        const iconSrc = getPaymentMethodIcon(
                          methodType === 'e-wallet' ? 'e-wallet' : 'local-bank',
                          opt
                        )
                        return (
                          <SelectItem key={opt} value={opt}>
                            <span className="flex items-center gap-3">
                              {iconSrc ? (
                                <img
                                  src={iconSrc}
                                  alt=""
                                  className="h-5 w-5 shrink-0 object-contain"
                                />
                              ) : (
                                <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                              )}
                              {opt}
                            </span>
                          </SelectItem>
                        )
                      }
                    )}
                  </SelectContent>
                </Select>
                {errors.provider ? (
                  <p className="mt-1 text-sm text-destructive">{errors.provider}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="pm-account-number">Account number</Label>
                <Input
                  id="pm-account-number"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder={methodType === 'e-wallet' ? '09XX XXX XXXX' : 'Enter account number'}
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/\D/g, ''))
                    setErrors((er) => ({ ...er, accountNumber: undefined }))
                  }}
                  className="mt-1"
                />
                {errors.accountNumber ? (
                  <p className="mt-1 text-sm text-destructive">{errors.accountNumber}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="pm-account-name">Account name</Label>
                <Input
                  id="pm-account-name"
                  placeholder="Name as it appears on the account"
                  value={accountName}
                  onChange={(e) => {
                    setAccountName(e.target.value)
                    setErrors((er) => ({ ...er, accountName: undefined }))
                  }}
                  className="mt-1"
                />
                {errors.accountName ? (
                  <p className="mt-1 text-sm text-destructive">{errors.accountName}</p>
                ) : null}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={goBackFromForm}>
                  {openedWithPreset ? 'Cancel' : 'Go Back'}
                </Button>
                <Button type="submit" className="flex-1 bg-phc-gradient text-white">
                  {creator ? 'Save Payment Method' : 'Save Receiving Account'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
