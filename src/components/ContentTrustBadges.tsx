import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, ShieldX, ShoppingBag } from 'lucide-react'
import type { LivenessStatus, RuleCheckResult } from '@/lib/mockData'

interface RuleCheckBadgeProps {
  result: RuleCheckResult
}

const RULE_CHECK_STYLES: Record<
  RuleCheckResult,
  { className: string; label: string; Icon: typeof ShieldCheck }
> = {
  pass: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
    label: 'Rule check · pass',
    Icon: ShieldCheck,
  },
  soft_flag: {
    className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    label: 'Rule check · soft flag',
    Icon: ShieldAlert,
  },
  hard_block: {
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
    label: 'Rule check · hard block',
    Icon: ShieldX,
  },
}

export function RuleCheckBadge({ result }: RuleCheckBadgeProps) {
  const cfg = RULE_CHECK_STYLES[result]
  const Icon = cfg.Icon
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.className}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

const LIVENESS_STYLES: Record<
  LivenessStatus,
  { className: string; label: string; Icon: typeof CheckCircle2 }
> = {
  live: {
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
    label: 'Live',
    Icon: CheckCircle2,
  },
  failing: {
    className: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    label: 'Liveness failing',
    Icon: AlertTriangle,
  },
  voided: {
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
    label: 'Voided',
    Icon: ShieldX,
  },
}

export function LivenessBadge({ status }: { status: LivenessStatus }) {
  const cfg = LIVENESS_STYLES[status]
  const Icon = cfg.Icon
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.className}`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

export function YellowBasketBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-300 bg-yellow-50 px-2 py-0.5 text-[11px] font-semibold text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200">
      <ShoppingBag className="h-3 w-3" />
      Yellow basket · 50/50
    </span>
  )
}
