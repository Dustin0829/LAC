import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  /** Pastel circle + icon stroke color per metric. */
  accent?: 'violet' | 'pink' | 'orange' | 'emerald' | 'blue'
  className?: string
}

/** Circular icon well: light fill + saturated icon (see dashboard reference). */
const ACCENT_ICON_WELL: Record<NonNullable<StatCardProps['accent']>, string> = {
  violet: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  pink: 'bg-blue-100 text-blue-700 dark:bg-blue-950/45 dark:text-blue-300',
  orange: 'bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'emerald',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn('rounded-3xl border border-border bg-card p-5 shadow-none md:p-6', className)}
    >
      <div className="flex min-w-0 items-center justify-between gap-4">
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-normal text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-2xl font-bold leading-tight tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {hint ? (
            <p className="mt-1.5 text-xs leading-snug text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              ACCENT_ICON_WELL[accent]
            )}
            aria-hidden
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
