import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

import { SubmissionsEmptyIllustration } from '@/components/creator/SubmissionsEmptyIllustration'
import { Button } from '@/components/ui/button'
import {
  creatorSubmissionEmptyFilterDescription,
  creatorSubmissionEmptyPlaceholderTitle,
  type CreatorSubmissionTab,
} from '@/lib/creators/submissions/creatorSubmissionsPage'

type CreatorSubmissionsEmptyStateProps = {
  tab: CreatorSubmissionTab
  /** Show "Browse Campaigns" when the creator has no submissions at all. */
  showBrowseCampaigns?: boolean
}

export function CreatorSubmissionsEmptyState({
  tab,
  showBrowseCampaigns = false,
}: CreatorSubmissionsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-12 text-center sm:px-12 sm:py-16">
      <SubmissionsEmptyIllustration />
      <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {creatorSubmissionEmptyPlaceholderTitle(tab, !showBrowseCampaigns)}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {creatorSubmissionEmptyFilterDescription(tab)}
      </p>
      {showBrowseCampaigns ? (
        <div className="mt-6">
          <Button asChild className="gap-1.5 bg-phc-gradient text-white hover:opacity-90">
            <Link to="/campaigns">
              <Compass className="h-4 w-4 shrink-0" aria-hidden />
              Browse Campaigns
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
