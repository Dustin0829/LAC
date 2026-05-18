import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type CampaignCoverImageProps = {
  src?: string
  fallbackSrc?: string
  alt: string
  className?: string
}

/** Tries public CDN first; on load error uses signed R2 fallback when provided. */
export function CampaignCoverImage({ src, fallbackSrc, alt, className }: CampaignCoverImageProps) {
  const [activeSrc, setActiveSrc] = useState(src)

  useEffect(() => {
    setActiveSrc(src)
  }, [src, fallbackSrc])

  if (!activeSrc) return null

  return (
    <img
      src={activeSrc}
      alt={alt}
      className={cn(className)}
      loading="lazy"
      onError={() => {
        if (fallbackSrc && activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc)
        }
      }}
    />
  )
}
