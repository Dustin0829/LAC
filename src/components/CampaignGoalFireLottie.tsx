import { useCallback, useEffect, useRef, useState } from 'react'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'

import fireAnimation from '@/assets/fire-animation.json'
import { cn } from '@/lib/utils'

const SIZE_PX = 26
/** Mid-loop frame with a readable flame shape when motion is reduced. */
const STATIC_FRAME = 45

interface CampaignGoalFireLottieProps {
  className?: string
}

/** Animated fire for campaign goal / budget “on track” state (`fire-animation.json`). */
export function CampaignGoalFireLottie({ className }: CampaignGoalFireLottieProps) {
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const [reduceMotion, setReduceMotion] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const applyPlayback = useCallback(() => {
    const r = lottieRef.current
    if (!r?.animationLoaded) return
    if (reduceMotion) {
      r.pause()
      r.goToAndStop(STATIC_FRAME, true)
    } else {
      r.setSpeed(1)
      r.goToAndPlay(0, true)
    }
  }, [reduceMotion])

  useEffect(() => {
    applyPlayback()
  }, [applyPlayback])

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden', className)}
      style={{ width: SIZE_PX, height: SIZE_PX }}
      aria-hidden
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={fireAnimation}
        loop={!reduceMotion}
        className="h-full w-full [&_svg]:h-full! [&_svg]:w-full!"
        onDOMLoaded={applyPlayback}
        role="presentation"
      />
    </span>
  )
}
