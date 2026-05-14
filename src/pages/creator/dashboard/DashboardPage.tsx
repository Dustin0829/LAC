import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Eye, Scissors, ArrowUpRight, Clock } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { useAuth } from '@/lib/hooks/use-auth'
import { useContentStore } from '@/lib/stores/contentStore'
import {
  mockBrandPerformanceMonthly,
  mockBrandPerformanceYearly,
  type ContentStatus,
} from '@/lib/mockData'
import { formatPHP, formatViews } from '@/lib/utils'
import { StatCard } from '@/components/StatCard'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PersonAvatar } from '@/components/PersonAvatar'
import { PlatformCell } from '@/components/PlatformIcon'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TablePlaceholder,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TablePagination } from '@/components/TablePagination'
import { RefreshButton } from '@/components/RefreshButton'

/** Counts toward headline stats only after brand approval (mock: `paid`). Pending is excluded. */
function isApprovedForDashboardStats(status: ContentStatus): boolean {
  return status === 'paid'
}

type PerformanceRange = 'monthly' | 'yearly'

const RECENT_PAGE_SIZE = 10

/** Same buckets as brand “Campaign performance” — creator sees net payouts over time */
function creatorEarningsChartRowsForRange(range: PerformanceRange) {
  const rows = range === 'monthly' ? mockBrandPerformanceMonthly : mockBrandPerformanceYearly
  return rows.map(({ period, payout }) => ({
    period,
    earnings: payout,
  }))
}

export default function CreatorDashboardPage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const allContent = useContentStore((s) => s.contents)
  const contents = useMemo(
    () => allContent.filter((content) => content.creatorId === 'me'),
    [allContent]
  )
  const approvedContents = useMemo(
    () => contents.filter((c) => isApprovedForDashboardStats(c.status)),
    [contents]
  )
  const [earningsRange, setEarningsRange] = useState<PerformanceRange>('monthly')
  const [recentPage, setRecentPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const earningsChartData = useMemo(
    () => creatorEarningsChartRowsForRange(earningsRange),
    [earningsRange]
  )

  const totalEarnings = approvedContents.reduce((sum, c) => sum + c.earnings, 0)
  const totalViews = approvedContents.reduce((sum, c) => sum + c.views, 0)
  const pendingSubmissionCount = useMemo(
    () => contents.filter((c) => c.status === 'pending').length,
    [contents]
  )

  const sortedRecentSubmissions = useMemo(
    () =>
      [...contents]
        .filter((c) => c.status === 'pending' || c.status === 'rejected')
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
    [contents]
  )

  const recentTotalPages = Math.max(1, Math.ceil(sortedRecentSubmissions.length / RECENT_PAGE_SIZE))

  useEffect(() => {
    setRecentPage((p) => Math.min(p, recentTotalPages))
  }, [recentTotalPages])

  const recentPageRows = useMemo(() => {
    const start = (recentPage - 1) * RECENT_PAGE_SIZE
    return sortedRecentSubmissions.slice(start, start + RECENT_PAGE_SIZE)
  }, [sortedRecentSubmissions, recentPage])

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {contents.length === 0 ? (
              <>
                Welcome, <span className="text-phc-gradient">{firstName}</span>!
              </>
            ) : (
              <>
                Welcome back, <span className="text-phc-gradient">{firstName}</span>!
              </>
            )}
          </h1>
        </div>
        <RefreshButton
          variant="outline"
          isRefreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true)
            try {
              await new Promise((r) => setTimeout(r, 500))
            } finally {
              setRefreshing(false)
            }
          }}
          successMessage="Dashboard updated"
          aria-label="Refresh dashboard"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 -mt-2 md:-mt-0">
        <StatCard
          label="Lifetime Earnings"
          value={formatPHP(totalEarnings, { decimals: false })}
          icon={Wallet}
          accent="violet"
        />
        <StatCard
          label="Total Verified Views"
          value={formatViews(totalViews)}
          icon={Eye}
          accent="pink"
        />
        <StatCard
          label="Pending Submissions"
          value={pendingSubmissionCount}
          icon={Clock}
          accent="orange"
        />
      </div>

      {/* Earnings chart */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Earnings over time</h2>
          </div>
          <Select
            value={earningsRange}
            onValueChange={(v) => setEarningsRange(v as PerformanceRange)}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Date range">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" key={earningsRange}>
            <AreaChart data={earningsChartData}>
              <defs>
                <linearGradient id="creatorEarningsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="period"
                stroke="currentColor"
                className="text-xs"
                tickMargin={6}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="currentColor"
                className="text-xs"
                tickFormatter={(v) => formatPHP(Number(v), { decimals: false })}
              />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                }}
                formatter={(v: number) => [formatPHP(v, { decimals: false }), 'Earnings']}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="#3B82F6"
                strokeWidth={3}
                fill="url(#creatorEarningsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent submissions — layout aligned with brand dashboard */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Recent submissions</h2>
          <Link to="/submissions" className="text-sm font-semibold text-phc-gradient">
            View All <ArrowUpRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="cursor-default hover:bg-transparent">
                <TableHead>Brand</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRecentSubmissions.length === 0 ? (
                <TablePlaceholder
                  icon={<Scissors className="text-muted-foreground" />}
                  title="No recent submissions"
                  description="When you submit content to campaigns, pending and rejected items appear here."
                  colSpan={6}
                />
              ) : (
                recentPageRows.map((content) => {
                  const postHref = content.url
                  return (
                    <TableRow
                      key={content.id}
                      onClick={() => window.open(postHref, '_blank')}
                      className="hover:bg-muted/40 cursor-pointer [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2"
                    >
                      <TableCell className="max-w-56" onClick={(e) => e.stopPropagation()}>
                        <div className="flex min-w-0 items-center gap-2 rounded-md font-medium text-foreground">
                          <PersonAvatar name={content.brandName} size="xs" />
                          <span className="min-w-0 leading-snug">{content.brandName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-72 truncate" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/campaigns/${content.campaignId}`}
                          className="line-clamp-2 font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                          {content.campaignTitle}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <PlatformCell
                          platform={content.platform}
                          iconClassName="h-5 w-5"
                          // v1 (post-MVP): hasYellowBasket={Boolean(content.hasTikTokYellowBasket)}
                        />
                      </TableCell>
                      <TableCell className="font-display font-semibold tabular-nums">
                        {formatViews(content.views)}
                      </TableCell>
                      <TableCell className="font-display font-semibold tabular-nums text-phc-gradient">
                        {formatPHP(content.earnings, { decimals: false })}
                      </TableCell>
                      <TableCell>
                        <ContentStatusBadge status={content.status} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          {sortedRecentSubmissions.length === 0 ? null : (
            <TablePagination
              page={recentPage}
              pageSize={RECENT_PAGE_SIZE}
              totalItems={sortedRecentSubmissions.length}
              onPageChange={setRecentPage}
              itemLabel="submissions"
            />
          )}
        </TableContainer>
      </div>
    </div>
  )
}
