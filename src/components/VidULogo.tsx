import { cn } from '@/lib/utils'

/** Symbol mark only (`VID-U LOGO-07.png`). */
export const VIDU_LOGO_MARK_SRC = '/Vidu-logo/VID-U%20LOGO-07.png'

/** Icon + wordmark lockup (`VID-U LOGO-04.png`). */
export const VIDU_LOGO_LOCKUP_SRC = '/Vidu-logo/VID-U%20LOGO-04.png'

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
