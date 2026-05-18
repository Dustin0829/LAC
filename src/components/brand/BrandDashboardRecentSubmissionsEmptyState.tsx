import { SubmissionsEmptyIllustration } from '@/components/creator/SubmissionsEmptyIllustration'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  brandDashboardRecentSubmissionsEmptyDescription,
  brandDashboardRecentSubmissionsEmptyTitle,
} from '@/lib/brands/dashboard/brandDashboardPage'

type BrandDashboardRecentSubmissionsEmptyStateProps = {
  colSpan?: number
}

export function BrandDashboardRecentSubmissionsEmptyState({
  colSpan = 6,
}: BrandDashboardRecentSubmissionsEmptyStateProps) {
  return (
    <TableRow className="cursor-default hover:bg-transparent">
      <TableCell
        colSpan={colSpan}
        className="py-12 text-center whitespace-normal sm:py-14 [&_p]:mx-auto [&_p]:max-w-md [&_p]:whitespace-normal"
      >
        <SubmissionsEmptyIllustration />
        <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {brandDashboardRecentSubmissionsEmptyTitle()}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {brandDashboardRecentSubmissionsEmptyDescription()}
        </p>
      </TableCell>
    </TableRow>
  )
}
