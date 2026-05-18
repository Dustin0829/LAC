import { SubmissionsEmptyIllustration } from '@/components/creator/SubmissionsEmptyIllustration'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  creatorDashboardRecentSubmissionsEmptyDescription,
  creatorDashboardRecentSubmissionsEmptyTitle,
} from '@/lib/creators/dashboard/creatorDashboardPage'

type CreatorDashboardRecentSubmissionsEmptyStateProps = {
  colSpan?: number
}

export function CreatorDashboardRecentSubmissionsEmptyState({
  colSpan = 6,
}: CreatorDashboardRecentSubmissionsEmptyStateProps) {
  return (
    <TableRow className="cursor-default hover:bg-transparent">
      <TableCell
        colSpan={colSpan}
        className="py-12 text-center whitespace-normal sm:py-14 [&_p]:mx-auto [&_p]:max-w-md [&_p]:whitespace-normal"
      >
        <SubmissionsEmptyIllustration />
        <h3 className="mt-6 font-display text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {creatorDashboardRecentSubmissionsEmptyTitle()}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {creatorDashboardRecentSubmissionsEmptyDescription()}
        </p>
      </TableCell>
    </TableRow>
  )
}
