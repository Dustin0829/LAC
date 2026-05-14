import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Wallet, Video, TrendingUp, ArrowUpRight, Plus, Scissors } from 'lucide-react'
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
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { useContentStore } from '@/lib/stores/contentStore'
import {
  brandGrossAccrualForViews,
  brandHeadlineRatePer1k,
  mockBrandPerformanceMonthly,
  mockBrandPerformanceYearly,
} from '@/lib/mockData'
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
  TablePlaceholder,
  TableRow,
} from '@/components/ui/table'
import { TablePagination } from '@/components/TablePagination'
import { RefreshButton } from '@/components/RefreshButton'

type PerformanceRange = 'monthly' | 'yearly'

function chartRowsForRange(range: PerformanceRange) {
  return range === 'monthly' ? mockBrandPerformanceMonthly : mockBrandPerformanceYearly
}

const RECENT_PAGE_SIZE = 10

/** Ids produced by the mock `AuthPage` sign-in; they never match `campaign.brandId` in seed data. */
function isDemoAuthUserId(id: string): boolean {
  return /^gmail-\d+$/.test(id) || /^user-\d+$/.test(id)
}

export default function BrandDashboardPage() {
  const { user } = useAuth()
  const [performanceRange, setPerformanceRange] = useState<PerformanceRange>('monthly')
  const [recentPage, setRecentPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)
  const performanceChartData = useMemo(
    () => chartRowsForRange(performanceRange),
    [performanceRange]
  )
  const campaigns = useCampaignsStore((s) => s.campaigns)
  const contents = useContentStore((s) => s.contents)
  const brandCampaigns = useMemo(() => {
    if (!user?.id) return campaigns
    const forUser = campaigns.filter((c) => c.brandId === user.id)
    if (forUser.length > 0) return forUser
    if (isDemoAuthUserId(user.id)) return campaigns
    return []
  }, [campaigns, user?.id])
  const campaignById = useMemo(() => {
    const m = new Map<string, (typeof campaigns)[number]>()
    for (const c of campaigns) m.set(c.id, c)
    return m
  }, [campaigns])
  /** Verified views across this brand’s campaigns (same field as reach bars on campaign cards). */
  const totalReached = brandCampaigns.reduce((s, c) => s + (c.campaignViews ?? 0), 0)
  /** Brand gross accrued for those views at each campaign’s headline ₱/1k (matches submission accrual math). */
  const totalBrandGrossOnViews = brandCampaigns.reduce(
    (s, c) => s + brandGrossAccrualForViews(c.campaignViews ?? 0, brandHeadlineRatePer1k(c)),
    0
  )
  const avgCostPerView = totalReached > 0 ? totalBrandGrossOnViews / totalReached : null

  const sortedRecentSubmissions = useMemo(
    () =>
      [...contents]
        .filter((c) => c.creatorId !== 'me')
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
                await new Promise((r) => setTimeout(r, 500))
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
          value={brandCampaigns.length}
          icon={Video}
          accent="violet"
        />
        <StatCard
          label="Total Spent"
          value={formatPHP(totalBrandGrossOnViews, { decimals: false })}
          icon={Wallet}
          accent="emerald"
        />
        <StatCard
          label="Total Reached"
          value={formatViews(totalReached)}
          icon={Eye}
          accent="pink"
        />
        <StatCard
          label="Avg Cost per View"
          value={avgCostPerView != null ? formatPHP(avgCostPerView) : '—'}
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
            onValueChange={(v) => setPerformanceRange(v as PerformanceRange)}
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
              {sortedRecentSubmissions.length === 0 ? (
                <TablePlaceholder
                  icon={<Scissors className="text-muted-foreground" />}
                  title="No recent submissions"
                  description="When creators submit content, it will appear here."
                  colSpan={6}
                />
              ) : (
                recentPageRows.map((content) => {
                  const postHref = content.url
                  const rowCampaign = campaignById.get(content.campaignId)
                  const brandPer1k = rowCampaign ? brandHeadlineRatePer1k(rowCampaign) : 0
                  const payoutGross = brandGrossAccrualForViews(content.views, brandPer1k)
                  return (
                    <TableRow
                      onClick={() => window.open(postHref, '_blank')}
                      key={content.id}
                      className="hover:bg-muted/40 cursor-pointer [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2"
                    >
                      <TableCell className="max-w-56" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={creatorSocialHrefOrPost(content.url, content.platform)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 items-center gap-2 rounded-md font-medium text-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <PersonAvatar
                            name={content.creatorName}
                            src={content.creatorAvatarUrl}
                            size="xs"
                          />
                          <span className="min-w-0 leading-snug">{content.creatorName}</span>
                        </a>
                      </TableCell>
                      <TableCell className="max-w-72 truncate" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/brand/campaigns/${content.campaignId}`}
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
                        {rowCampaign ? formatPHP(payoutGross, { decimals: false }) : '—'}
                      </TableCell>
                      <TableCell>
                        <ContentStatusBadge
                          status={brandReviewStatusForBadge(content.status, false)}
                        />
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
