import { useState } from 'react'
import { Building2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'
import { paymentLogoSrc } from '@/lib/constants/paymentLogos'
import { PaymentBrandLogo } from '@/components/account/PaymentBrandLogo'
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

const PH_BANKS = ['BPI', 'BDO', 'Metrobank', 'UnionBank', 'Landbank', 'PNB', 'Security Bank']

const VISIBLE_BEFORE_OVERFLOW = 3

type ModalStep = 'choose' | 'form'

function maskAccount(value: string, kind: PaymentMethod['type'], bankName?: string) {
  const tail = value.slice(-4)
  if (kind === 'gcash') return `GCash · ${value.slice(0, 4)} ••• ${tail}`
  if (kind === 'maya') return `Maya · ${value.slice(0, 4)} ••• ${tail}`
  return `${bankName ?? 'Bank'} · ••• ${tail}`
}

interface PaymentMethodsSectionProps {
  mode: 'clipper' | 'brand'
}

export function PaymentMethodsSection({ mode }: PaymentMethodsSectionProps) {
  const methods = usePaymentMethodsStore((s) => s.methods)
  const addMethod = usePaymentMethodsStore((s) => s.addMethod)
  const removeMethod = usePaymentMethodsStore((s) => s.removeMethod)
  const setDefault = usePaymentMethodsStore((s) => s.setDefault)

  const [addOpen, setAddOpen] = useState(false)
  const [step, setStep] = useState<ModalStep>('choose')
  const [category, setCategory] = useState<'ewallet' | 'bank' | null>(null)
  const [type, setType] = useState<PaymentMethod['type']>('gcash')
  const [bank, setBank] = useState('BPI')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [showAll, setShowAll] = useState(false)

  const clipper = mode === 'clipper'

  function resetModal() {
    setStep('choose')
    setCategory(null)
    setType('gcash')
    setBank('BPI')
    setAccountName('')
    setAccountNumber('')
  }

  function closeModal() {
    setAddOpen(false)
    resetModal()
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!accountName.trim() || !accountNumber.trim()) {
      toast.error('Fill in account name and number.')
      return
    }
    const resolvedType = category === 'bank' ? 'bank' : type
    addMethod({
      id: `pm-${Date.now()}`,
      type: resolvedType,
      label: maskAccount(
        accountNumber.trim(),
        resolvedType,
        resolvedType === 'bank' ? bank : undefined
      ),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      bank: resolvedType === 'bank' ? bank : undefined,
      isDefault: methods.length === 0,
    })
    toast.success(clipper ? 'Payout method added.' : 'Funding source added.')
    closeModal()
  }

  function handleSetDefault(id: string) {
    setDefault(id)
    toast.success(
      clipper
        ? 'Default payout method updated. Payouts route here on the weekly schedule (mock).'
        : 'Default funding source updated.'
    )
  }

  function handleRemove(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    removeMethod(id)
    toast.success(clipper ? 'Payout method removed.' : 'Funding source removed.')
  }

  const overflowing = methods.length > VISIBLE_BEFORE_OVERFLOW && !showAll
  const displayed = overflowing ? methods.slice(0, VISIBLE_BEFORE_OVERFLOW) : methods
  const hiddenCount = Math.max(0, methods.length - VISIBLE_BEFORE_OVERFLOW)

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <h2 className="mb-2 font-display text-xl font-extrabold sm:text-2xl">
          {clipper ? 'Payout methods' : 'Funding sources'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {clipper ? (
            <>
              Weekly payouts are processed every Thursday (mock). Add a verified GCash, Maya, or
              bank account. Select a default so mock disbursements know where to route funds.
            </>
          ) : (
            <>
              Link GCash, Maya, or a bank account for mock campaign top-ups. Pick a default source
              for the demo checkout flow.
            </>
          )}
        </p>
      </div>

      <div className="space-y-4 lg:col-span-2">
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">
            {clipper ? 'Your payout methods' : 'Your funding sources'}
          </h3>
          <p className="-mt-2 text-sm text-muted-foreground">
            {clipper
              ? 'Tap a method to make it default. Remove with the trash icon.'
              : 'Tap a source to make it default for mock adds. Remove with the trash icon.'}
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
                      className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-colors ${
                        isDefault
                          ? 'border-blue-500/40 bg-phc-gradient-soft ring-2 ring-blue-500/20'
                          : 'border-border bg-card hover:border-foreground/20'
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <PaymentBrandLogo type={m.type} bank={m.bank} className="h-11 w-11" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{m.label}</p>
                          <p className="truncate text-sm text-muted-foreground">{m.accountName}</p>
                        </div>
                        {isDefault && (
                          <span className="ml-auto shrink-0 text-sm font-medium text-muted-foreground">
                            Default
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleRemove(m.id, e)}
                        aria-label="Remove payment method"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                {clipper ? 'Add another payout method' : 'Add another funding source'}
              </Button>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="mt-1 w-full cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center transition-colors hover:border-blue-500/40 hover:bg-muted/50"
              >
                <p className="text-sm font-semibold text-foreground">
                  {clipper ? 'No payout methods yet' : 'No funding sources yet'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {clipper
                    ? 'Add GCash, Maya, or a bank account to receive payouts (mock).'
                    : 'Add GCash, Maya, or a bank to fund campaigns (mock).'}
                </p>
              </button>
              <Button
                type="button"
                className="w-full bg-phc-gradient text-white"
                onClick={() => setAddOpen(true)}
              >
                {clipper ? 'Choose payout method' : 'Choose funding source'}
              </Button>
            </div>
          )}
        </div>

        <Dialog
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open)
            if (!open) resetModal()
          }}
        >
          <DialogContent className="max-w-xl">
            {step === 'choose' ? (
              <>
                <DialogHeader>
                  <DialogTitle>{clipper ? 'Add payout method' : 'Add funding source'}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('ewallet')
                      setType('gcash')
                      setStep('form')
                    }}
                    className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-blue-500/40"
                  >
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-white p-2 dark:bg-white">
                      <img
                        src={paymentLogoSrc({ type: 'gcash' })!}
                        alt=""
                        className="h-9 w-9 object-contain"
                      />
                      <img
                        src={paymentLogoSrc({ type: 'maya' })!}
                        alt=""
                        className="h-9 w-9 object-contain"
                      />
                    </div>
                    <span className="font-semibold">E-wallet</span>
                    <span className="text-center text-sm text-muted-foreground">
                      GCash, Maya (GrabPay & ShopeePay coming soon)
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('bank')
                      setStep('form')
                    }}
                    className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-blue-500/40"
                  >
                    <div className="flex items-center gap-1 rounded-xl border border-border bg-white px-2 py-1.5 dark:bg-white">
                      {(['BPI', 'BDO', 'Metrobank'] as const).map((b) => {
                        const src = paymentLogoSrc({ type: 'bank', bank: b })
                        return src ? (
                          <img key={b} src={src} alt="" className="h-8 w-8 object-contain" />
                        ) : null
                      })}
                    </div>
                    <span className="font-semibold">Local bank</span>
                    <span className="text-center text-sm text-muted-foreground">
                      BDO, BPI, Metrobank, and more
                    </span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {category === 'bank' ? 'Local bank' : 'E-wallet'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4 pt-2">
                  {category === 'ewallet' && (
                    <div className="space-y-1.5">
                      <Label>Provider</Label>
                      <Select
                        value={type}
                        onValueChange={(v) => setType(v as PaymentMethod['type'])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gcash">
                            <span className="flex items-center gap-2">
                              <img
                                src={paymentLogoSrc({ type: 'gcash' })!}
                                alt=""
                                className="h-5 w-5 shrink-0 object-contain"
                              />
                              GCash
                            </span>
                          </SelectItem>
                          <SelectItem value="maya">
                            <span className="flex items-center gap-2">
                              <img
                                src={paymentLogoSrc({ type: 'maya' })!}
                                alt=""
                                className="h-5 w-5 shrink-0 object-contain"
                              />
                              Maya
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {category === 'bank' && (
                    <div className="space-y-1.5">
                      <Label>Bank</Label>
                      <Select value={bank} onValueChange={setBank}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PH_BANKS.map((b) => {
                            const src = paymentLogoSrc({ type: 'bank', bank: b })
                            return (
                              <SelectItem key={b} value={b}>
                                <span className="flex items-center gap-2">
                                  {src ? (
                                    <img
                                      src={src}
                                      alt=""
                                      className="h-5 w-5 shrink-0 object-contain"
                                    />
                                  ) : (
                                    <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                                  )}
                                  {b}
                                </span>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="pm-account-name">Account name</Label>
                    <Input
                      id="pm-account-name"
                      placeholder={clipper ? 'Juan Dela Cruz' : 'Brand Inc.'}
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pm-account-number">
                      {category === 'bank' ? 'Account number' : 'Mobile number'}
                    </Label>
                    <Input
                      id="pm-account-number"
                      placeholder={category === 'bank' ? '0000-0000-0000' : '0917 000 0000'}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setStep('choose')
                        setCategory(null)
                      }}
                    >
                      Back
                    </Button>
                    <Button type="submit" className="flex-1 bg-phc-gradient text-white">
                      Save
                    </Button>
                  </div>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
