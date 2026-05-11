import { useMemo, useState } from 'react'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { StatCard } from '@/components/StatCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockEarningsTrend, PLATFORM_LABEL } from '@/lib/mockData'
import { useContentStore } from '@/lib/stores/contentStore'
import { formatDate, formatPHP, formatViews } from '@/lib/utils'
import { Clock, Scissors, Wallet } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type ChartRange = 'weekly' | 'monthly' | 'yearly'

function sliceEarningsTrend(range: ChartRange) {
  if (range === 'weekly') return mockEarningsTrend.slice(-2)
  if (range === 'monthly') return mockEarningsTrend.slice(-4)
  return mockEarningsTrend
}

function barChartRowsForRange(range: ChartRange) {
  return sliceEarningsTrend(range).map((row) => ({
    ...row,
    period: row.week,
  }))
}

const chartRangeLabel: Record<ChartRange, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

export default function CreatorEarningsPage() {
  const allContent = useContentStore((s) => s.contents)
  const contents = useMemo(
    () => allContent.filter((content) => content.creatorId === 'me'),
    [allContent]
  )
  const [chartRange, setChartRange] = useState<ChartRange>('monthly')

  const barChartData = useMemo(() => barChartRowsForRange(chartRange), [chartRange])
  const rangeBarTotal = barChartData.reduce((s, row) => s + row.earnings, 0)

  const totalEarned = contents.reduce((s, c) => s + c.earnings, 0)
  const paidTotal = contents
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => s + c.earnings, 0)
  const unpaidTotal = Math.max(0, totalEarned - paidTotal)
  const ongoingSubmissionCount = contents.filter((c) => c.status === 'pending').length

  const recentTransactions = [...contents]
    .filter((c) => c.status === 'paid' || (c.status === 'pending' && c.reviewedAt))
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Ongoing Submission"
          value={ongoingSubmissionCount}
          hint="Content in review or accruing"
          icon={Scissors}
          accent="violet"
        />
        <StatCard
          label="Lifetime Earnings"
          value={formatPHP(totalEarned, { decimals: false })}
          icon={Wallet}
          accent="pink"
        />
        <StatCard
          label="Pending"
          value={formatPHP(unpaidTotal, { decimals: false })}
          hint="Not yet paid out"
          icon={Clock}
          accent="orange"
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold">Earnings trend</h2>
            <p className="text-sm text-muted-foreground">
              Mock accrual windows · {chartRangeLabel[chartRange]}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">In range</p>
              <p className="font-display text-lg font-extrabold text-phc-gradient tabular-nums">
                {formatPHP(rangeBarTotal, { decimals: false })}
              </p>
            </div>
            <Select value={chartRange} onValueChange={(v) => setChartRange(v as ChartRange)}>
              <SelectTrigger className="w-full sm:w-44" aria-label="Chart date range">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" key={chartRange}>
            <BarChart data={barChartData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="period" stroke="currentColor" className="text-xs" />
              <YAxis stroke="currentColor" className="text-xs" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                }}
                formatter={(v: number) => [formatPHP(v, { decimals: false }), 'Earnings']}
              />
              <Bar dataKey="earnings" radius={[8, 8, 0, 0]} fill="url(#earningsBarFill)" />
              <defs>
                <linearGradient id="earningsBarFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-card">
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
                <th className="px-6 py-3 font-medium">Platform</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Views</th>
                <th className="px-6 py-3 font-medium">Earned</th>
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
                  <td className="px-6 py-4 align-middle">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={c.platform} className="h-7 w-7" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {PLATFORM_LABEL[c.platform]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell tabular-nums">
                    {formatViews(c.views)}
                  </td>
                  <td className="px-6 py-4 font-display font-bold tabular-nums text-phc-gradient">
                    {formatPHP(c.earnings, { decimals: false })}
                  </td>
                  <td className="px-6 py-4">
                    <ContentStatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell tabular-nums text-muted-foreground">
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
