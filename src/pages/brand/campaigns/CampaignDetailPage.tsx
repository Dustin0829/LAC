import { Link } from 'react-router-dom'
import { ArrowLeft, CircleDollarSign, Shield, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCampaignDetail } from './useCampaignDetail'
import { CampaignDetailHeader } from './CampaignDetailHeader'
import { DetailsTab } from './DetailsTab'
import { BudgetTab } from './BudgetTab'
import { SubmissionsTab } from './SubmissionsTab'

export default function BrandCampaignDetailPage() {
  const {
    campaignTab,
    setCampaignTab,
    apiCampaignLoading,
    apiCampaignError,
    refetchApiCampaign,
    campaign,
    campaignSubmissions,
    tabs,
    header,
  } = useCampaignDetail()

  if (apiCampaignLoading && !campaign) {
    return (
      <div className="rounded-3xl border border-border bg-card p-16 text-center text-sm text-muted-foreground">
        Loading campaign…
      </div>
    )
  }

  if (apiCampaignError || !campaign || !tabs || !header) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-lg font-bold">
          {apiCampaignError ? 'Could not load campaign' : 'Campaign not found'}
        </p>
        {apiCampaignError ? (
          <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {apiCampaignError ? (
            <Button variant="outline" onClick={() => void refetchApiCampaign()}>
              Retry
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link to="/brand/campaigns">
              <ArrowLeft className="h-4 w-4" /> Back to campaigns
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/brand/campaigns"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> All campaigns
        </Link>
      </div>

      <CampaignDetailHeader {...header} />

      <div className="min-w-0 border-b border-border" role="tablist" aria-label="Campaign sections">
        <div className="grid w-full grid-cols-3">
          <button
            type="button"
            role="tab"
            id="campaign-tab-details"
            aria-selected={campaignTab === 'details'}
            onClick={() => setCampaignTab('details')}
            className={cn(
              'relative flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 px-2 py-3.5 text-center font-medium transition-colors text-sm',
              campaignTab === 'details'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Shield className="h-4.5 w-4.5 shrink-0" />
            <span className="leading-snug">Details</span>
            {campaignTab === 'details' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-submissions-payout"
            aria-selected={campaignTab === 'submissions-payout'}
            onClick={() => setCampaignTab('submissions-payout')}
            className={cn(
              'relative flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 px-2 py-3.5 text-center font-medium transition-colors text-sm',
              campaignTab === 'submissions-payout'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CircleDollarSign className="h-4.5 w-4.5 shrink-0" />
            <span className="leading-snug">
              Submissions
              <span className="ml-1 tabular-nums font-medium opacity-80">
                ({campaignSubmissions.length})
              </span>
            </span>
            {campaignTab === 'submissions-payout' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
          <button
            type="button"
            role="tab"
            id="campaign-tab-budget"
            aria-selected={campaignTab === 'budget'}
            onClick={() => setCampaignTab('budget')}
            className={cn(
              'relative flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 px-2 py-3.5 text-center font-medium transition-colors text-sm',
              campaignTab === 'budget'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Wallet className="h-4 w-4 shrink-0" />
            <span className="leading-snug">Budget</span>
            {campaignTab === 'budget' ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        </div>
      </div>

      {campaignTab === 'details' ? <DetailsTab {...tabs.details} /> : null}
      {campaignTab === 'budget' ? <BudgetTab {...tabs.budget} /> : null}
      {campaignTab === 'submissions-payout' ? <SubmissionsTab {...tabs.submissions} /> : null}
    </div>
  )
}
