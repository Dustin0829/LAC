import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { Button } from '@/components/ui/button'
import { CampaignCard } from '@/components/CampaignCard'
import { RefreshButton } from '@/components/RefreshButton'

export default function BrandCampaignsPage() {
  const { user, accessToken } = useAuth()
  const campaigns = useCampaignsStore((s) => s.campaigns)
  const loadForBrand = useCampaignsStore((s) => s.loadForBrand)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!user?.id || !accessToken) return
    void loadForBrand(accessToken, user)
  }, [user, accessToken, loadForBrand])

  const runRefresh = async () => {
    setRefreshing(true)
    try {
      if (user?.id && accessToken) {
        await loadForBrand(accessToken, user)
      } else {
        await new Promise((r) => setTimeout(r, 300))
      }
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="px-2 py-4 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0 flex items-center gap-2 justify-between">
          <h1 className="font-display text-3xl md:text-4xl font-extrabold">
            Your <span className="text-phc-gradient">Campaigns</span>
          </h1>
          <RefreshButton
            variant="outline"
            isRefreshing={refreshing}
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
            isRefreshing={refreshing}
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

      {campaigns.length === 0 ? (
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
