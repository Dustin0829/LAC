import { useMemo, useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { useCampaignsStore } from '@/lib/stores/campaignsStore'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CampaignCard } from '@/components/CampaignCard'
import { PLATFORM_LABEL, creatorHeadlineRatePer1k, type Platform } from '@/lib/mockData'

const SORTS = [
  { id: 'rate', label: 'Highest rate' },
  { id: 'budget', label: 'Biggest budget' },
  { id: 'newest', label: 'Newest' },
] as const

type SortId = (typeof SORTS)[number]['id']

export default function CreatorCampaignsPage() {
  const campaigns = useCampaignsStore((s) => s.campaigns)
  const [query, setQuery] = useState('')
  const [platform, setPlatform] = useState<Platform | 'all'>('all')
  const [sort, setSort] = useState<SortId>('rate')

  const filtered = useMemo(() => {
    let list = campaigns.filter((c) => c.status === 'active')
    if (query.trim()) {
      const q = query.toLowerCase()
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
      if (sort === 'budget') return b.budget - b.spent - (a.budget - a.spent)
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    })
    return list
  }, [campaigns, query, platform, sort])

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Campaigns
        </p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold tracking-tight">
          Find your next <span className="text-phc-gradient">payday</span>
        </h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns or brands…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-11 bg-card"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex rounded-full border border-border bg-card p-1">
            {(['all', 'tiktok', 'facebook'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                  platform === p
                    ? 'bg-phc-gradient text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'all' ? 'All platforms' : PLATFORM_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="shrink-0 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> active campaigns
        </p>
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          {SORTS.map((s) => (
            <Button
              key={s.id}
              variant={sort === s.id ? 'default' : 'ghost'}
              size="sm"
              className={
                sort === s.id
                  ? 'shrink-0 bg-phc-gradient text-white hover:opacity-90'
                  : 'shrink-0 text-muted-foreground'
              }
              onClick={() => setSort(s.id)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
          <p className="font-display text-lg font-bold">No campaigns match those filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try clearing your filters or search.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} to={`/creator/campaigns/${c.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}
