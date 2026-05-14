import type { ComponentProps } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RefreshButtonProps = {
  onRefresh: () => void | Promise<unknown>

  isRefreshing?: boolean
  className?: string
  successMessage?: string
  genericErrorMessage?: string
  'aria-label'?: string
} & Pick<ComponentProps<typeof Button>, 'variant' | 'size'>

function flattenRefetchResults(result: unknown): unknown[] {
  if (result == null) return []
  if (Array.isArray(result)) return result.flatMap((r) => flattenRefetchResults(r))
  return [result]
}

function getRefetchFailureMessage(results: unknown[], fallback: string): string | null {
  for (const r of results) {
    if (
      !r ||
      typeof r !== 'object' ||
      !('isError' in r) ||
      (r as { isError: boolean }).isError !== true
    ) {
      continue
    }
    const err = (r as { error?: unknown }).error
    if (err instanceof Error) return err.message
    if (typeof err === 'string') return err
    return fallback
  }
  return null
}

export function RefreshButton({
  onRefresh,
  isRefreshing,
  className,
  successMessage = 'Updated',
  genericErrorMessage = "Couldn't refresh. Try again.",
  'aria-label': ariaLabel = 'Refresh',
  variant = 'outline',
  size = 'default',
}: RefreshButtonProps) {
  const handleClick = async () => {
    try {
      const result = await Promise.resolve(onRefresh())
      const flat = flattenRefetchResults(result)
      const errMsg = getRefetchFailureMessage(flat, genericErrorMessage)
      if (errMsg) {
        toast.error(errMsg)
        return
      }
      toast.success(successMessage)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : genericErrorMessage)
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(
        'gap-2 px-4 shrink-0 border-border text-foreground/75 hover:text-foreground',
        className
      )}
      disabled={isRefreshing}
      onClick={() => void handleClick()}
      aria-busy={isRefreshing}
      aria-label={ariaLabel}
    >
      <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} aria-hidden />
    </Button>
  )
}
