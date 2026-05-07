import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  Eye,
  Scissors,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
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
import { useClipsStore } from '@/lib/stores/clipsStore'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { creatorHeadlineRatePer1k, mockEarningsTrend } from '@/lib/mockData'
import { formatPHP, formatViews } from '@/lib/utils'
import { StatCard } from '@/components/StatCard'
import { ClipStatusBadge } from '@/components/ClipStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { Button } from '@/components/ui/button'

export default function ClipperDashboardPage() {
  const { user } = useAuth()
  const allClips = useClipsStore((s) => s.clips)
  const clips = useMemo(
    () => allClips.filter((clip) => clip.clipperId === 'me'),
    [allClips]
  )
  const campaigns = useCampaignsStore((s) => s.campaigns)

  const totalEarnings = clips.reduce((sum, c) => sum + c.earnings, 0)
  const paidEarnings = clips
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.earnings, 0)
  const pendingEarnings = totalEarnings - paidEarnings
  const totalViews = clips.reduce((sum, c) => sum + c.views, 0)
  const recent = clips.slice(0, 4)
  const featured = campaigns.filter((c) => c.status === 'active').slice(0, 3)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-phc-gradient-soft px-3 py-1 text-xs font-medium text-foreground">
            <Sparkles className="h-3 w-3" />
            Creator
          </p>
          <h1 className="mt-3 font-display text-3xl md:text-4xl font-extrabold tracking-tight">
            Hey {user?.name?.split(' ')[0] || 'there'}, ready to earn from verified views? <span className="text-phc-gradient">Let’s go.</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track submissions, verified view deltas, and weekly payout status in one place.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/clipper/clips">My clips</Link>
          </Button>
          <Button asChild className="bg-phc-gradient text-white hover:opacity-90">
            <Link to="/clipper/campaigns">Browse campaigns</Link>
          </Button>
        </div>
      </div>

      {/* Stats — two summary cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              className="border-0 bg-muted/30 shadow-none"
              label="Total earnings"
              value={formatPHP(totalEarnings, { decimals: false })}
              hint={`${formatPHP(pendingEarnings, { decimals: false })} pending`}
              icon={Wallet}
              accent="violet"
            />
            <StatCard
              className="border-0 bg-muted/30 shadow-none"
              label="Paid out"
              value={formatPHP(paidEarnings, { decimals: false })}
              hint="Sent to your default payout"
              icon={TrendingUp}
              accent="emerald"
            />
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              className="border-0 bg-muted/30 shadow-none"
              label="Total views"
              value={formatViews(totalViews)}
              hint="Across all clips"
              icon={Eye}
              accent="pink"
            />
            <StatCard
              className="border-0 bg-muted/30 shadow-none"
              label="Active clips"
              value={clips.length}
              hint={`${clips.filter((c) => c.status === 'pending').length} pending review`}
              icon={Scissors}
              accent="orange"
            />
          </div>
        </div>
      </div>

      {/* Earnings chart */}
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-extrabold">Earnings over time</h2>
            <p className="text-sm text-muted-foreground">Last 6 weeks</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">This month</p>
            <p className="font-display text-2xl font-extrabold text-phc-gradient">
              {formatPHP(mockEarningsTrend.reduce((s, w) => s + w.earnings, 0), { decimals: false })}
            </p>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <AreaChart data={mockEarningsTrend} margin={{ top: 5, right: 8, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="week" stroke="currentColor" className="text-xs text-muted-foreground" />
              <YAxis stroke="currentColor" className="text-xs text-muted-foreground" />
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
                fill="url(#earningsFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent clips */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-extrabold">Recent clips</h2>
          <Link to="/clipper/clips" className="text-sm font-semibold text-phc-gradient">
            View all <ArrowUpRight className="inline h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <Scissors className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium">No clips yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Browse campaigns and submit your first clip.</p>
            <Button asChild className="mt-4 bg-phc-gradient text-white">
              <Link to="/clipper/campaigns">Browse campaigns</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Clip</th>
                  <th className="px-5 py-3 font-medium hidden sm:table-cell">Campaign</th>
                  <th className="px-5 py-3 font-medium">Views</th>
                  <th className="px-5 py-3 font-medium">Earnings</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recent.map((clip) => (
                  <tr key={clip.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={clip.platform} className="h-9 w-9" />
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{clip.url.split('/').pop()}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">{clip.brandName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <p className="text-foreground">{clip.brandName}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{clip.campaignTitle}</p>
                    </td>
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
        )}
      </div>

      {/* Featured campaigns */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-extrabold">Hot campaigns</h2>
            <Link to="/clipper/campaigns" className="text-sm font-semibold text-phc-gradient">
              See all <ArrowUpRight className="inline h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((c) => (
              <Link
                key={c.id}
                to={`/clipper/campaigns/${c.id}`}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-md"
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
    </div>
  )
}
