import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Wallet, Video, TrendingUp, ArrowUpRight, Plus } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import {
  useBrandDashboardStats,
  useBrandPerformanceChart,
} from '@/api/queries/brands/use-dashboard'
import { useBrandRecentSubmissions } from '@/api/queries/brands/use-submissions'
import type { BrandPerformanceRange } from '@/api/types/brands/dashboard.types'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  brandReviewStatusForBadge,
  creatorSocialHrefOrPost,
  formatPHP,
  formatViews,
  formatNumber,
} from '@/lib/utils'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PlatformCell } from '@/components/PlatformIcon'
import { PersonAvatar } from '@/components/PersonAvatar'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BrandDashboardPerformanceEmptyState,
  type BrandDashboardPerformanceEmptyVariant,
} from '@/components/brand/BrandDashboardPerformanceEmptyState'
import { brandPerformanceChartHasActivity } from '@/lib/brands/dashboard/brandDashboard'
import { BrandDashboardRecentSubmissionsEmptyState } from '@/components/brand/BrandDashboardRecentSubmissionsEmptyState'
import { TablePagination } from '@/components/TablePagination'
import { RefreshButton } from '@/components/RefreshButton'
import { VidULoading } from '@/components/VidULoading'
import { RECENT_PAGE_SIZE } from '@/lib/constants'

