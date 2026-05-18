import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Scissors, Wallet, Eye, Send } from 'lucide-react'
import { useCreatorDashboardStats } from '@/api/queries/creator/use-dashboard'
import { useMeSubmissions, useRefreshCreatorSubmissionsPage } from '@/api/queries/creator/use-submissions'
import {
  creatorSubmissionsRefreshErrorMessage,
  creatorSubmissionsRefreshSuccessMessage,
} from '@/lib/creators/submissions/creatorUiMessages'
import {
  CREATOR_SUBMISSION_TABS,
  creatorSubmissionListParams,
  type CreatorSubmissionTab,
} from '@/lib/creators/submissions/creatorSubmissionsPage'
import { CREATOR_SUBMISSIONS_PAGE_SIZE } from '@/lib/constants'
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
import { CreatorSubmissionsEmptyState } from '@/components/creator/CreatorSubmissionsEmptyState'
import { VidULoading } from '@/components/VidULoading'
import { Button } from '@/components/ui/button'
import { RefreshButton } from '@/components/RefreshButton'

export default function SubmissionsPage() {
  const [tab, setTab] = useState<CreatorSubmissionTab>('all')
  const [page, setPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  const listParams = useMemo(() => creatorSubmissionListParams(tab, page), [tab, page])

  const { data: dashboardStats, isLoading: statsLoading } = useCreatorDashboardStats()
  const { data: submissionsData, isLoading: listLoading, isError: listError } =
    useMeSubmissions(listParams)
  const { refresh: refreshSubmissions, isRefreshing: submissionsRefreshing } =
    useRefreshCreatorSubmissionsPage(listParams)

  useEffect(() => {
    setPage(1)
  }, [tab])

  const pageRows = submissionsData?.rows ?? []
  const totalItems = submissionsData?.meta.total_items ?? 0
  const totalPages = Math.max(1, submissionsData?.meta.total_pages ?? 1)
  const safePage = Math.min(Math.max(1, page), totalPages)

  const counts = dashboardStats?.submissionCounts ?? {
    all: 0,
    pending: 0,
    paid: 0,
    rejected: 0,
  }

  return (
    <div className="px-2 py-4 md:p-8 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0 flex items-center gap-2 justify-between">
          <h1 className="md:mb-2 font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Your <span className="text-phc-gradient">Submissions</span>
          </h1>
          <RefreshButton
            variant="outline"
            isRefreshing={refreshing || submissionsRefreshing}
            size="icon"
            onRefresh={async () => {
              setRefreshing(true)
              try {
                return await refreshSubmissions()
              } finally {
                setRefreshing(false)
              }
            }}
            successMessage={creatorSubmissionsRefreshSuccessMessage()}
            genericErrorMessage={creatorSubmissionsRefreshErrorMessage()}
            aria-label="Refresh submissions"
            className="md:hidden"
          />
        </div>
        <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 sm:w-auto">
          <RefreshButton
            variant="outline"
            isRefreshing={refreshing || submissionsRefreshing}
            onRefresh={async () => {
              setRefreshing(true)
              try {
                return await refreshSubmissions()
              } finally {
                setRefreshing(false)
              }
            }}
            successMessage={creatorSubmissionsRefreshSuccessMessage()}
            genericErrorMessage={creatorSubmissionsRefreshErrorMessage()}
            aria-label="Refresh submissions"
            className="hidden md:block"
          />
          <Button asChild className="flex flex-1 shrink-0 gap-1.5 bg-phc-gradient text-white sm:w-auto">
            <Link to="/campaigns">
              <Send className="h-4 w-4 shrink-0" aria-hidden />
              Submit New Content
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Lifetime Earnings"
          value={
            statsLoading
              ? '—'
              : formatPHP(dashboardStats?.lifetimeEarnings ?? 0, { decimals: false })
          }
          icon={Wallet}
          accent="violet"
        />
        <StatCard
          label="Total Verified Views"
          value={statsLoading ? '—' : formatViews(dashboardStats?.totalVerifiedViews ?? 0)}
          icon={Eye}
          accent="pink"
        />
        <StatCard
          label="All Submissions"
          value={statsLoading ? '—' : counts.all}
          icon={Scissors}
          accent="orange"
        />
      </div>

      <div
        className="flex w-full min-w-0 border-b border-border"
        role="tablist"
        aria-label="Filter submissions by status"
      >
        {CREATOR_SUBMISSION_TABS.map((t) => {
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
        {listLoading ? (
          <div className="py-12">
            <VidULoading label="Loading submissions…" size="md" />
          </div>
        ) : listError ? (
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center sm:px-8 sm:py-14">
            <p className="text-sm text-destructive">Could not load submissions. Try again later.</p>
          </div>
        ) : pageRows.length === 0 ? (
          <CreatorSubmissionsEmptyState tab={tab} showBrowseCampaigns={counts.all === 0} />
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
                        <PlatformCell platform={content.platform} iconClassName="h-5 w-5" />
                      </TableCell>
                      <TableCell className="font-display font-semibold tabular-nums">
                        {formatViews(content.views)}
                      </TableCell>
                      <TableCell className="font-display font-semibold tabular-nums text-phc-gradient">
                        {formatPHP(content.earnings, { decimals: false })}
                      </TableCell>
                      <TableCell>
                        <ContentStatusBadge
                          status={content.status}
                          rejectionReason={content.rejectionReason}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <TablePagination
              page={safePage}
              pageSize={CREATOR_SUBMISSIONS_PAGE_SIZE}
              totalItems={totalItems}
              onPageChange={setPage}
              itemLabel="submissions"
            />
          </TableContainer>
        )}
      </div>
    </div>
  )
}
