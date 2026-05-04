import { Link } from 'react-router-dom'
import { ArrowUpRight, TrendingUp, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatPHP } from '@/lib/utils'
import {
  getPlatformFeePercent,
  NICHE_LABEL,
  PLATFORM_LABEL,
  type Campaign,
} from '@/lib/mockData'

interface CampaignCardProps {
  campaign: Campaign
  to: string
  /** Show the spent vs budget bar (for brand). */
  showProgress?: boolean
}

const STATUS_STYLES: Record<Campaign['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  ended: 'bg-gray-100 text-gray-600 border-gray-200',
  draft: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function CampaignCard({ campaign, to, showProgress = false }: CampaignCardProps) {
  const platformFeePercent = campaign.platformFeePercent ?? getPlatformFeePercent(campaign.budget)
  const payoutPool = showProgress
    ? campaign.budget
    : Math.max(0, campaign.budget - campaign.budget * platformFeePercent)
  const remaining = Math.max(0, payoutPool - campaign.spent)
  const progressPct = payoutPool > 0 ? Math.min(100, (campaign.spent / payoutPool) * 100) : 0
  const displayRatePer1k = showProgress ? campaign.brandRatePer1k ?? campaign.ratePer1k : campaign.ratePer1k

  return (
    <Link
      to={to}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/15"
    >
      {/* Cover */}
      <div className={`relative h-40 overflow-hidden bg-linear-to-br ${campaign.coverColor}`}>
        {campaign.coverImageUrl ? (
          <img
            src={campaign.coverImageUrl}
            alt={campaign.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(circle_at_30%_20%,white,transparent_60%)]" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/20" />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {campaign.brandLogoUrl ? (
            <img
              src={campaign.brandLogoUrl}
              alt={`${campaign.brandName} logo`}
              className="h-10 w-10 rounded-xl object-cover shadow-md ring-2 ring-white/50"
              loading="lazy"
            />
          ) : (
            <div
              className={`h-10 w-10 rounded-xl bg-linear-to-br ${campaign.brandLogoColor} text-white flex items-center justify-center font-display font-extrabold text-sm shadow-md ring-2 ring-white/50`}
            >
              {campaign.brandName.charAt(0)}
            </div>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <Badge className={`${STATUS_STYLES[campaign.status]} capitalize border`}>
            {campaign.status}
          </Badge>
        </div>
        <div className="absolute bottom-3 right-3">
          <div className="rounded-xl bg-black/40 backdrop-blur px-3 py-1.5 text-white">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-lg font-extrabold">{formatPHP(displayRatePer1k, { decimals: false })}</span>
              <span className="text-[10px] uppercase opacity-80">/ 1K views</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {campaign.brandName}
          </p>
          <h3 className="mt-1 font-display text-lg font-bold leading-tight line-clamp-2 group-hover:text-phc-gradient">
            {campaign.title}
          </h3>
        </div>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {campaign.platforms.slice(0, 3).map((p) => (
            <Badge key={p} variant="outline" className="text-xs font-medium">
              {PLATFORM_LABEL[p]}
            </Badge>
          ))}
          {campaign.niches.slice(0, 2).map((n) => (
            <Badge key={n} variant="secondary" className="text-xs font-medium">
              {NICHE_LABEL[n]}
            </Badge>
          ))}
        </div>

        {showProgress ? (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Budget used</span>
              <span className="font-semibold">
                {formatPHP(campaign.spent, { decimals: false })} / {formatPHP(campaign.budget, { decimals: false })}
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-phc-gradient transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wallet className="h-3.5 w-3.5" />
                Budget left
              </div>
              <p className="mt-1 font-display text-sm font-extrabold">
                {formatPHP(remaining, { decimals: false })}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                Per view
              </div>
              <p className="mt-1 font-display text-sm font-extrabold">
                ₱{(campaign.ratePer1k / 1000).toFixed(3)}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">View campaign</span>
          <span className="flex items-center gap-1 font-semibold text-phc-gradient">
            Open <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
