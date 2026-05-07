import { useMemo } from 'react'
import { ClipStatusBadge } from '@/components/ClipStatusBadge'
import { StatCard } from '@/components/StatCard'
import { mockEarningsTrend } from '@/lib/mockData'
import { useClipsStore } from '@/lib/stores/clipsStore'
import { formatDate, formatPHP, formatViews } from '@/lib/utils'
import { Banknote, Sparkles, Wallet } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export default function ClipperEarningsPage() {
  const allClips = useClipsStore((s) => s.clips)
  const clips = useMemo(
    () => allClips.filter((clip) => clip.clipperId === 'me'),
    [allClips]
  )

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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Earnings</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
          Your <span className="text-phc-gradient">payday</span> tracker
        </h1>
        <p className="mt-2 text-muted-foreground">
          Earnings are based on new verified views since the last paid-through watermark. Brands
          release payouts weekly after review.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Available"
          value={formatPHP(available, { decimals: false })}
          hint="Approved — next automatic payout"
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
          icon={Banknote}
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
          <p className="text-sm text-muted-foreground">Mock payout windows</p>
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
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Delta views</th>
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
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {formatViews(c.deltaViews ?? c.views)}
                    <p className="text-[11px] text-muted-foreground">
                      paid through {formatViews(c.viewsPaidThrough ?? 0)}
                    </p>
                  </td>
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
