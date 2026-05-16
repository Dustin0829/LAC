/** Title-case each word for multi-word badge labels (e.g. "Payment received" → "Payment Received"). */
export function formatBadgeLabel(label: string): string {
  if (!/\s/.test(label)) return label
  return label
    .split(/\s+/)
    .map((word) => {
      if (!word || word === '·') return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}
