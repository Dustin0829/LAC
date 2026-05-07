import { Tiktok, Facebook } from '@thesvg/react'
import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/mockData'

interface PlatformIconProps {
  platform: Platform
  className?: string
}

export function PlatformIcon({ platform, className = 'h-7 w-7' }: PlatformIconProps) {
  const Icon = platform === 'tiktok' ? Tiktok : Facebook
  return (
    <div
      className={cn(
        className,
        'flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-card p-1',
        platform === 'tiktok' && 'bg-black',
        platform === 'facebook' && 'border-transparent bg-[#1877F2]'
      )}
      aria-hidden
    >
      <Icon
        className={cn(
          'h-[82%] w-[82%] max-h-full max-w-full',
          platform === 'facebook' && 'brightness-0 invert'
        )}
      />
    </div>
  )
}
