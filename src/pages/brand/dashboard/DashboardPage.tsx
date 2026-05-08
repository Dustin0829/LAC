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
import { useClipsStore } from '@/lib/stores/clipsStore'
import { mockBrandPerformance } from '@/lib/mockData'
import { formatPHP, formatViews } from '@/lib/utils'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ClipStatusBadge } from '@/components/ClipStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'

type PerformanceRange = 'weekly' | 'monthly' | 'yearly'

function sliceBrandPerformance(range: PerformanceRange) {
  if (range === 'weekly') return mockBrandPerformance.slice(-2)
  if (range === 'monthly') return mockBrandPerformance.slice(-4)
  return mockBrandPerformance
}

/** Chart rows: `period` is the x-axis tick; it updates with the range slice (e.g. W3–W6 for monthly). */
function chartRowsForRange(range: PerformanceRange) {
  return sliceBrandPerformance(range).map((row) => ({
    ...row,
    period: row.week,
  }))
}

const performanceRangeLabel: Record<PerformanceRange, string> = {
  weekly: 'Weekly',
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
  const clips = useClipsStore((s) => s.clips)
  const active = campaigns.filter((c) => c.status === 'active')
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0)
  const totalReached = mockBrandPerformance[mockBrandPerformance.length - 1]?.views ?? 0
  const avgCostPerView =
    totalReached > 0 ? totalSpent / totalReached : null
  const recentClips = useMemo(
    () =>
      [...clips]
        .filter((c) => c.status === 'pending' || c.status === 'rejected')
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        )
        .slice(0, 5),
    [clips]
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-phc-gradient-soft px-3 py-1 text-xs font-medium">
            Brand Owner
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            Hey {user?.name?.split(' ')[0] || 'Brand'}, your campaigns are{' '}
            <span className="text-phc-gradient">flying.</span>
          </h1>
        </div>
        <Button asChild className="bg-phc-gradient text-white">
          <Link to="/brand/campaigns/new">
            <Plus className="h-4 w-4" /> New campaign
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active Campaigns"
          value={active.length}
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
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-extrabold">Campaign performance</h2>
            <p className="text-sm text-muted-foreground">
              Views & payout · {performanceRangeLabel[performanceRange]}
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
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%" key={performanceRange}>
            <AreaChart data={performanceChartData} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
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
              <YAxis stroke="currentColor" className="text-xs" />
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
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-sm">
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
              {recentClips.map((clip) => (
                <tr
                  key={clip.id}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                  tabIndex={0}
                  aria-label={`Open clip by ${clip.clipperName}`}
                  onClick={() => window.open(clip.url, '_blank', 'noopener,noreferrer')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      window.open(clip.url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                >
                  <td className="px-5 py-4">
                    <p className="font-medium">{clip.clipperName}</p>
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex min-h-14 items-center gap-3">
                      <PlatformIcon platform={clip.platform} className="h-7 w-7" />
                      <span className="font-medium">
                        {clip.platform === 'tiktok' ? 'TikTok' : 'Facebook'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">{clip.campaignTitle}</td>
                  <td className="px-5 py-4 font-display font-bold">{formatViews(clip.views)}</td>
                  <td className="px-5 py-4 font-display font-bold text-phc-gradient">
                    {formatPHP(clip.earnings, { decimals: false })}
                  </td>
                  <td className="px-5 py-4">
                    <ClipStatusBadge status={clip.status} />
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
