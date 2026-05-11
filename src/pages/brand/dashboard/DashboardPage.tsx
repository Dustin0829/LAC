import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye,
  Wallet,
  Video,
  TrendingUp,
  ArrowUpRight,
  Plus,
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
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { useContentStore } from '@/lib/stores/contentStore'
import {
  mockBrandPerformanceMonthly,
  mockBrandPerformanceYearly,
} from '@/lib/mockData'
import { formatPHP, formatViews, formatNumber } from '@/lib/utils'
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
import { PlatformIcon } from '@/components/PlatformIcon'

type PerformanceRange = 'monthly' | 'yearly'

function chartRowsForRange(range: PerformanceRange) {
  return range === 'monthly' ? mockBrandPerformanceMonthly : mockBrandPerformanceYearly
}

const performanceRangeLabel: Record<PerformanceRange, string> = {
  monthly: 'Monthly',
  yearly: 'Yearly',
}

export default function BrandDashboardPage() {
  const { user } = useAuth()
  const [performanceRange, setPerformanceRange] = useState<PerformanceRange>('monthly')
  const performanceChartData = useMemo(
    () => chartRowsForRange(performanceRange),
    [performanceRange]
  )
  const campaigns = useCampaignsStore((s) => s.campaigns)
  const contents = useContentStore((s) => s.contents)
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0)
  const totalReached = mockBrandPerformanceMonthly.reduce((sum, row) => sum + row.views, 0)
  const avgCostPerView =
    totalReached > 0 ? totalSpent / totalReached : null
  const recentContent = useMemo(
    () =>
      [...contents]
        .filter((c) => c.status === 'pending' || c.status === 'rejected')
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
        .slice(0, 5),
    [contents]
  )

  return (
    <div className="min-w-0 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            Hey {user?.name?.split(' ')[0] || 'Brand'}, your campaigns are{' '}
            <span className="text-phc-gradient">flying.</span>
          </h1>
        </div>
        <Button asChild className="w-full shrink-0 bg-phc-gradient text-white sm:w-auto">
          <Link to="/brand/campaigns/new">
            <Plus className="h-4 w-4" /> New campaign
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Campaigns"
          value={campaigns.length}
          icon={Video}
          accent="violet"
        />
        <StatCard
          label="Total Spent"
          value={formatPHP(totalSpent, { decimals: false })}
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

      {/* Performance chart */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-none">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold">Campaign performance</h2>
            <p className="text-sm text-muted-foreground">
              High-level views and payout accrual (MVP — not deep ROI analytics).{' '}
              {performanceRangeLabel[performanceRange]}
            </p>
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
            <AreaChart data={performanceChartData} margin={{ top: 12, right: 8, left: -10, bottom: 8 }}>
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
              <XAxis dataKey="period" stroke="currentColor" className="text-xs" />
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
                  name === 'Views' ? [formatViews(v), name] : [formatPHP(v, { decimals: false }), name]
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-extrabold">Recent submissions</h2>
          <Link to="/brand/campaigns" className="text-sm font-semibold text-phc-gradient">
            See all <ArrowUpRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium">Platform</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Campaign</th>
                <th className="px-5 py-3 font-medium">Views</th>
                <th className="px-5 py-3 font-medium">Earnings</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recentContent.map((content) => (
                <tr
                  key={content.id}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                  tabIndex={0}
                  aria-label={`Open content by ${content.creatorName}`}
                  onClick={() => window.open(content.url, '_blank', 'noopener,noreferrer')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      window.open(content.url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">{content.creatorName}</p>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex min-h-14 items-center gap-3">
                      <PlatformIcon platform={content.platform} className="h-7 w-7" />
                      <span className="font-medium">
                        {content.platform === 'tiktok' ? 'TikTok' : 'Facebook'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">{content.campaignTitle}</td>
                  <td className="px-5 py-4 font-display font-bold">{formatViews(content.views)}</td>
                  <td className="px-5 py-4 font-display font-bold text-phc-gradient">
                    {formatPHP(content.earnings, { decimals: false })}
                  </td>
                  <td className="px-5 py-4">
                    <ContentStatusBadge status={content.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
