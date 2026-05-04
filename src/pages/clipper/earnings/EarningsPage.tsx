import { ClipStatusBadge } from '@/components/ClipStatusBadge'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockEarningsTrend } from '@/lib/mockData'
import { useClipsStore } from '@/lib/stores/clipsStore'
import { usePaymentMethodsStore } from '@/lib/stores/paymentMethodsStore'
import { formatDate, formatPHP, formatViews } from '@/lib/utils'
import { ArrowDownToLine, Loader2, Sparkles, Wallet } from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { toast } from 'sonner'

export default function ClipperEarningsPage() {
  const clips = useClipsStore((s) => s.clips)
  const updateClip = useClipsStore((s) => s.updateClip)
  const methods = usePaymentMethodsStore((s) => s.methods)
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedMethodId, setSelectedMethodId] = useState(
    methods.find((m) => m.isDefault)?.id ?? methods[0]?.id ?? ''
  )
  const [submitting, setSubmitting] = useState(false)

  const totalEarned = clips.reduce((s, c) => s + c.earnings, 0)
  const paid = clips
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => s + c.earnings, 0)
  const pending = totalEarned - paid
  const available = clips
    .filter((c) => c.status === 'approved')
    .reduce((s, c) => s + c.earnings, 0)

  const recentTransactions = [...clips]
    .filter((c) => c.status === 'paid' || c.status === 'approved')
    .sort(
      (a, b) =>
        new Date(b.paidAt ?? b.reviewedAt ?? b.submittedAt).getTime() -
        new Date(a.paidAt ?? a.reviewedAt ?? a.submittedAt).getTime()
    )
    .slice(0, 8)

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!amt || amt <= 0) return toast.error('Enter a valid amount.')
    if (amt > available) return toast.error(`Maximum available: ${formatPHP(available)}`)
    if (!selectedMethodId) return toast.error('Pick a payout method.')
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 700))
    // Mark approved clips as paid up to the requested amount (simple mock).
    let remaining = amt
    clips
      .filter((c) => c.status === 'approved')
      .forEach((c) => {
        if (remaining <= 0) return
        if (c.earnings <= remaining) {
          updateClip(c.id, { status: 'paid', paidAt: new Date().toISOString() })
          remaining -= c.earnings
        }
      })
    toast.success(`Withdrawal of ${formatPHP(amt)} sent — should arrive within 24h.`)
    setSubmitting(false)
    setOpen(false)
    setAmount('')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Earnings</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
            Your <span className="text-phc-gradient">payday</span> tracker
          </h1>
          <p className="mt-2 text-muted-foreground">
            Withdraw to your default GCash or bank. Powered by Xendit (mocked).
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-phc-gradient text-white" disabled={available <= 0}>
              <ArrowDownToLine className="h-4 w-4" /> Withdraw
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Withdraw funds</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleWithdraw} className="space-y-4 pt-2">
              <div className="rounded-xl bg-phc-gradient-soft p-4">
                <p className="text-xs text-muted-foreground">Available to withdraw</p>
                <p className="font-display text-2xl font-extrabold text-phc-gradient">
                  {formatPHP(available)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (₱)</Label>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pay to</Label>
                <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pick a payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {methods.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Add a payout method in Account → Payment Methods first.
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-phc-gradient text-white"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm withdrawal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available"
          value={formatPHP(available, { decimals: false })}
          hint="Approved, ready to withdraw"
          icon={Wallet}
          accent="violet"
        />
        <StatCard
          label="Pending"
          value={formatPHP(pending, { decimals: false })}
          hint="Awaiting review or payout"
          icon={Sparkles}
          accent="orange"
        />
        <StatCard
          label="Paid out"
          value={formatPHP(paid, { decimals: false })}
          hint="All-time"
          icon={ArrowDownToLine}
          accent="emerald"
        />
        <StatCard
          label="Lifetime"
          value={formatPHP(totalEarned, { decimals: false })}
          icon={Wallet}
          accent="pink"
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-extrabold">Weekly earnings</h2>
          <p className="text-sm text-muted-foreground">Last 6 weeks</p>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={mockEarningsTrend} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="week" stroke="currentColor" className="text-xs" />
              <YAxis stroke="currentColor" className="text-xs" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                }}
                formatter={(v: number) => [formatPHP(v, { decimals: false }), 'Earnings']}
              />
              <Bar dataKey="earnings" radius={[8, 8, 0, 0]} fill="url(#barFill)" />
              <defs>
                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between p-6">
          <h2 className="font-display text-xl font-extrabold">Recent transactions</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No transactions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Campaign</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Views</th>
                <th className="px-6 py-3 font-medium">Amount</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentTransactions.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4">
                    <p className="font-medium line-clamp-1">{c.campaignTitle}</p>
                    <p className="text-xs text-muted-foreground">{c.brandName}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">{formatViews(c.views)}</td>
                  <td className="px-6 py-4 font-display font-bold text-phc-gradient">
                    {formatPHP(c.earnings, { decimals: false })}
                  </td>
                  <td className="px-6 py-4">
                    <ClipStatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    {formatDate(c.paidAt ?? c.reviewedAt ?? c.submittedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
