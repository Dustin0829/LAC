import { VidULogo } from '@/components/VidULogo'
import { cn } from '@/lib/utils'

const logoSizeClass = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
} as const

export type VidULoadingSize = keyof typeof logoSizeClass

type VidULoadingProps = {
  /** Optional status text below the mark. */
  label?: string
  size?: VidULoadingSize
  /** Center in the full viewport (session bootstrap, etc.). */
  fullScreen?: boolean
  className?: string
}

export function VidULoading({
  label,
  size = 'md',
  fullScreen = false,
  className,
}: VidULoadingProps) {
  const content = (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn('flex flex-col items-center justify-center gap-3', className)}
    >
      <VidULogo variant="mark" className={cn('animate-vidu-load', logoSizeClass[size])} />
      {label ? <p className="text-sm text-muted-foreground">{label}</p> : null}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-background">
        {content}
      </div>
    )
  }

  return content
}
