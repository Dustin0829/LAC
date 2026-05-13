import { TablePaginationFooter } from '@/components/ui/table'
import { cn } from '@/lib/utils'

export interface TablePaginationProps {
  /** 1-based current page (will be clamped against total pages). */
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  className?: string
  /** e.g. "submissions", "items" */
  itemLabel?: string
}

export function TablePagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
  itemLabel = 'items',
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)

  return (
    <div className={cn(className)}>
      <TablePaginationFooter
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        itemLabel={itemLabel}
      />
    </div>
  )
}
