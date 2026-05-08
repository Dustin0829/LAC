import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/mockData'

const PLATFORM_SRC: Record<Platform, string> = {
  tiktok: '/tiktok-mono.svg',
  facebook: '/facebook.svg',
}

const PLATFORM_LABEL: Record<Platform, string> = {
  tiktok: 'TikTok',
  facebook: 'Facebook',
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
