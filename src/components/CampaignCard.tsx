import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { formatPHP, formatViews } from '@/lib/utils'
import {
  brandHeadlineRatePer1k,
  creatorHeadlineRatePer1k,
  NICHE_LABEL,
  PLATFORM_LABEL,
  type Campaign,
} from '@/lib/mockData'

interface CampaignCardProps {
  campaign: Campaign
  to: string
  /** Brand dashboard cards show gross ₱/1k; clipper cards show net ₱/1k. */
  showProgress?: boolean
}

const STATUS_STYLES: Record<Campaign['status'], string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border-amber-200',
  ended: 'bg-gray-100 text-gray-600 border-gray-200',
  draft: 'bg-blue-50 text-blue-700 border-blue-200',
}

export function CampaignCard({ campaign, to, showProgress = false }: CampaignCardProps) {
  const displayRatePer1k = showProgress
    ? brandHeadlineRatePer1k(campaign)
    : creatorHeadlineRatePer1k(campaign)
  const goal = Math.max(0, campaign.estimatedReach)
  const viewsProgress = goal > 0 ? Math.min(100, (campaign.campaignViews / goal) * 100) : 0

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

        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground shrink-0">Views toward estimated reach</span>
            <span className="font-semibold tabular-nums text-right">
              {formatViews(campaign.campaignViews)}
              <span className="mx-1 font-normal text-muted-foreground">/</span>
              {goal > 0 ? formatViews(goal) : '—'}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-phc-gradient transition-all"
              style={{ width: `${goal > 0 ? viewsProgress : 0}%` }}
              role="progressbar"
              aria-valuenow={goal > 0 ? Math.round(viewsProgress) : 0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Campaign views versus estimated reach"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
