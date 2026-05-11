import { Badge } from '@/components/ui/badge'
import { Clock, XCircle, BadgeCheck } from 'lucide-react'
import type { ContentStatus } from '@/lib/mockData'

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
}

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  const cfg = STYLES[status]
  const Icon = cfg.Icon
  return (
    <Badge className={`${cfg.className} border flex items-center gap-1 w-fit`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  )
}
