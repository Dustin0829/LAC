import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { LayoutGrid, Clock, CircleDollarSign, XCircle, Scissors, Wallet, Eye } from 'lucide-react'
import { useContentStore } from '@/lib/stores/contentStore'
import type { ContentStatus } from '@/api/types/shared'
import { cn, formatPHP, formatViews } from '@/lib/utils'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PersonAvatar } from '@/components/PersonAvatar'
import { PlatformCell } from '@/components/PlatformIcon'
import { StatCard } from '@/components/StatCard'
import { TablePagination } from '@/components/TablePagination'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshButton } from '@/components/RefreshButton'

const TABS: { id: 'all' | ContentStatus; label: string; shortLabel: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All Submissions', shortLabel: 'All', icon: LayoutGrid },
  { id: 'pending', label: 'Pending', shortLabel: 'Pending', icon: Clock },
  { id: 'paid', label: 'Paid', shortLabel: 'Paid', icon: CircleDollarSign },
  { id: 'rejected', label: 'Rejected', shortLabel: 'Rejected', icon: XCircle },
]

const PAGE_SIZE = 10

function emptyFilterDescription(tab: (typeof TABS)[number]['id']): string {
  if (tab === 'all') return 'Submit your first content from any active campaign.'
  if (tab === 'pending') return "You don't have any submissions waiting for review."
  if (tab === 'paid') return "You don't have any paid submissions yet."
  return "You don't have any rejected submissions."
}

function emptyPlaceholderTitle(tab: (typeof TABS)[number]['id'], contentsLength: number): string {
  if (contentsLength === 0 && tab === 'all') return 'No submissions yet'
  if (tab === 'pending') return 'No pending submissions'
  if (tab === 'paid') return 'No paid submissions'
  if (tab === 'rejected') return 'No rejected submissions'
  return 'No submissions'
}

