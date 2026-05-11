import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import {
  CircleAlert,
  Eye,
  ExternalLink,
  Scissors,
  LayoutGrid,
  Clock,
  CircleDollarSign,
  XCircle,
} from 'lucide-react'
import { useContentStore } from '@/lib/stores/contentStore'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { cn, formatPHP, formatViews, formatTimeAgo } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ContentStatus } from '@/lib/mockData'

type AttentionDialog = {
  title: string
  body: string
}

const TABS: { id: 'all' | ContentStatus; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'pending', label: 'Pending', icon: Clock },
  { id: 'paid', label: 'Paid', icon: CircleDollarSign },
  { id: 'rejected', label: 'Rejected', icon: XCircle },
]

export default function MyContentPage() {
  const allContent = useContentStore((s) => s.contents)
  const contents = useMemo(
    () => allContent.filter((content) => content.creatorId === 'me'),
    [allContent]
  )
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all')
  const [attention, setAttention] = useState<AttentionDialog | null>(null)

  const filtered = useMemo(() => {
    if (tab === 'all') return contents
    return contents.filter((c) => c.status === tab)
  }, [contents, tab])

  const counts = useMemo(() => {
    return {
      all: contents.length,
      pending: contents.filter((c) => c.status === 'pending').length,
      paid: contents.filter((c) => c.status === 'paid').length,
      rejected: contents.filter((c) => c.status === 'rejected').length,
    }
  }, [contents])

  function openAttention(content: (typeof contents)[number]) {
    const body = [content.rejectionReason, content.trustFlag].filter(Boolean).join('\n\n')
    if (!body.trim()) return
    const title =
      content.status === 'rejected' ? 'Rejection reason' : 'Needs your attention'
    setAttention({ title, body })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">My Content</p>
          <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
            Track every <span className="text-phc-gradient">view</span>
          </h1>
        </div>
        <Button asChild className="bg-phc-gradient text-white">
          <Link to="/creator/campaigns">Submit new content</Link>
        </Button>
      </div>

      {/* Tabs — scroll on narrow viewports so labels stay full (no ellipsis) */}
      <div className="min-w-0 border-b border-border" role="tablist" aria-label="Filter content by status">
        <div className="-mx-1 flex gap-0.5 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:justify-center sm:gap-1 sm:overflow-x-visible sm:px-0">
          {TABS.map((t) => {
            const isActive = tab === t.id
            const count = counts[t.id as keyof typeof counts] ?? 0
            const Icon = t.icon
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`content-tab-${t.id}`}
                aria-selected={isActive}
                aria-controls="content-tabpanel"
                onClick={() => setTab(t.id)}
                className={cn(
                  'relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap px-3 py-3.5 text-xs font-semibold transition-colors sm:gap-2 sm:px-4 sm:text-sm',
                  isActive ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span>
                  {t.label}
                  <span className="ml-1 tabular-nums text-xs font-medium opacity-80">({count})</span>
                </span>
                {isActive ? (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-600 sm:left-4 sm:right-4" />
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div id="content-tabpanel" role="tabpanel" aria-labelledby={`content-tab-${tab}`}>
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
            <Scissors className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-lg font-bold">No content here</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === 'all'
                ? 'Submit your first content from any active campaign.'
                : `You don't have any ${tab} content.`}
            </p>
            <Button asChild className="mt-4 bg-phc-gradient text-white">
              <Link to="/creator/campaigns">Browse campaigns</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[56rem] table-fixed border-collapse text-left text-sm">
              <colgroup>
                <col />
                <col className="w-[4.5rem] sm:w-24" />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-[7.5rem] sm:w-32" />
                <col className="w-28" />
                <col className="w-14 sm:w-16" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-3 py-3.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:px-4">
                    Campaign
                  </th>
                  <th className="px-2 py-3.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Platform
                  </th>
                  <th className="px-2 py-3.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Views
                  </th>
                  <th className="px-2 py-3.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Earned
                  </th>
                  <th className="px-2 py-3.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="px-2 py-3.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Submitted
                  </th>
                  <th className="w-14 py-3.5 pl-1 pr-3 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:w-16">
                    Warning
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((content) => {
                  const hasAttention = Boolean(content.trustFlag || content.rejectionReason)
                  return (
                    <tr
                      key={content.id}
                      className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="max-w-0 align-middle px-3 py-4 md:px-4">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {content.brandName}
                          </p>
                          <p className="truncate font-medium leading-snug" title={content.campaignTitle}>
                            {content.campaignTitle}
                          </p>
                          <a
                            href={content.url}
                            target="_blank"
                            rel="noreferrer"
                            title={content.url}
                            className="mt-0.5 flex min-w-0 items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                          >
                            <span className="truncate">{content.url}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                          </a>
                        </div>
                      </td>
                      <td className="align-middle px-2 py-4">
                        <div className="flex justify-start sm:justify-center">
                          <PlatformIcon platform={content.platform} className="h-7 w-7" />
                        </div>
                      </td>
                      <td className="align-middle px-2 py-4">
                        <p className="flex items-center gap-0.5 font-display text-sm font-bold tabular-nums leading-none">
                          <Eye className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                          {formatViews(content.views)}
                        </p>
                        <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                          Locked at submit
                        </p>
                      </td>
                      <td className="align-middle px-2 py-4">
                        <span className="font-display text-sm font-bold tabular-nums text-phc-gradient">
                          {formatPHP(content.earnings, { decimals: false })}
                        </span>
                      </td>
                      <td className="align-middle px-2 py-4">
                        <div className="origin-left scale-[0.92]">
                          <ContentStatusBadge status={content.status} />
                        </div>
                      </td>
                      <td className="align-middle px-2 py-4 text-xs tabular-nums text-muted-foreground">
                        {formatTimeAgo(content.submittedAt)}
                      </td>
                      <td className="align-middle py-4 pl-1 pr-3 text-center">
                        {hasAttention ? (
                          <button
                            type="button"
                            onClick={() => openAttention(content)}
                            className="inline-flex rounded-full p-1 text-amber-600 transition-colors hover:bg-amber-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            aria-label={
                              content.status === 'rejected'
                                ? 'View rejection reason'
                                : 'View attention note'
                            }
                          >
                            <CircleAlert className="h-4 w-4" strokeWidth={2} />
                          </button>
                        ) : (
                          <span className="inline-block w-6" aria-hidden />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={attention !== null}
        onOpenChange={(open) => {
          if (!open) setAttention(null)
        }}
      >
        <DialogContent className="rounded-3xl border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {attention?.title ?? ''}
            </DialogTitle>
            <DialogDescription className="whitespace-pre-wrap text-left text-base text-foreground">
              {attention?.body ?? ''}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
