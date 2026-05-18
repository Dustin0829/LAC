import { CampaignFiltersEmptyIllustration } from '@/components/creator/CampaignFiltersEmptyIllustration'
import {
  creatorCampaignEmptyFilterDescription,
  creatorCampaignEmptyFilterTitle,
} from '@/lib/creators/campaigns/creatorCampaignsPage'

export function CreatorCampaignsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-12 text-center sm:px-12 sm:py-16">
      <CampaignFiltersEmptyIllustration />
      <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {creatorCampaignEmptyFilterTitle()}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {creatorCampaignEmptyFilterDescription()}
      </p>
    </div>
  )
}
