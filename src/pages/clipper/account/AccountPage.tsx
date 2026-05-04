import { useState } from 'react'
import { Plus, Trash2, BadgeCheck, Building2, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/hooks/useAuth'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { PaymentMethod } from '@/lib/mockData'

const PH_BANKS = ['BPI', 'BDO', 'Metrobank', 'UnionBank', 'Landbank', 'PNB', 'Security Bank']

export default function ClipperAccountPage() {
  const { user } = useAuth()
  const methods = usePaymentMethodsStore((s) => s.methods)
  const addMethod = usePaymentMethodsStore((s) => s.addMethod)
  const removeMethod = usePaymentMethodsStore((s) => s.removeMethod)
  const setDefault = usePaymentMethodsStore((s) => s.setDefault)

  const [open, setOpen] = useState(false)
  const [type, setType] = useState<PaymentMethod['type']>('gcash')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bank, setBank] = useState('BPI')

  function maskAccount(value: string, kind: PaymentMethod['type'], bankName?: string) {
    const tail = value.slice(-4)
    if (kind === 'gcash') return `GCash · ${value.slice(0, 4)} ••• ${tail}`
    if (kind === 'maya') return `Maya · ${value.slice(0, 4)} ••• ${tail}`
    return `${bankName ?? 'Bank'} · ••• ${tail}`
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!accountName.trim() || !accountNumber.trim()) {
      toast.error('Fill in account name and number.')
      return
    }
    addMethod({
      id: `pm-${Date.now()}`,
      type,
      label: maskAccount(accountNumber.trim(), type, type === 'bank' ? bank : undefined),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      bank: type === 'bank' ? bank : undefined,
      isDefault: methods.length === 0,
    })
    toast.success('Payout method added')
    setOpen(false)
    setAccountName('')
    setAccountNumber('')
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Account</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
          Your <span className="text-phc-gradient">profile</span>
        </h1>
      </div>

      {/* Profile card */}
      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="bg-phc-gradient text-white text-2xl font-bold font-display">
              {user?.name?.charAt(0)?.toUpperCase() ?? user?.email?.charAt(0)?.toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-extrabold">{user?.name ?? 'Your name'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500 text-white px-3 py-1 text-xs font-semibold shadow-sm shadow-blue-500/30">
              <BadgeCheck className="h-3 w-3" /> Clipper
            </p>
          </div>
          <Button variant="outline">Edit profile</Button>
        </div>
      </section>

      {/* Payment methods */}
      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold">Payout methods</h2>
            <p className="text-sm text-muted-foreground">
              Get paid via GCash, Maya, or bank transfer (powered by Xendit).
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-phc-gradient text-white">
                <Plus className="h-4 w-4" /> Add method
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add a payout method</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as PaymentMethod['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="maya">Maya</SelectItem>
                      <SelectItem value="bank">Bank transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {type === 'bank' && (
                  <div className="space-y-1.5">
                    <Label>Bank</Label>
                    <Select value={bank} onValueChange={setBank}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PH_BANKS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="account-name">Account name</Label>
                  <Input
                    id="account-name"
                    placeholder="Juan Dela Cruz"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="account-number">
                    {type === 'bank' ? 'Account number' : 'Mobile number'}
                  </Label>
                  <Input
                    id="account-number"
                    placeholder={type === 'bank' ? '0000-0000-0000' : '0917 000 0000'}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full bg-phc-gradient text-white">
                  Save method
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-5 space-y-3">
          {methods.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="font-medium">No payout methods yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add GCash, Maya, or a bank account to receive payouts.
              </p>
            </div>
          ) : (
            methods.map((m) => {
              const Icon = m.type === 'bank' ? Building2 : Smartphone
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                    m.isDefault
                      ? 'border-blue-500/20 bg-phc-gradient-soft ring-2 ring-blue-500/20'
                      : 'border-border bg-card hover:border-foreground/20'
                  }`}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-background">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{m.label}</p>
                      {m.isDefault && (
                        <span className="rounded-full bg-phc-gradient text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{m.accountName}</p>
                  </div>
                  <div className="flex gap-2">
                    {!m.isDefault && (
                      <Button variant="ghost" size="sm" onClick={() => setDefault(m.id)}>
                        Set default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMethod(m.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