export default function BrandDashboardPage() {
  const { user } = useAuth()

  const [recentPage, setRecentPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const [performanceRange, setPerformanceRange] = useState<BrandPerformanceRange>('monthly')

  const {
    data: dashboardStats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useBrandDashboardStats()
  const {
    chartData: performanceChartData,
    isLoading: analyticsLoading,
    refetch: refetchAnalytics,
  } = useBrandPerformanceChart(performanceRange)

  const recentQueryParams = useMemo(
    () => ({ page: recentPage, limit: RECENT_PAGE_SIZE }),
    [recentPage]
  )
  const {
    data: recentSubmissions,
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecentSubmissions,
  } = useBrandRecentSubmissions(recentQueryParams)
  const recentPageRows = recentSubmissions?.rows ?? []
  const recentTotalItems = recentSubmissions?.meta.total_items ?? 0

  const totalCampaigns = dashboardStats?.totalCampaigns ?? 0
  const totalReached = dashboardStats?.totalReached ?? 0
  const totalSpent = dashboardStats?.totalSpent ?? 0
  const avgCostPerView = dashboardStats?.avgCostPerView ?? null

  const hasPerformanceActivity = brandPerformanceChartHasActivity(performanceChartData)
  const performanceEmptyVariant: BrandDashboardPerformanceEmptyVariant =
    !statsLoading && totalCampaigns > 0 ? 'waiting' : 'empty'

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            Hey {user?.name?.split(' ')[0] || 'Brand'}, your campaigns are{' '}
            <span className="text-phc-gradient">flying.</span>
          </h1>
        </div>
        <div className=" flex flex-wrap items-center justify-end gap-2">
          <RefreshButton
            variant="outline"
            isRefreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              try {
                await Promise.all([refetchStats(), refetchAnalytics(), refetchRecentSubmissions()])
              } finally {
                setRefreshing(false)
              }
            }}
            successMessage="Dashboard updated"
            aria-label="Refresh dashboard"
            className="w-full md:w-auto"
          />
          <Button
            asChild
            className="hidden md:flex flex-1 shrink-0 bg-phc-gradient text-white sm:w-auto"
          >
            <Link to="/brand/campaigns/new">
              <Plus className="h-4 w-4" /> New campaign
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 -mt-2 md:-mt-0">
        <StatCard
          label="Total Campaigns"
          value={statsLoading ? '—' : totalCampaigns}
          icon={Video}
          accent="violet"
        />
        <StatCard
          label="Total Spent"
          value={statsLoading ? '—' : formatPHP(totalSpent, { decimals: false })}
          icon={Wallet}
          accent="emerald"
        />
        <StatCard
          label="Total Reached"
          value={statsLoading ? '—' : formatViews(totalReached)}
          icon={Eye}
          accent="pink"
        />
        <StatCard
          label="Avg Cost per View"
          value={
            statsLoading
              ? '—'
              : avgCostPerView != null && totalReached > 0
                ? formatPHP(avgCostPerView)
                : '—'
          }
          icon={TrendingUp}
          accent="orange"
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Campaign performance</h2>
          </div>
          <Select
            value={performanceRange}
            onValueChange={(v) => setPerformanceRange(v as BrandPerformanceRange)}
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
          {analyticsLoading ? (
            <VidULoading label="Loading performance…" size="md" className="h-full" />
          ) : !hasPerformanceActivity ? (
            <BrandDashboardPerformanceEmptyState variant={performanceEmptyVariant} />
          ) : (
            <ResponsiveContainer width="100%" height="100%" key={performanceRange}>
              <AreaChart data={performanceChartData}>
                <defs>
                  <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="payoutFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.18} />
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
                  tickFormatter={(v) => formatNumber(Number(v))}
                />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                  }}
                  formatter={(v: number, name: string) =>
                    name === 'Views'
                      ? [formatViews(v), name]
                      : [formatPHP(v, { decimals: false }), name]
                  }
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  fill="url(#viewsFill)"
                />
                <Area
                  type="monotone"
                  dataKey="payout"
                  name="Payout"
                  stroke="#2563EB"
                  strokeWidth={3}
                  fill="url(#payoutFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent submissions */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Recent submissions</h2>
          <Link to="/brand/campaigns" className="text-sm font-semibold text-phc-gradient">
            View Campaigns <ArrowUpRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow className="cursor-default hover:bg-transparent">
                <TableHead>Creator</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLoading ? (
                <TableRow className="cursor-default hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12">
                    <VidULoading label="Loading submissions…" size="sm" />
                  </TableCell>
                </TableRow>
              ) : recentError ? (
                <TableRow className="cursor-default hover:bg-transparent">
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-destructive">
                    Could not load submissions. Try refreshing the dashboard.
                  </TableCell>
                </TableRow>
              ) : recentPageRows.length === 0 ? (
                <BrandDashboardRecentSubmissionsEmptyState colSpan={6} />
              ) : (
                recentPageRows.map((row) => (
                  <TableRow
                    onClick={() => window.open(row.url, '_blank')}
                    key={row.id}
                    className="hover:bg-muted/40 cursor-pointer [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2"
                  >
                    <TableCell className="max-w-56" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={creatorSocialHrefOrPost(row.url, row.platform)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-w-0 items-center gap-2 rounded-md font-medium text-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <PersonAvatar name={row.creatorName} src={row.creatorAvatarUrl} size="xs" />
                        <span className="min-w-0 leading-snug">{row.creatorName}</span>
                      </a>
                    </TableCell>
                    <TableCell className="max-w-72 truncate" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/brand/campaigns/${row.campaignId}`}
                        className="line-clamp-2 font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      >
                        {row.campaignTitle}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PlatformCell platform={row.platform} iconClassName="h-5 w-5" />
                    </TableCell>
                    <TableCell className="font-display font-semibold tabular-nums">
                      {formatViews(row.views)}
                    </TableCell>
                    <TableCell className="font-display font-semibold tabular-nums text-phc-gradient">
                      {formatPHP(row.payoutGross, { decimals: false })}
                    </TableCell>
                    <TableCell>
                      <ContentStatusBadge
                        status={brandReviewStatusForBadge(row.status, false)}
                        rejectionReason={row.rejectionReason}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {recentLoading || recentError || recentTotalItems === 0 ? null : (
            <TablePagination
              page={recentPage}
              pageSize={RECENT_PAGE_SIZE}
              totalItems={recentTotalItems}
              onPageChange={setRecentPage}
              itemLabel="submissions"
            />
          )}
        </TableContainer>
      </div>
    </div>
  )
}
