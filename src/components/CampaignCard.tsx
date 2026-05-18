import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CampaignCoverImage } from '@/components/CampaignCoverImage'
import { CampaignGoalFireLottie } from '@/components/CampaignGoalFireLottie'
import { PlatformIcon } from '@/components/PlatformIcon'
import { formatPHP, formatNumber } from '@/lib/utils'
import { campaignStatusLabel } from '@/lib/campaigns/status'
import type { Campaign } from '@/lib/campaigns/types'
import { getCampaignReachViewGoal } from '@/lib/campaigns/utils'

interface CampaignCardProps {
  campaign: Campaign
  to: string
  /** Brand: views vs reach goal bar. Creator: budget consumed vs pool. */
  showProgress?: boolean
}

/** Subtle status chips — match `CampaignDetailPage` status chip palette. */
const STATUS_STYLES: Record<Campaign['status'], { chip: string; dot: string }> = {
  active: { chip: 'border-emerald-200 bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  paused: { chip: 'border-amber-200 bg-amber-50 text-amber-900', dot: 'bg-amber-500' },
  ended: { chip: 'border-zinc-200 bg-zinc-50 text-zinc-700', dot: 'bg-zinc-400' },
  draft: { chip: 'border-blue-200 bg-blue-50 text-blue-800', dot: 'bg-blue-500' },
  funding_pending: {
    chip: 'border-violet-200 bg-violet-50 text-violet-900',
    dot: 'bg-violet-500',
  },
}

export function CampaignCard({ campaign, to, showProgress = false }: CampaignCardProps) {
  const isBrandCard = showProgress
  const reachGoal = getCampaignReachViewGoal(campaign, {
    countedViews: campaign.campaignViews,
  })
  const budgetTotal = Math.max(0, campaign.budget)
  const viewsProgress =
    isBrandCard && reachGoal > 0 ? Math.min(100, (campaign.campaignViews / reachGoal) * 100) : 0
  const budgetProgress =
    !isBrandCard && budgetTotal > 0 ? Math.min(100, (campaign.spent / budgetTotal) * 100) : 0
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
          <CampaignCoverImage
            src={campaign.coverImageUrl}
            fallbackSrc={campaign.coverImageFallbackUrl}
            alt={campaign.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-radial from-white/35 via-white/10 to-transparent opacity-30 mix-blend-overlay" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-black/20" />
        <div className="absolute top-3 right-3">
          <Badge
            className={`${STATUS_STYLES[campaign.status].chip} flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize tracking-normal shadow-sm`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_STYLES[campaign.status].dot}`}
              aria-hidden
            />
            {campaignStatusLabel(campaign.status)}
          </Badge>
        </div>
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
                campaign.status === 'draft' ? (
                  <span>—</span>
                ) : reachGoal > 0 ? (
                  <div className="flex items-end">
                    <span>
                      {formatNumber(Math.round(campaign.campaignViews))} / {formatNumber(reachGoal)}{' '}
                      Views
                    </span>
                    {showFire ? <CampaignGoalFireLottie /> : null}
                  </div>
                ) : (
                  <span>
                    {campaign.campaignViews > 0
                      ? `${formatNumber(Math.round(campaign.campaignViews))} Views`
                      : '—'}
                  </span>
                )
              ) : budgetTotal > 0 ? (
                <div className="flex items-end">
                  <span>
                    {formatPHP(campaign.spent)} / {formatPHP(budgetTotal)}
                  </span>
                  {showFire ? <CampaignGoalFireLottie /> : null}
                </div>
              ) : (
                <span>
                  {formatPHP(campaign.spent)} / {formatPHP(Math.max(budgetTotal, campaign.spent))}
                </span>
              )}
            </span>
          </div>
          <Progress
            value={barWidth}
            max={100}
            animated
            indicatorClassName="bg-phc-gradient rounded-full"
            aria-label={
              isBrandCard
                ? 'Progress toward estimated reach goal'
                : 'Share of campaign budget consumed'
            }
          />
          <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-3">
            <div className="flex items-center gap-2">
              {campaign.platforms.map((p) => (
                <PlatformIcon key={p} platform={p} className="h-6 w-6" />
              ))}
            </div>
            <span className="text-sm font-semibold tracking-tight text-phc-gradient">
              {showProgress ? 'Open Campaign' : 'Join Campaign'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
