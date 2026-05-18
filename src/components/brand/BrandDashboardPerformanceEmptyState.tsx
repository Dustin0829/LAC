import { CampaignPerformanceEmptyIllustration } from '@/components/brand/CampaignPerformanceEmptyIllustration'
import {
  brandDashboardPerformanceEmptyDescription,
  brandDashboardPerformanceEmptyTitle,
  brandDashboardPerformanceWaitingDescription,
  brandDashboardPerformanceWaitingTitle,
} from '@/lib/brands/dashboard/brandDashboardPage'

export type BrandDashboardPerformanceEmptyVariant = 'empty' | 'waiting'

type BrandDashboardPerformanceEmptyStateProps = {
  variant?: BrandDashboardPerformanceEmptyVariant
}

export function BrandDashboardPerformanceEmptyState({
  variant = 'empty',
}: BrandDashboardPerformanceEmptyStateProps) {
  const isWaiting = variant === 'waiting'
  const title = isWaiting
    ? brandDashboardPerformanceWaitingTitle()
    : brandDashboardPerformanceEmptyTitle()
  const description = isWaiting
    ? brandDashboardPerformanceWaitingDescription()
    : brandDashboardPerformanceEmptyDescription()

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <CampaignPerformanceEmptyIllustration />
      <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {title}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
