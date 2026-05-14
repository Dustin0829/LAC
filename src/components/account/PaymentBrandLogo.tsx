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

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={cn('shrink-0 object-contain', className, imgClassName)}
      />
    )
  }

  return (
    <Icon
      className={cn('shrink-0 text-muted-foreground', className ?? 'h-5 w-5', imgClassName)}
    />
  )
}
