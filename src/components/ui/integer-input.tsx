import * as React from 'react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function formatThousands(digits: string): string {
  if (!digits) return ''
  const n = Number(digits)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('en-PH')
}

function clampOnBlur(next: string, min?: number, max?: number): string {
  if (next === '') return ''
  const n = Number(next)
  if (!Number.isFinite(n)) return next
  let v = n
  if (min !== undefined && v < min) v = min
  if (max !== undefined && v > max) v = max
  return String(v)
}

export interface IntegerInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'type' | 'value' | 'onChange' | 'min' | 'max'
> {
  value: string
  onValueChange: (digits: string) => void
  /** Leading ₱ inside the field on the left; use for PHP whole-peso amounts. */
  pesoPrefix?: boolean
  /** Minimum whole value; enforced on blur (not while typing, so values like 250 stay editable when min is 35). */
  min?: number
  /** Maximum whole value; enforced on blur. */
  max?: number
}

/**
 * Whole-number field with en-PH thousands grouping (e.g. 10,000). Parent state should hold digits only.
 */
const IntegerInput = React.forwardRef<HTMLInputElement, IntegerInputProps>(
  ({ className, value, onValueChange, pesoPrefix, min, max, onBlur, ...props }, ref) => {
    const digits = digitsOnly(value)
    const display = formatThousands(digits)
    const n = digits === '' ? undefined : Number(digits)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = digitsOnly(e.target.value)
      onValueChange(raw)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = digitsOnly(value)
      const next = clampOnBlur(raw, min, max)
      if (next !== raw) onValueChange(next)
      onBlur?.(e)
    }

    const inputEl = (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        role="spinbutton"
        aria-valuenow={n !== undefined && Number.isFinite(n) ? n : undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        className={cn(pesoPrefix && 'pl-8', className)}
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    )

    if (pesoPrefix) {
      return (
        <div className="relative w-full">
          <span
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold text-muted-foreground"
            aria-hidden
          >
            ₱
          </span>
          {inputEl}
        </div>
      )
    }

    return inputEl
  }
)
IntegerInput.displayName = 'IntegerInput'

export { IntegerInput }
