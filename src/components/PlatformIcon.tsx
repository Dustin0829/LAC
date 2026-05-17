import { cn } from '@/lib/utils'
import type { Platform } from '@/api/types/shared'
import { PLATFORM_LABEL } from '@/lib/platforms/labels'
// v1 (post-MVP): Yellow basket tooltip — not shipped yet.
// import { ShoppingBag } from 'lucide-react'
// import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

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
  /** Post–v1 TikTok Yellow Basket indicator (UI disabled for v1). */
  hasYellowBasket?: boolean
}

/** BugHyve-style: platform glyph + readable name (used across brand/creator tables). */
export function PlatformCell({
  platform,
  iconClassName = 'h-5 w-5',
  className,
  hasYellowBasket: _hasYellowBasket = false,
}: PlatformCellProps) {
  void _hasYellowBasket

  return (
    <div className={cn('flex min-w-0 items-center gap-2', className)}>
      <PlatformIcon platform={platform} className={iconClassName} />
      <span className="truncate text-sm font-medium text-foreground">
        {PLATFORM_LABEL[platform]}
      </span>
      {/*
      v1 (post-MVP): TikTok Yellow basket badge (ShoppingBag + Tooltip) lived here.
      {showBasket ? (
        <Tooltip>...</Tooltip>
      ) : null}
      */}
    </div>
  )
}
