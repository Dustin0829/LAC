import { ShoppingBag } from 'lucide-react'

import { cn } from '@/lib/utils'
import { PLATFORM_LABEL, type Platform } from '@/lib/mockData'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const PLATFORM_SRC: Record<Platform, string> = {
  tiktok: '/tiktok-mono.svg',
  facebook: '/facebook.svg',
}

interface PlatformIconProps {
  platform: Platform
  className?: string
}

export function PlatformIcon({ platform, className = 'h-5 w-5' }: PlatformIconProps) {
  return (
    <img
      src={PLATFORM_SRC[platform]}
      alt={PLATFORM_LABEL[platform]}
      className={cn('shrink-0 object-contain', className)}
      loading="lazy"
      decoding="async"
    />
  )
}

interface PlatformCellProps {
  platform: Platform
  /** Icon size; label stays `text-sm`. */
  iconClassName?: string
  className?: string
  /** TikTok-only: show yellow basket indicator when declared at submit. */
  hasYellowBasket?: boolean
}

/** BugHyve-style: platform glyph + readable name (used across brand/creator tables). */
export function PlatformCell({
  platform,
  iconClassName = 'h-5 w-5',
  className,
  hasYellowBasket = false,
}: PlatformCellProps) {
  const showBasket = platform === 'tiktok' && hasYellowBasket

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <PlatformIcon platform={platform} className={iconClassName} />
      <span className="truncate text-sm font-medium text-foreground">
        {PLATFORM_LABEL[platform]}
      </span>
      {showBasket ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex shrink-0 rounded-md text-yellow-500 outline-none hover:text-yellow-600 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Yellow basket"
              onClick={(e) => e.stopPropagation()}
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">This submission has yellow basket</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}