export default function SubmissionsPage() {
  const allContent = useContentStore((s) => s.contents)
  const contents = useMemo(
    () => allContent.filter((content) => content.creatorId === 'me'),
    [allContent]
  )
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all')
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [tab])

  const filtered = useMemo(() => {
    if (tab === 'all') return contents
    return contents.filter((c) => c.status === tab)
  }, [contents, tab])

  const counts = useMemo(
    () => ({
      all: contents.length,
      pending: contents.filter((c) => c.status === 'pending').length,
      paid: contents.filter((c) => c.status === 'paid').length,
      rejected: contents.filter((c) => c.status === 'rejected').length,
    }),
    [contents]
  )

  const sortedFiltered = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ),
    [filtered]
  )

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pageRows = sortedFiltered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const approvedContents = useMemo(() => contents.filter((c) => c.status === 'paid'), [contents])

  const totalEarnings = approvedContents.reduce((s, c) => s + c.earnings, 0)
  const totalViews = approvedContents.reduce((s, c) => s + c.views, 0)

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0 flex items-center gap-2 justify-between">
          <h1 className="md:mb-2 font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Your <span className="text-phc-gradient">Submissions</span>
          </h1>
          <RefreshButton
            variant="outline"
            isRefreshing={refreshing}
            size="icon"
            onRefresh={async () => {
              setRefreshing(true)
              try {
                await new Promise((r) => setTimeout(r, 500))
              } finally {
                setRefreshing(false)
              }
            }}
            successMessage="Submissions updated"
            aria-label="Refresh submissions"
            className="md:hidden"
          />
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
          <RefreshButton
            variant="outline"
            isRefreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true)
              try {
                await new Promise((r) => setTimeout(r, 500))
              } finally {
                setRefreshing(false)
              }
            }}
            successMessage="Submissions updated"
            aria-label="Refresh submissions"
            className="hidden md:block"
          />
          <Button asChild className="flex flex-1 shrink-0 bg-phc-gradient text-white sm:w-auto">
            <Link to="/campaigns">Submit new content</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Lifetime Earnings"
          value={formatPHP(totalEarnings, { decimals: false })}
          icon={Wallet}
          accent="violet"
        />
        <StatCard
          label="Total Verified Views"
          value={formatViews(totalViews)}
          icon={Eye}
          accent="pink"
        />
        <StatCard label="All Submissions" value={contents.length} icon={Scissors} accent="orange" />
      </div>

      <div
        className="flex w-full min-w-0 border-b border-border"
        role="tablist"
        aria-label="Filter submissions by status"
      >
        {TABS.map((t) => {
          const isActive = tab === t.id
          const count = counts[t.id as keyof typeof counts] ?? 0
          const Icon = t.icon
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`submissions-tab-${t.id}`}
              aria-selected={isActive}
              aria-controls="submissions-tabpanel"
              title={`${t.label} (${count})`}
              onClick={() => setTab(t.id)}
              className={cn(
                'relative flex min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-1 px-1 py-3.5 text-center text-[11px] font-semibold transition-colors sm:flex-row sm:gap-1.5 sm:px-2 sm:text-sm',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span className="min-w-0 max-w-full leading-tight">
                <span className="inline sm:hidden">
                  {t.shortLabel}{' '}
                  <span className="tabular-nums font-medium opacity-80">({count})</span>
                </span>
                <span className="hidden sm:inline">
                  {t.label}{' '}
                  <span className="tabular-nums font-medium opacity-80 sm:ml-1">({count})</span>
                </span>
              </span>
              {isActive ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
              ) : null}
            </button>
          )
        })}
      </div>

      <div id="submissions-tabpanel" role="tabpanel" aria-labelledby={`submissions-tab-${tab}`}>
        {sortedFiltered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center sm:px-8 sm:py-14">
            <div className="mb-3 flex justify-center text-muted-foreground">
              <Scissors className="h-10 w-10 shrink-0" aria-hidden />
            </div>
            <h3 className="wrap-break-word font-display text-base font-bold text-foreground sm:text-lg">
              {emptyPlaceholderTitle(tab, contents.length)}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground wrap-break-word">
              {emptyFilterDescription(tab)}
            </p>
            {contents.length === 0 ? (
              <div className="mt-8 flex justify-center">
                <Button asChild className="bg-phc-gradient text-white">
                  <Link to="/campaigns">Browse campaigns</Link>
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow className="cursor-default hover:bg-transparent">
                  <TableHead>Brand</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((content) => {
                  const postHref = content.url
                  return (
                    <TableRow
                      key={content.id}
                      onClick={() => window.open(postHref, '_blank')}
                      className="hover:bg-muted/40 cursor-pointer [&_a]:focus-visible:outline-none [&_a]:focus-visible:ring-2 [&_a]:focus-visible:ring-ring [&_a]:focus-visible:ring-offset-2"
                    >
                      <TableCell className="max-w-56" onClick={(e) => e.stopPropagation()}>
                        <div className="flex min-w-0 items-center gap-2 rounded-md font-medium text-foreground">
                          <PersonAvatar name={content.brandName} size="xs" />
                          <span className="min-w-0 leading-snug">{content.brandName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-72 truncate" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/campaigns/${content.campaignId}`}
                          className="line-clamp-2 font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        >
                          {content.campaignTitle}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <PlatformCell
                          platform={content.platform}
                          iconClassName="h-5 w-5"
                          // v1 (post-MVP): hasYellowBasket={Boolean(content.hasTikTokYellowBasket)}
                        />
                      </TableCell>
                      <TableCell className="font-display font-semibold tabular-nums">
                        {formatViews(content.views)}
                      </TableCell>
                      <TableCell className="font-display font-semibold tabular-nums text-phc-gradient">
                        {formatPHP(content.earnings, { decimals: false })}
                      </TableCell>
                      <TableCell>
                        <ContentStatusBadge status={content.status} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <TablePagination
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={sortedFiltered.length}
              onPageChange={setPage}
              itemLabel="submissions"
            />
          </TableContainer>
        )}
      </div>
    </div>
  )
}
