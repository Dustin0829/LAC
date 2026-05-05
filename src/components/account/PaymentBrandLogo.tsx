import { Building2, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { paymentLogoSrc } from '@/lib/constants/paymentLogos'
import type { PaymentMethod } from '@/lib/mockData'

export function PaymentBrandLogo({
  type,
  bank,
  className,
  imgClassName,
}: {
  type: PaymentMethod['type']
  bank?: string | null
  className?: string
  imgClassName?: string
}) {
  const src = paymentLogoSrc({ type, bank })
  const Icon = type === 'bank' ? Building2 : Smartphone
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl border border-border bg-white p-1 dark:bg-white',
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className={cn('max-h-full max-w-full object-contain', imgClassName)}
        />
      ) : (
        <Icon className={cn('text-muted-foreground', imgClassName ?? 'h-5 w-5')} />
      )}
    </div>
  )
}
