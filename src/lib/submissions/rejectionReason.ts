/** System rejection codes → creator/brand-facing copy. */
const REJECTION_REASON_LABELS: Record<string, string> = {
  admin_force: 'Removed by platform support.',
  content_deleted: 'Content was deleted or is no longer available.',
}

/** User-facing rejection reason for tooltips; null when empty. */
export function formatRejectionReasonDisplay(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  return REJECTION_REASON_LABELS[trimmed] ?? trimmed
}
