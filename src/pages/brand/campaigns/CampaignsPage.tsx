import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useBrandCampaigns } from '@/api/queries/brands/use-campaigns'
import { useFundingReturn } from '@/api/queries/brands/use-funding-return'
import { Button } from '@/components/ui/button'
import { CampaignCard } from '@/components/CampaignCard'
import { RefreshButton } from '@/components/RefreshButton'

export default function BrandCampaignsPage() {
  const { data: campaigns = [], isLoading, isError, refetch, isFetching } = useBrandCampaigns()
  const [refreshing, setRefreshing] = useState(false)

  useFundingReturn({ onRefresh: () => void refetch() })

  const runRefresh = async () => {
    setRefreshing(true)
    try {
      await refetch()
    } finally {
      setRefreshing(false)
    }
  }

  const showEmpty = !isLoading && !isError && campaigns.length === 0

  return (
    <div className="px-2 py-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0 flex items-center gap-2 justify-between">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold">
            Your <span className="text-phc-gradient">Campaigns</span>
          </h1>
          <RefreshButton
            variant="outline"
            isRefreshing={refreshing || isFetching}
            size="icon"
            onRefresh={runRefresh}
            successMessage="Campaigns updated"
            aria-label="Refresh campaigns"
            className="md:hidden"
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <RefreshButton
            variant="outline"
            isRefreshing={refreshing || isFetching}
            onRefresh={runRefresh}
            successMessage="Campaigns updated"
            aria-label="Refresh campaigns"
            className="hidden md:block"
          />
          <Button asChild className="flex flex-1 shrink-0 bg-phc-gradient text-white sm:w-auto">
            <Link to="/brand/campaigns/new">
              <Plus className="h-4 w-4" /> New campaign
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center text-sm text-muted-foreground">
          Loading campaigns…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card p-16 text-center">
          <p className="font-display text-lg font-bold">Could not load campaigns</p>
          <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
          <Button
            variant="outline"
            className="mt-4"
            loading={refreshing || isFetching}
            onClick={() => void runRefresh()}
          >
            Retry
          </Button>
        </div>
      ) : showEmpty ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
          <p className="font-display text-lg font-bold">No campaigns yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first campaign to start receiving creator content.
          </p>
          <Button asChild className="mt-4 bg-phc-gradient text-white">
            <Link to="/brand/campaigns/new">Create campaign</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} to={`/brand/campaigns/${c.id}`} showProgress />
          ))}
        </div>
      )}
    </div>
  )
}
