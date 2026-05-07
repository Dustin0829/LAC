import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { ClipStatusBadge } from '@/components/ClipStatusBadge'
import { PlatformIcon } from '@/components/PlatformIcon'
import { Button } from '@/components/ui/button'
import { useClipsStore } from '@/lib/stores/clipsStore'
import { formatPHP, formatTimeAgo, formatViews } from '@/lib/utils'

export default function BrandClipSubmissionsPage() {
  const clips = useClipsStore((s) => s.clips)
  const rows = [...clips].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  )

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Inbox</p>
        <h1 className="mt-1 font-display text-3xl md:text-4xl font-extrabold">
          Clip <span className="text-phc-gradient">submissions</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          All clips across your campaigns. Open the campaign to approve, reject, or see full
          context.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <p className="font-medium">No submissions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Creators will appear here once they post.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Creator</th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Campaign</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Submitted</th>
                <th className="px-5 py-3 font-medium">Views</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Earnings</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Campaign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((clip) => (
                <tr key={clip.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={clip.platform} className="h-9 w-9" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{clip.clipperName}</p>
                        <a
                          href={clip.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                        >
                          View clip <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <p className="font-medium line-clamp-2">{clip.campaignTitle}</p>
                    <p className="text-xs text-muted-foreground">{clip.brandName}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell text-muted-foreground">
                    {formatTimeAgo(clip.submittedAt)}
                  </td>
                  <td className="px-5 py-4 font-display font-bold">{formatViews(clip.views)}</td>
                  <td className="px-5 py-4 hidden lg:table-cell font-display font-bold text-phc-gradient">
                    {formatPHP(clip.earnings, { decimals: false })}
                  </td>
                  <td className="px-5 py-4">
                    <ClipStatusBadge status={clip.status} />
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to={`/brand/campaigns/${clip.campaignId}`}
                        className="inline-flex items-center gap-1"
                      >
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
