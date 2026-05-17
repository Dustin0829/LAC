import { Check } from 'lucide-react'
import type { ReactNode } from 'react'

import type { UserRole } from '@/lib/stores/authStore'
import { cn } from '@/lib/utils'

export type RoleSelectionCardProps = {
  role: UserRole
  title: string
  description: string
  bullets: readonly string[]
  illustration: ReactNode
  selected: boolean
  onSelect: () => void
}

const roleStyles = {
  creator: {
    cardSelected: 'border-sky-400 bg-sky-50/70 ring-1 ring-sky-200/80',
    cardIdle: 'border-slate-200/90 bg-sky-50/35 hover:border-sky-200',
    titleSelected: 'text-sky-600',
    titleIdle: 'text-sky-600',
    checkSelected: 'border-sky-500 bg-sky-500 text-white',
    checkIdle: 'border-slate-300 bg-white',
    bulletIcon: 'text-sky-500',
  },
  brand: {
    cardSelected: 'border-violet-400 bg-violet-50/70 ring-1 ring-violet-200/80',
    cardIdle: 'border-slate-200/90 bg-violet-50/40 hover:border-violet-200',
    titleSelected: 'text-violet-600',
    titleIdle: 'text-violet-600',
    checkSelected: 'border-violet-500 bg-violet-500 text-white',
    checkIdle: 'border-slate-300 bg-white',
    bulletIcon: 'text-violet-500',
  },
} as const

export function RoleSelectionCard({
  role,
  title,
  description,
  bullets,
  illustration,
  selected,
  onSelect,
}: RoleSelectionCardProps) {
  const styles = roleStyles[role]

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group relative w-full cursor-pointer overflow-hidden rounded-2xl border-2 text-left transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 focus-visible:ring-offset-2',
        selected ? styles.cardSelected : styles.cardIdle
      )}
    >
      <span
        className={cn(
          'absolute right-4 top-4 z-10 flex size-6 items-center justify-center rounded-full border-2 transition-colors',
          selected ? styles.checkSelected : styles.checkIdle
        )}
        aria-hidden
      >
        {selected ? <Check className="size-3.5 stroke-3" /> : null}
      </span>

      <div className="flex min-h-[280px] flex-col sm:min-h-[300px] sm:flex-row">
        <div className="flex flex-[1.15] items-center justify-center overflow-visible px-2 pb-2 pt-8 sm:px-3 sm:py-4 md:flex-[1.25]">
          {illustration}
        </div>
        <div className="flex flex-1 flex-col justify-center px-5 pb-6 pt-2 sm:px-5 sm:py-6 sm:pr-7">
          <h2
            className={cn(
              'font-display text-2xl font-bold tracking-tight',
              selected ? styles.titleSelected : styles.titleIdle
            )}
          >
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
          <ul className="mt-4 space-y-2.5">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-slate-700">
                <span
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-current/10',
                    styles.bulletIcon
                  )}
                >
                  <Check className="size-2.5 stroke-3" aria-hidden />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </button>
  )
}
