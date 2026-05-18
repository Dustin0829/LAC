import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatRejectionReasonDisplay } from '@/lib/submissions/rejectionReason'
import { formatBadgeLabel } from '@/lib/utils'
import { Clock, XCircle, BadgeCheck, Loader2, AlertTriangle } from 'lucide-react'
import type { ContentStatus } from '@/api/types/shared'

const STYLES: Record<ContentStatus, { className: string; label: string; Icon: typeof Clock }> = {
  pending: {
    className: 'bg-amber-50 text-amber-700 border-amber-200',
    label: 'Pending',
    Icon: Clock,
  },
  rejected: {
    className: 'bg-red-50 text-red-700 border-red-200',
    label: 'Rejected',
    Icon: XCircle,
  },
  paid: {
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Paid',
    Icon: BadgeCheck,
  },
  paying: {
    className: 'bg-sky-50 text-sky-800 border-sky-200',
    label: 'Paying',
    Icon: Loader2,
  },
  payout_failed: {
    className: 'bg-orange-50 text-orange-800 border-orange-200',
    label: 'Payout failed',
    Icon: AlertTriangle,
  },
}

export function ContentStatusBadge({
  status,
  rejectionReason,
}: {
  status: ContentStatus
  /** Shown on hover when status is rejected (or payout failed with a reason). */
  rejectionReason?: string | null
}) {
  const cfg = STYLES[status]
  const Icon = cfg.Icon
  const reasonLabel = formatRejectionReasonDisplay(rejectionReason)
  const showRejectionTooltip =
    Boolean(reasonLabel) && (status === 'rejected' || status === 'payout_failed')

  const badge = (
    <Badge className={`${cfg.className} border flex items-center gap-1 w-fit`}>
      <Icon className="h-3 w-3" />
      {formatBadgeLabel(cfg.label)}
    </Badge>
  )

  if (!showRejectionTooltip) return badge

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex w-fit cursor-help">{badge}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="text-sm leading-relaxed">{reasonLabel}</p>
      </TooltipContent>
    </Tooltip>
  )
}
