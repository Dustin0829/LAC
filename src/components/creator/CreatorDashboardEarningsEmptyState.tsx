import { EarningsEmptyIllustration } from '@/components/creator/EarningsEmptyIllustration'
import {
  creatorDashboardEarningsEmptyDescription,
  creatorDashboardEarningsEmptyTitle,
} from '@/lib/creators/dashboard/creatorDashboardPage'

export function CreatorDashboardEarningsEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <EarningsEmptyIllustration />
      <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {creatorDashboardEarningsEmptyTitle()}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {creatorDashboardEarningsEmptyDescription()}
      </p>
    </div>
  )
}
