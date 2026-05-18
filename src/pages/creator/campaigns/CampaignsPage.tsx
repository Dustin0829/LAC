import { useMemo, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Filter, Loader2 } from 'lucide-react'
import { useCreatorCampaigns } from '@/api/queries/creator/use-campaigns'
import {
  CREATOR_CAMPAIGN_PLATFORM_OPTIONS,
  CREATOR_CAMPAIGN_SORT_OPTIONS,
  CREATOR_CAMPAIGN_STATUS_OPTIONS,
  creatorCampaignListParams,
  type CreatorCampaignSortId,
  type CreatorCampaignStatusFilter,
} from '@/lib/creators/campaigns/creatorCampaignsPage'
import {
  creatorCampaignsRefreshErrorMessage,
  creatorCampaignsRefreshSuccessMessage,
} from '@/lib/creators/campaigns/creatorUiMessages'
import { Button } from '@/components/ui/button'
import { RefreshButton } from '@/components/RefreshButton'
import { CampaignCard } from '@/components/CampaignCard'
import { CreatorCampaignsEmptyState } from '@/components/creator/CreatorCampaignsEmptyState'
import { PlatformIcon } from '@/components/PlatformIcon'
import { cn } from '@/lib/utils'
import type { Platform } from '@/api/types/shared'

const selectTriggerClass =
  'h-9 border-border bg-card text-foreground ring-offset-background hover:bg-muted/50 dark:bg-card'

function FilterControls({
  vertical,
  statusFilter,
  setStatusFilter,
  platform,
  setPlatform,
  sort,
  setSort,
}: {
  vertical?: boolean
  statusFilter: CreatorCampaignStatusFilter
  setStatusFilter: (v: CreatorCampaignStatusFilter) => void
  platform: Platform | 'all'
  setPlatform: (v: Platform | 'all') => void
  sort: CreatorCampaignSortId
  setSort: (v: CreatorCampaignSortId) => void
}) {
  return (
    <div className={cn(vertical ? 'flex flex-col gap-4' : 'flex flex-wrap items-center gap-2')}>
      <div className={cn(vertical && 'space-y-2')}>
        {vertical ? <label className="text-sm font-medium text-foreground">Status</label> : null}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as CreatorCampaignStatusFilter)}>
          <SelectTrigger className={cn(selectTriggerClass, vertical ? 'w-full' : 'w-fit shrink-0')}>
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            {CREATOR_CAMPAIGN_STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn(vertical && 'space-y-2')}>
        {vertical ? <label className="text-sm font-medium text-foreground">Platform</label> : null}
        <Select value={platform} onValueChange={(v) => setPlatform(v as Platform | 'all')}>
          <SelectTrigger className={cn(selectTriggerClass, vertical ? 'w-full' : 'w-fit shrink-0')}>
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            {CREATOR_CAMPAIGN_PLATFORM_OPTIONS.map((o) =>
              o.value === 'all' ? (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ) : (
                <SelectItem key={o.value} value={o.value}>
                  <span className="flex items-center gap-2">
                    <PlatformIcon platform={o.value} className="h-4 w-4" />
                    {o.label}
                  </span>
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className={cn(vertical && 'space-y-2')}>
        {vertical ? <label className="text-sm font-medium text-foreground">Sort</label> : null}
        <div className={cn('flex gap-2', vertical && 'flex-col')}>
          {CREATOR_CAMPAIGN_SORT_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = sort === option.id
            return (
              <Button
                key={option.id}
                type="button"
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                className={cn(
                  'gap-1.5',
                  vertical && 'w-full justify-center',
                  isActive && 'bg-phc-gradient text-white shadow-sm hover:opacity-90'
                )}
                onClick={() => setSort(option.id)}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {option.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function CreatorCampaignsPage() {
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CreatorCampaignStatusFilter>('all')
  const [sort, setSort] = useState<CreatorCampaignSortId>('newest')
  const [filterOpen, setFilterOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const listParams = useMemo(
    () => creatorCampaignListParams(statusFilter, platform, sort),
    [statusFilter, platform, sort]
  )

  const { data: campaigns = [], isLoading, isError, refetch, isFetching } =
    useCreatorCampaigns(listParams)

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
    <div className="px-2 py-4 space-y-4 md:space-y-6 md:p-8 md:pb-8">
      <div>
        <h1 className="mb-2 font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          Explore <span className="text-phc-gradient">Opportunities</span>
        </h1>
      </div>

      <div>
        <div className="flex min-w-0 gap-4 items-center sm:items-center justify-between sm:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Campaigns
            </h2>
            {!isLoading && !isError ? (
              <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-xl bg-muted px-2 py-1 text-center text-sm font-semibold tabular-nums text-muted-foreground bg-phc-gradient-soft">
                {campaigns.length}
              </span>
            ) : null}
            <RefreshButton
              variant="outline"
              size="icon"
              isRefreshing={refreshing || isFetching}
              onRefresh={runRefresh}
              successMessage={creatorCampaignsRefreshSuccessMessage()}
              genericErrorMessage={creatorCampaignsRefreshErrorMessage()}
              aria-label="Refresh campaigns"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="hidden md:flex md:items-center md:gap-2">
              <FilterControls
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                platform={platform}
                setPlatform={setPlatform}
                sort={sort}
                setSort={setSort}
              />
            </div>

            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Filter className="h-4 w-4" aria-hidden />
                  <span className="sr-only">Filters</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                <FilterControls
                  vertical
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  platform={platform}
                  setPlatform={setPlatform}
                  sort={sort}
                  setSort={setSort}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-3xl border border-border bg-card px-4 py-12 text-sm text-muted-foreground sm:p-16">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading campaigns…
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-border bg-card px-4 py-12 text-center sm:p-16">
          <p className="wrap-break-word font-display text-lg font-bold">Could not load campaigns</p>
          <p className="mt-1 text-sm text-muted-foreground wrap-break-word">
            Check your connection and try again.
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-1.5"
            loading={refreshing || isFetching}
            onClick={() => void runRefresh()}
          >
            Retry
          </Button>
        </div>
      ) : showEmpty ? (
        <CreatorCampaignsEmptyState />
      ) : (
        <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard key={c.id} campaign={c} to={`/campaigns/${c.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}
