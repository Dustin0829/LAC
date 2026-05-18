import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'

import { BrandCampaignsEmptyIllustration } from '@/components/brand/BrandCampaignsEmptyIllustration'
import { Button } from '@/components/ui/button'
import {
  brandCampaignEmptyDescription,
  brandCampaignEmptyTitle,
} from '@/lib/brands/campaigns/brandCampaignsPage'

export function BrandCampaignsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-12 text-center sm:px-12 sm:py-16">
      <BrandCampaignsEmptyIllustration />
      <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
        {brandCampaignEmptyTitle()}
      </h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {brandCampaignEmptyDescription()}
      </p>
      <div className="mt-6">
        <Button asChild className="gap-1.5 bg-phc-gradient text-white hover:opacity-90">
          <Link to="/brand/campaigns/new">
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Create campaign
          </Link>
        </Button>
      </div>
    </div>
  )
}
