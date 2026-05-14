import { useMemo, useState, type ComponentType } from 'react'
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
import { Filter, Clock, CircleDollarSign } from 'lucide-react'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { Button } from '@/components/ui/button'
import { RefreshButton } from '@/components/RefreshButton'
import { CampaignCard } from '@/components/CampaignCard'
import { PlatformIcon } from '@/components/PlatformIcon'
import { cn } from '@/lib/utils'
import {
  PLATFORM_LABEL,
  creatorHeadlineRatePer1k,
  type CampaignStatus,
  type Platform,
} from '@/lib/mockData'

type StatusFilter = 'all' | CampaignStatus
type SortId = 'newest' | 'rate'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All Campaigns' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'ended', label: 'Ended' },
]

const PLATFORM_OPTIONS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: 'All platforms' },
  { value: 'tiktok', label: PLATFORM_LABEL.tiktok },
  { value: 'facebook', label: PLATFORM_LABEL.facebook },
]

const SORT_OPTIONS: {
  id: SortId
  label: string
  icon: ComponentType<{ className?: string }>
}[] = [
  { id: 'newest', label: 'Newest', icon: Clock },
  { id: 'rate', label: 'Highest rate', icon: CircleDollarSign },
]

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
  statusFilter: StatusFilter
  setStatusFilter: (v: StatusFilter) => void
  platform: Platform | 'all'
  setPlatform: (v: Platform | 'all') => void
  sort: SortId
  setSort: (v: SortId) => void
}) {
  return (
    <div className={cn(vertical ? 'flex flex-col gap-4' : 'flex flex-wrap items-center gap-2')}>
      <div className={cn(vertical && 'space-y-2')}>
        {vertical ? <label className="text-sm font-medium text-foreground">Status</label> : null}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className={cn(selectTriggerClass, vertical ? 'w-full' : 'w-fit shrink-0')}>
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
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
            {PLATFORM_OPTIONS.map((o) =>
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
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = sort === option.id
            return (
              <Button
                key={option.id}
                type="button"
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                className={cn(
                  vertical && 'w-full justify-center',
                  isActive && 'bg-phc-gradient text-white shadow-sm hover:opacity-90'
                )}
                onClick={() => setSort(option.id)}
              >
                <Icon className="h-4 w-4 shrink-0" />
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
  const campaigns = useCampaignsStore((s) => s.campaigns)
  const [query] = useState('')
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortId>('newest')
  const [filterOpen, setFilterOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const filtered = useMemo(() => {
    let list = campaigns.filter((c) => {
      if (c.status === 'draft') return false
      if (statusFilter === 'all') return true
      return c.status === statusFilter
    })
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.brandName.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
    }
    if (platform !== 'all') {
      list = list.filter((c) => c.platforms.includes(platform))
    }
    list = [...list].sort((a, b) => {
      if (sort === 'rate') return creatorHeadlineRatePer1k(b) - creatorHeadlineRatePer1k(a)
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    })
    return list
  }, [campaigns, query, platform, sort, statusFilter])

  return (
    <div className="px-2 py-4 space-y-4 md:space-y-6  md:p-8 md:pb-8">
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
            <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-xl bg-muted px-2 py-1 text-center text-sm font-semibold tabular-nums text-muted-foreground bg-phc-gradient-soft">
              {filtered.length}
            </span>
            <RefreshButton
              variant="outline"
              size="icon"
              isRefreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true)
                try {
                  await new Promise((r) => setTimeout(r, 500))
                } finally {
                  setRefreshing(false)
                }
              }}
              successMessage="Campaigns updated"
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
                  <Filter className="h-4 w-4" />
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

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-4 py-12 text-center sm:p-16">
          <p className="wrap-break-word font-display text-lg font-bold">
            No campaigns match those filters
          </p>
          <p className="mt-1 text-sm text-muted-foreground wrap-break-word">
            Try adjusting filters or search.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} to={`/campaigns/${c.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}
