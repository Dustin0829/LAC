import { cn } from '@/lib/utils'

/** Symbol mark only (`public/vidu-logo/mark.png`). */
export const VIDU_LOGO_MARK_SRC = '/vidu-logo/mark.png'

/** Icon + wordmark lockup (`public/vidu-logo/lockup.png`). */
export const VIDU_LOGO_LOCKUP_SRC = '/vidu-logo/lockup.png'

type VidULogoProps = {
  className?: string
  /** `mark` = symbol only; `lockup` = symbol + Vid-U text (onboarding header). */
  variant?: 'mark' | 'lockup'
}

export function VidULogo({ className, variant = 'lockup' }: VidULogoProps) {
  const src = variant === 'mark' ? VIDU_LOGO_MARK_SRC : VIDU_LOGO_LOCKUP_SRC

  return (
    <img
      src={src}
      alt="VidU"
      width={variant === 'mark' ? 120 : 140}
      height={variant === 'mark' ? 120 : 56}
      decoding="async"
      className={cn('block h-auto w-auto max-w-full object-contain', className)}
    />
  )
}
