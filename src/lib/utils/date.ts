import { format } from 'date-fns'

/** Format a date string for display: "December 20, 2024 at 10:00 AM" */
export function formatDateTime(dateString: string): string {
  return format(new Date(dateString), "MMMM d, yyyy 'at' h:mm a")
}

/** Transaction table: "Apr 13, 2026, 2:04:09 PM" */
export function formatTransactionDateTime(dateString: string): string {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return dateString
  return format(d, 'MMM d, yyyy, h:mm:ss a')
}

/** Format a date for short display: "Dec 20, 2024" */
export function formatDate(dateString: string): string {
  return format(new Date(dateString), 'MMM d, yyyy')
}

/** Format a time string "HH:mm" to human form: "12 AM", "12 NN", "2 PM", "9:30 AM" */
export function formatTimeToHuman(time: string): string {
  const [hStr, mStr] = time.split(':')
  const h = parseInt(hStr || '0', 10)
  const m = parseInt(mStr || '0', 10)
  if (h === 0 && m === 0) return '12 AM'
  if (h === 12 && m === 0) return '12 NN'
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${mStr ?? '00'} ${period}`
}

/** Relative time: "just now", "5 minutes ago", "2 hours ago", etc. */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) return 'just now'
  if (diffInMinutes < 60)
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
  if (diffInHours < 24) return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  if (diffInDays < 7) return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months} ${months === 1 ? 'month' : 'months'} ago`
  }
  const years = Math.floor(diffInDays / 365)
  return `${years} ${years === 1 ? 'year' : 'years'} ago`
}
