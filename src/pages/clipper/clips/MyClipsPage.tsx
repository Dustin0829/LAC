import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, ExternalLink, Scissors } from 'lucide-react'
import { useClipsStore } from '@/lib/stores/clipsStore'
import { ClipStatusBadge } from '@/components/ClipStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { formatPHP, formatViews, formatTimeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { ClipStatus } from '@/lib/mockData'

const TABS: { id: 'all' | ClipStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'paid', label: 'Paid' },
  { id: 'rejected', label: 'Rejected' },
]

export default function MyClipsPage() {
  const clips = useClipsStore((s) => s.clips)
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all')

  const filtered = useMemo(() => {
    if (tab === 'all') return clips
    return clips.filter((c) => c.status === tab)
  }, [clips, tab])

  const counts = useMemo(() => {
    return {
      all: clips.length,
      pending: clips.filter((c) => c.status === 'pending').length,
      approved: clips.filter((c) => c.status === 'approved').length,
      paid: clips.filter((c) => c.status === 'paid').length,
      rejected: clips.filter((c) => c.status === 'rejected').length,
    }
  }, [clips])

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">My Clips</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
            Track every <span className="text-phc-gradient">view</span>
          </h1>
        </div>
        <Button asChild className="bg-phc-gradient text-white">
          <Link to="/clipper/campaigns">Submit a new clip</Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl bg-muted p-1.5">
        {TABS.map((t) => {
          const isActive = tab === t.id
          const count = counts[t.id as keyof typeof counts] ?? 0
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
              <span
                className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  isActive ? 'bg-phc-gradient text-white' : 'bg-foreground/10'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
          <Scissors className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-display text-lg font-bold">No clips here</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === 'all'
              ? 'Submit your first clip from any active campaign.'
              : `You don't have any ${tab} clips.`}
          </p>
          <Button asChild className="mt-4 bg-phc-gradient text-white">
            <Link to="/clipper/campaigns">Browse campaigns</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((clip) => (
            <article
              key={clip.id}
              className="flex flex-col md:flex-row md:items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
            >
              <div
                className={`relative h-16 w-16 md:h-20 md:w-20 shrink-0 overflow-hidden rounded-xl bg-linear-to-br ${clip.thumbnailColor}`}
              >
                <PlatformIcon
                  platform={clip.platform}
                  className="absolute bottom-1 right-1 h-6 w-6 ring-2 ring-card"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {clip.brandName}
                </p>
                <p className="font-semibold line-clamp-1">{clip.campaignTitle}</p>
                <a
                  href={clip.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {clip.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-6 md:flex md:items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Views</p>
                  <p className="font-display font-bold flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatViews(clip.views)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Earned</p>
                  <p className="font-display font-bold text-phc-gradient">
                    {formatPHP(clip.earnings, { decimals: false })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</p>
                  <ClipStatusBadge status={clip.status} />
                </div>
              </div>
              <div className="text-right md:w-32">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Submitted
                </p>
                <p className="text-sm">{formatTimeAgo(clip.submittedAt)}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
