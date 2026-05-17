import brandArt from '@/assets/onboarding-brands.png'
import creatorArt from '@/assets/onboarding-creator.png'
import { cn } from '@/lib/utils'

function RoleIllustration({ src, className }: { src: string; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      width={360}
      height={300}
      loading="lazy"
      decoding="async"
      className={cn(
        'pointer-events-none h-auto w-full min-w-[220px] max-w-none object-contain object-center',
        'max-h-[240px] sm:max-h-[290px] md:max-h-[340px] lg:max-h-[360px]',
        'scale-[1.02] sm:scale-105 md:scale-[1.08]',
        className
      )}
    />
  )
}

export function CreatorRoleIllustration() {
  return <RoleIllustration src={creatorArt} />
}

export function BrandRoleIllustration() {
  return <RoleIllustration src={brandArt} />
}
