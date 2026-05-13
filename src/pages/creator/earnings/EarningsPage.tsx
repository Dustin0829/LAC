import { useMemo, useState } from 'react'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PersonAvatar } from '@/components/PersonAvatar'
import { PlatformCell } from '@/components/PlatformIcon'
import { TablePagination } from '@/components/TablePagination'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/StatCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { mockEarningsTrend } from '@/lib/mockData'
import { useContentStore } from '@/lib/stores/contentStore'
import { formatDate, formatPHP, formatViews } from '@/lib/utils'
import { Clock, Scissors, Wallet } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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

const TRANSACTION_PAGE_SIZE = 8

export default function CreatorEarningsPage() {
  const allContent = useContentStore((s) => s.contents)
  const contents = useMemo(
    () => allContent.filter((content) => content.creatorId === 'me'),
    [allContent]
  )
  const [chartRange, setChartRange] = useState<ChartRange>('monthly')
  const [transactionPage, setTransactionPage] = useState(1)

  const barChartData = useMemo(() => barChartRowsForRange(chartRange), [chartRange])
  const rangeBarTotal = barChartData.reduce((s, row) => s + row.earnings, 0)

  const totalEarned = contents.reduce((s, c) => s + c.earnings, 0)
  const paidTotal = contents.filter((c) => c.status === 'paid').reduce((s, c) => s + c.earnings, 0)
  const unpaidTotal = Math.max(0, totalEarned - paidTotal)
  const ongoingSubmissionCount = contents.filter((c) => c.status === 'pending').length

  const transactionRows = useMemo(
    () =>
      [...contents]
        .filter((c) => c.status === 'paid' || (c.status === 'pending' && c.reviewedAt))
        .sort(
          (a, b) =>
            new Date(b.paidAt ?? b.reviewedAt ?? b.submittedAt).getTime() -
            new Date(a.paidAt ?? a.reviewedAt ?? a.submittedAt).getTime()
        ),
    [contents]
  )

  const transactionTotalPages = Math.max(
    1,
    Math.ceil(transactionRows.length / TRANSACTION_PAGE_SIZE)
  )
  const transactionSafePage = Math.min(Math.max(1, transactionPage), transactionTotalPages)
  const transactionPageRows = transactionRows.slice(
    (transactionSafePage - 1) * TRANSACTION_PAGE_SIZE,
    transactionSafePage * TRANSACTION_PAGE_SIZE
  )

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Earnings
        </p>
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
              Accrual windows · {chartRangeLabel[chartRange]}
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

      <TableContainer>
        <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <h2 className="font-display text-lg font-extrabold sm:text-xl">Recent transactions</h2>
        </div>
        {transactionRows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No transactions yet.</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="cursor-default hover:bg-transparent">
                  <TableHead>Campaign</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Earned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionPageRows.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-2">
                        <PersonAvatar name={c.brandName} size="xs" className="shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.campaignTitle}</p>
                          <p className="truncate text-xs text-muted-foreground">{c.brandName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <PlatformCell
                        platform={c.platform}
                        iconClassName="h-5 w-5"
                        // v1 (post-MVP): hasYellowBasket={Boolean(c.hasTikTokYellowBasket)}
                      />
                    </TableCell>
                    <TableCell className="tabular-nums">{formatViews(c.views)}</TableCell>
                    <TableCell className="font-display text-sm font-bold tabular-nums text-phc-gradient">
                      {formatPHP(c.earnings, { decimals: false })}
                    </TableCell>
                    <TableCell>
                      <ContentStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {formatDate(c.paidAt ?? c.reviewedAt ?? c.submittedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              page={transactionSafePage}
              pageSize={TRANSACTION_PAGE_SIZE}
              totalItems={transactionRows.length}
              onPageChange={setTransactionPage}
              itemLabel="transactions"
            />
          </>
        )}
      </TableContainer>
    </div>
  )
}
