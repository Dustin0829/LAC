import * as React from 'react'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/** Outer shell: rounded card + border (BugHyve-style, themed for ARPify). */
function TableContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border bg-card text-foreground',
        className
      )}
      {...props}
    />
  )
}

function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div data-slot="table-scroll" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn('w-full min-w-max caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      data-slot="table-header"
      className={cn(
        'bg-muted/30 [&_tr]:cursor-default [&_tr]:border-b [&_tr]:border-border [&_tr]:hover:bg-transparent',
        className
      )}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <tbody
      data-slot="table-body"
      className={cn('divide-y divide-border [&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b border-border transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
}

/** Compact header cells — BugHyve-style density with ARPify tokens. */
function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'px-5 py-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6 whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-5 py-2 align-middle text-sm leading-tight sm:px-6 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5',
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<'caption'>) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('mt-4 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

interface TablePlaceholderProps {
  icon: React.ReactNode
  title: string
  description: string
  colSpan?: number
}

function TablePlaceholder({ icon, title, description, colSpan = 1 }: TablePlaceholderProps) {
  return (
    <TableRow className="cursor-default hover:bg-transparent">
      <TableCell
        colSpan={colSpan}
        className="py-10 text-center whitespace-normal [&_p]:mx-auto [&_p]:max-w-md [&_p]:whitespace-normal"
      >
        <div className="mb-3 flex justify-center text-muted-foreground [&_svg]:h-10 [&_svg]:w-10">
          {icon}
        </div>
        <h3 className="mb-1 font-display text-base font-bold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </TableCell>
    </TableRow>
  )
}

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

function TablePaginationFooter({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'items',
}: TablePaginationProps) {
  if (totalItems <= 0) return null
  const startIndex = (currentPage - 1) * pageSize
  const showingFrom = startIndex + 1
  const showingTo = Math.min(startIndex + pageSize, totalItems)
  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 overflow-x-auto border-t border-border px-4 py-2 sm:px-6">
      <span className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
        <span className="hidden sm:inline">Showing </span>
        {showingFrom}-{showingTo} of {totalItems} {itemLabel}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={cn(
            'min-w-0 rounded-md',
            canPrev && 'border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/15'
          )}
          disabled={!canPrev}
          onClick={() => canPrev && onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5 sm:hidden" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <span className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={cn(
            'min-w-0 rounded-md',
            canNext && 'border-primary text-primary hover:bg-primary/10 dark:hover:bg-primary/15'
          )}
          disabled={!canNext}
          onClick={() => canNext && onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5 sm:hidden" />
        </Button>
      </div>
    </div>
  )
}

export {
  Table,
  TableContainer,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TablePlaceholder,
  TablePaginationFooter,
}
