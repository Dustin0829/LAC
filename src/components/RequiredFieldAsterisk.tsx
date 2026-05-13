import { cn } from '@/lib/utils'

/** Red asterisk after a required field label (screen readers: rely on label + validation). */
export function RequiredFieldAsterisk({ className }: { className?: string }) {
  return (
    <span
      className={cn('text-red-600 dark:text-red-400 ml-0.5 font-semibold text-lg', className)}
      aria-hidden
    >
      *
    </span>
  )
}
