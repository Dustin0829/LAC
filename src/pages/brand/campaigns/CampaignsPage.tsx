import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { Button } from '@/components/ui/button'
import { CampaignCard } from '@/components/CampaignCard'

export default function BrandCampaignsPage() {
  const campaigns = useCampaignsStore((s) => s.campaigns)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Campaigns
          </p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
            Your <span className="text-phc-gradient">campaigns</span>
          </h1>
        </div>
        <Button asChild className="bg-phc-gradient text-white">
          <Link to="/brand/campaigns/new">
            <Plus className="h-4 w-4" /> New campaign
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
          <p className="font-display text-lg font-bold">No campaigns yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first one to get clippers cutting.</p>
          <Button asChild className="mt-4 bg-phc-gradient text-white">
            <Link to="/brand/campaigns/new">Create campaign</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} to={`/brand/campaigns/${c.id}`} showProgress />
          ))}
        </div>
      )}
    </div>
  )
}
