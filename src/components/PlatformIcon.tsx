import type { Platform } from '@/lib/mockData'

interface PlatformIconProps {
  platform: Platform
  className?: string
}

const COLORS: Record<Platform, string> = {
  tiktok: 'bg-black text-white',
  youtube: 'bg-red-600 text-white',
  instagram: 'bg-zinc-900 text-white',
  facebook: 'bg-blue-600 text-white',
}

const LETTERS: Record<Platform, string> = {
  tiktok: 'TT',
  youtube: 'YT',
  instagram: 'IG',
  facebook: 'FB',
}

export function PlatformIcon({ platform, className = 'h-7 w-7' }: PlatformIconProps) {
  return (
    <div
      className={`${className} ${COLORS[platform]} rounded-lg flex items-center justify-center text-[10px] font-extrabold`}
    >
      {LETTERS[platform]}
    </div>
  )
}
