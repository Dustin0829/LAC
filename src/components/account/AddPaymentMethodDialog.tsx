import { useEffect, useState } from 'react'
import { Building2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
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
import type { PaymentMethod } from '@/lib/mockData'

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
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called after a method is saved (after the dialog begins closing). */
  onSuccess?: () => void
}

export function AddPaymentMethodDialog({
  mode,
  open,
  onOpenChange,
  onSuccess,
}: AddPaymentMethodDialogProps) {
  const methods = usePaymentMethodsStore((s) => s.methods)
  const addMethod = usePaymentMethodsStore((s) => s.addMethod)

  const [methodType, setMethodType] = useState<AddMethodType>(null)
  const [provider, setProvider] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [errors, setErrors] = useState<{
    provider?: string
    accountNumber?: string
    accountName?: string
  }>({})

  const creator = mode === 'creator'

  useEffect(() => {
    if (methodType === 'e-wallet' || methodType === 'local-bank') {
      setProvider('')
    }
  }, [methodType])

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

  function validate(): boolean {
    const next: typeof errors = {}
    if (!provider.trim()) {
      next.provider =
        methodType === 'e-wallet'
          ? 'Please select a provider'
          : methodType === 'local-bank'
            ? 'Please select a bank'
            : 'Please select a provider'
    }
    if (!accountNumber.trim()) next.accountNumber = 'Account number is required'
    if (!accountName.trim()) next.accountName = 'Account name is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!methodType || !validate()) return

    if (methodType === 'e-wallet') {
      const mapped = EWL_LABEL_TO_TYPE[provider]
      if (!mapped) {
        toast.error('Invalid e-wallet selection.')
        return
      }
      const title = provider === 'PayMaya (Maya)' ? 'Maya' : provider
      addMethod({
        id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: mapped,
        label: title,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        isDefault: methods.length === 0,
      })
    } else {
      addMethod({
        id: `pm-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'bank',
        label: provider,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        bank: provider,
        isDefault: methods.length === 0,
      })
    }

    toast.success(creator ? 'Payment method added.' : 'Refund receiving account saved.')
    closeModal()
    onSuccess?.()
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
                {errors.provider && (
                  <p className="mt-1 text-sm text-destructive">{errors.provider}</p>
                )}
              </div>
              <div>
                <Label htmlFor="pm-account-number">Account number</Label>
                <Input
                  id="pm-account-number"
                  placeholder="Enter account number"
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value)
                    setErrors((er) => ({ ...er, accountNumber: undefined }))
                  }}
                  className="mt-1"
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-destructive">{errors.accountNumber}</p>
                )}
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
                {errors.accountName && (
                  <p className="mt-1 text-sm text-destructive">{errors.accountName}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setMethodType(null)
                    setProvider('')
                    setAccountNumber('')
                    setAccountName('')
                    setErrors({})
                  }}
                >
                  Go Back
                </Button>
                <Button type="submit" className="flex-1 bg-phc-gradient text-white">
                  {creator ? 'Save payment method' : 'Save receiving account'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
