import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

function Progress({
  className,
  value,
  max = 100,
  animated = false,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  animated?: boolean
  indicatorClassName?: string
}) {
  const pct = Math.min(max, Math.max(0, value ?? 0))
  const widthPercent = max > 0 ? (pct / max) * 100 : 0

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      max={max}
      value={pct}
      className={cn(
        'relative h-2 w-full min-w-0 overflow-hidden rounded-full bg-muted',
        className
      )}
      {...props}
    >
      {animated ? (
        <style>
          {`
            @keyframes arp-progress-shine {
              to {
                left: calc(100% - 2rem);
              }
            }
            @media (prefers-reduced-motion: reduce) {
              [data-slot="progress-shine"] {
                animation: none !important;
              }
            }
          `}
        </style>
      ) : null}
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'relative h-full max-w-full overflow-hidden rounded-full transition-[width] duration-1000 ease-out motion-reduce:transition-none',
          indicatorClassName ?? 'bg-primary'
        )}
        style={{ width: `${widthPercent}%` }}
      >
        {animated ? (
          <div
            data-slot="progress-shine"
            className="pointer-events-none absolute inset-y-0 left-0 w-8 -skew-x-12 bg-white/20 blur-[3px]"
            style={{ animation: 'arp-progress-shine 1.25s ease-in-out infinite' }}
          />
        ) : null}
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
