import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface TablePaginationProps {
  /** 1-based current page (will be clamped against total pages). */
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  className?: string
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1
  const end = Math.min(safePage * pageSize, totalItems)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-border sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing{' '}
        <span className="font-medium tabular-nums text-foreground">
          {start}–{end}
        </span>{' '}
        of <span className="font-medium tabular-nums text-foreground">{totalItems}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 font-semibold"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="min-w-28 text-center text-sm tabular-nums text-muted-foreground">
          Page {safePage} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 font-semibold"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
