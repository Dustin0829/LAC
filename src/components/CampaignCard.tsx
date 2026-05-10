import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { formatPHP, formatNumber } from '@/lib/utils'
import { type Campaign } from '@/lib/mockData'

interface CampaignCardProps {
  campaign: Campaign
  to: string
  /** Brand: views vs reach goal bar. Creator: budget consumed vs pool. */
  showProgress?: boolean
}

const STATUS_STYLES: Record<Campaign['status'], string> = {
  active: 'bg-emerald-500/95 text-white border-emerald-600/30',
  paused: 'bg-amber-500/95 text-white border-amber-600/30',
  ended: 'bg-zinc-600/95 text-white border-zinc-700/50',
  draft: 'bg-blue-600/95 text-white border-blue-700/40',
}

export function CampaignCard({ campaign, to, showProgress = false }: CampaignCardProps) {
  const isBrandCard = showProgress
  const reachGoal = Math.max(0, campaign.estimatedReach)
  const budgetTotal = Math.max(0, campaign.budget)
  const viewsProgress =
    isBrandCard && reachGoal > 0
      ? Math.min(100, (campaign.campaignViews / reachGoal) * 100)
      : 0
  const budgetProgress =
    !isBrandCard && budgetTotal > 0
      ? Math.min(100, (campaign.spent / budgetTotal) * 100)
      : 0
  const progressPercent = isBrandCard ? viewsProgress : budgetProgress
  const showFire = isBrandCard
    ? reachGoal > 0 && viewsProgress >= 50
    : budgetTotal > 0 && budgetProgress >= 50

  const [barWidth, setBarWidth] = useState(0)
  useEffect(() => {
    setBarWidth(0)
    const t = window.setTimeout(
      () => setBarWidth(isBrandCard ? (reachGoal > 0 ? viewsProgress : 0) : budgetProgress),
      40
    )
    return () => clearTimeout(t)
  }, [isBrandCard, reachGoal, viewsProgress, budgetProgress, campaign.id])

  return (
    <Link
      to={to}
      className="group relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-blue-500/40"
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
        <div className="absolute top-3 right-3">
          <Badge
            className={`${STATUS_STYLES[campaign.status]} rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`}
          >
            {campaign.status}
          </Badge>
        </div>
        {/* <div className="absolute bottom-3 right-3 max-w-[min(100%,14rem)]">
          <div className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-white backdrop-blur-md">
            <p className="text-[9px] font-semibold uppercase leading-tight tracking-[0.12em] text-white/85">
              Cost per 1K views
            </p>
            <p className="mt-0.5 font-display text-xl font-extrabold leading-none tracking-tight">
              {formatPHP(displayRatePer1k, { decimals: false })}
            </p>
          </div>
        </div> */}
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="shrink-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {campaign.brandName}
          </p>
          <h3 className="mt-1 line-clamp-2 font-display text-lg font-bold leading-tight group-hover:text-phc-gradient">
            {campaign.title}
          </h3>
        </div>

        <p className="mt-2 line-clamp-2 shrink-0 text-sm text-muted-foreground">
          {campaign.description}
        </p>

        <div className="min-h-0 flex-1" aria-hidden />

        <div className="mt-5 shrink-0 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {isBrandCard ? 'Goal' : 'Budget'}
            </span>
            <span className="flex items-center gap-1.5 text-right text-sm font-semibold tabular-nums">
              {isBrandCard ? (
                reachGoal > 0 ? (
                  <>
                    <span>
                      {formatNumber(Math.round(campaign.campaignViews))} / {formatNumber(reachGoal)}{' '}
                      Views
                    </span>
                    {showFire ? (
                      <Flame
                        className="h-4 w-4 shrink-0 text-orange-500"
                        aria-hidden
                      />
                    ) : null}
                  </>
                ) : (
                  <span>{formatNumber(Math.round(campaign.campaignViews))} Views</span>
                )
              ) : budgetTotal > 0 ? (
                <>
                  <span>
                    {formatPHP(campaign.spent)} / {formatPHP(budgetTotal)}
                  </span>
                  {showFire ? (
                    <Flame
                      className="h-4 w-4 shrink-0 text-orange-500"
                      aria-hidden
                    />
                  ) : null}
                </>
              ) : (
                <span>
                  {formatPHP(campaign.spent)} / {formatPHP(Math.max(budgetTotal, campaign.spent))}
                </span>
              )}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-phc-gradient transition-[width] duration-1000 ease-out motion-reduce:transition-none"
              style={{ width: `${barWidth}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progressPercent)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={
                isBrandCard
                  ? 'Progress toward estimated reach goal'
                  : 'Share of campaign budget consumed'
              }
            />
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="flex items-center gap-2">
              {campaign.platforms.map((p) => (
                <PlatformIcon key={p} platform={p} className="h-6 w-6" />
              ))}
            </div>
            <span className="text-sm font-bold tracking-tight text-phc-gradient">
              {showProgress ? 'Open Campaign' : 'Join Campaign'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
