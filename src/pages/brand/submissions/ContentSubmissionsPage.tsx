import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { ContentStatusBadge } from '@/components/ContentStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { useContentStore } from '@/lib/stores/contentStore'
import { formatPHP, formatTimeAgo, formatViews } from '@/lib/utils'

const INBOX_PAGE_SIZE = 10

export default function BrandContentSubmissionsPage() {
  const contents = useContentStore((s) => s.contents)
  const rows = [...contents].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(rows.length / INBOX_PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pageRows = rows.slice((safePage - 1) * INBOX_PAGE_SIZE, safePage * INBOX_PAGE_SIZE)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Inbox</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
          Content <span className="text-phc-gradient">submissions</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          All content across your campaigns. Submissions count by default — open a campaign to
          reject and exclude from pay or review the monthly payout breakdown.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-medium">No submissions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Creators will appear here once they post.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Campaign</th>
                <th className="px-5 py-3 font-medium">Platform</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Submitted</th>
                <th className="px-5 py-3 font-medium">Views</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Earnings</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Open</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((content) => (
                <tr
                  key={content.id}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                  tabIndex={0}
                  aria-label={`Open content by ${content.creatorName}`}
                  onClick={() => window.open(content.url, '_blank', 'noopener,noreferrer')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      window.open(content.url, '_blank', 'noopener,noreferrer')
                    }
                  }}
                >
                  <td className="px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{content.creatorName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <p className="font-medium line-clamp-2">{content.campaignTitle}</p>
                    <p className="text-xs text-muted-foreground">{content.brandName}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-start">
                      <PlatformIcon platform={content.platform} className="h-7 w-7" />
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-muted-foreground">
                    {formatTimeAgo(content.submittedAt)}
                  </td>
                  <td className="px-5 py-4 font-display font-bold">{formatViews(content.views)}</td>
                  <td className="px-5 py-4 hidden lg:table-cell font-display font-bold text-phc-gradient">
                    {formatPHP(content.earnings, { decimals: false })}
                  </td>
                  <td className="px-5 py-4">
                    <ContentStatusBadge status={content.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to={`/brand/campaigns/${content.campaignId}`}
                        className="inline-flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 0 ? (
            <TablePagination
              className="border-border border-t bg-muted/30 px-4 py-3 md:px-5"
              page={page}
              pageSize={INBOX_PAGE_SIZE}
              totalItems={rows.length}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      )}
    </div>
  )
}
