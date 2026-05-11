import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Eye,
  Scissors,
  ArrowUpRight,
  Sparkles,
  CircleAlert,
} from 'lucide-react'
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
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { creatorHeadlineRatePer1k, mockEarningsTrend } from '@/lib/mockData'
import { formatPHP, formatViews } from '@/lib/utils'
import { StatCard } from '@/components/StatCard'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PerformanceRange = 'weekly' | 'monthly' | 'yearly'

function sliceEarningsTrend(range: PerformanceRange) {
  if (range === 'weekly') return mockEarningsTrend.slice(-2)
  if (range === 'monthly') return mockEarningsTrend.slice(-4)
  return mockEarningsTrend
}

function earningsChartRowsForRange(range: PerformanceRange) {
  return sliceEarningsTrend(range).map((row) => ({
    ...row,
    period: row.week,
  }))
}

const earningsRangeLabel: Record<PerformanceRange, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

export default function CreatorDashboardPage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const allContent = useContentStore((s) => s.contents)
  const contents = useMemo(
    () => allContent.filter((content) => content.creatorId === 'me'),
    [allContent]
  )
  const campaigns = useCampaignsStore((s) => s.campaigns)
  const [earningsRange, setEarningsRange] = useState<PerformanceRange>('monthly')
  const [attention, setAttention] = useState<{ title: string; body: string } | null>(null)

  const earningsChartData = useMemo(
    () => earningsChartRowsForRange(earningsRange),
    [earningsRange]
  )
  const rangeEarningsTotal = earningsChartData.reduce((s, row) => s + row.earnings, 0)

  const totalEarnings = contents.reduce((sum, c) => sum + c.earnings, 0)
  const totalViews = contents.reduce((sum, c) => sum + c.views, 0)
  const activeContentCount = contents.filter((c) => c.status !== 'rejected').length
  const recent = useMemo(
    () =>
      [...contents]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 5),
    [contents]
  )
  const featured = campaigns.filter((c) => c.status === 'active').slice(0, 3)

  function openAttention(content: (typeof contents)[number]) {
    const body = [content.rejectionReason, content.trustFlag].filter(Boolean).join('\n\n')
    if (!body.trim()) return
    const title =
      content.status === 'rejected' ? 'Rejection reason' : 'Needs your attention'
    setAttention({ title, body })
  }

  return (
    <div className="min-w-0 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-phc-gradient-soft px-3 py-1 text-xs font-medium text-foreground">
            <Sparkles className="h-3 w-3" />
            Creator
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-extrabold tracking-tight">
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
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/creator/content">My content</Link>
          </Button>
          <Button asChild className="bg-phc-gradient text-white hover:opacity-90">
            <Link to="/creator/campaigns">Browse campaigns</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total earnings"
          value={formatPHP(totalEarnings, { decimals: false })}
          icon={Wallet}
          accent="violet"
        />
        <StatCard label="Total views" value={formatViews(totalViews)} icon={Eye} accent="pink" />
        <StatCard label="Active content" value={activeContentCount} icon={Scissors} accent="orange" />
      </div>

      {/* Earnings chart */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold">Earnings over time</h2>
            <p className="text-sm text-muted-foreground">
              Verified accrual · {earningsRangeLabel[earningsRange]}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:gap-4">
            <div className="text-left sm:text-right">
              <p className="text-xs text-muted-foreground">In range</p>
              <p className="font-display text-2xl font-extrabold text-phc-gradient">
                {formatPHP(rangeEarningsTotal, { decimals: false })}
              </p>
            </div>
            <Select
              value={earningsRange}
              onValueChange={(v) => setEarningsRange(v as PerformanceRange)}
            >
              <SelectTrigger className="w-full sm:w-44" aria-label="Date range">
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
        <div className="h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" key={earningsRange}>
            <AreaChart data={earningsChartData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="creatorEarningsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="period" stroke="currentColor" className="text-xs text-muted-foreground" />
              <YAxis
                stroke="currentColor"
                className="text-xs text-muted-foreground"
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

      {/* Recent content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-extrabold">Recent content</h2>
          <Link to="/creator/content" className="text-sm font-semibold text-phc-gradient">
            View all <ArrowUpRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <Scissors className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No content yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Browse campaigns and submit your first content.</p>
            <Button asChild className="mt-4 bg-phc-gradient text-white">
              <Link to="/creator/campaigns">Browse campaigns</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-border bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Campaign</th>
                  <th className="px-5 py-3 font-medium">Platform</th>
                  <th className="px-5 py-3 font-medium">Views</th>
                  <th className="px-5 py-3 font-medium">Earned</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 w-24 text-center font-medium">Warning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((content) => {
                  const hasAttention = Boolean(content.trustFlag || content.rejectionReason)
                  return (
                    <tr key={content.id} className="transition-colors hover:bg-muted/30">
                      <td className="max-w-0 px-5 py-4">
                        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {content.brandName}
                        </p>
                        <p className="truncate font-medium text-foreground" title={content.campaignTitle}>
                          {content.campaignTitle}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <div className="flex justify-start">
                          <PlatformIcon platform={content.platform} className="h-7 w-7" />
                        </div>
                      </td>
                      <td className="px-5 py-4 font-display font-bold tabular-nums">
                        {formatViews(content.views)}
                      </td>
                      <td className="px-5 py-4 font-display font-bold text-phc-gradient tabular-nums">
                        {formatPHP(content.earnings, { decimals: false })}
                      </td>
                      <td className="px-5 py-4">
                        <ContentStatusBadge status={content.status} />
                      </td>
                      <td className="px-5 py-4 text-center">
                        {hasAttention ? (
                          <button
                            type="button"
                            onClick={() => openAttention(content)}
                            className="inline-flex rounded-full p-1 text-amber-600 transition-colors hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={
                              content.status === 'rejected'
                                ? 'View rejection reason'
                                : 'View attention note'
                            }
                          >
                            <CircleAlert className="h-4 w-4" strokeWidth={2} />
                          </button>
                        ) : (
                          <span className="inline-block w-6" aria-hidden />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Featured campaigns */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-extrabold">Hot campaigns</h2>
            <Link to="/creator/campaigns" className="text-sm font-semibold text-phc-gradient">
              See all <ArrowUpRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <Link
                key={c.id}
                to={`/creator/campaigns/${c.id}`}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
              >
                <div
                  className={`h-14 w-14 shrink-0 rounded-xl bg-linear-to-br ${c.brandLogoColor} text-white flex items-center justify-center font-display font-extrabold text-xl`}
                >
                  {c.brandName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {c.brandName}
                  </p>
                  <p className="mt-0.5 font-semibold line-clamp-2 group-hover:text-phc-gradient">
                    {c.title}
                  </p>
                  <p className="mt-2 text-sm font-display font-extrabold">
                    {formatPHP(creatorHeadlineRatePer1k(c), { decimals: false })}
                    <span className="text-xs font-medium text-muted-foreground"> / 1K views</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={attention !== null}
        onOpenChange={(open) => {
          if (!open) setAttention(null)
        }}
      >
        <DialogContent className="rounded-3xl border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{attention?.title ?? ''}</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap text-left text-base text-foreground">
              {attention?.body ?? ''}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
