import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  /** Accent key kept for compatibility; rendered in a restrained premium palette. */
  accent?: 'violet' | 'pink' | 'orange' | 'emerald' | 'blue'
  className?: string
}

const ACCENT_BG: Record<NonNullable<StatCardProps['accent']>, string> = {
  violet: 'bg-blue-500/10 text-blue-600',
  pink: 'bg-blue-500/10 text-blue-600',
  orange: 'bg-blue-500/10 text-blue-600',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  blue: 'bg-blue-500/10 text-blue-600',
}

export function StatCard({ label, value, hint, icon: Icon, accent = 'violet', className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 transition-colors hover:border-foreground/20',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', ACCENT_BG[accent])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className="mt-2 font-display text-2xl md:text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
