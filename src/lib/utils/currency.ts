/** Format number as Philippine Peso (₱). */
export function formatPHP(amount: number, opts: { decimals?: boolean } = {}): string {
  const fractionDigits = opts.decimals === false ? 0 : 2
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`
}

/** Plain integer formatting (e.g. 1,234,567). */
export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/** Compact view counts: 12.4K, 1.2M, 24.5M. */
export function formatViews(value: number): string {
  if (value < 1000) return `${value}`
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`
  if (value < 1_000_000_000) return `${(value / 1_000_000).toFixed(value < 10_000_000 ? 1 : 0).replace(/\.0$/, '')}M`
  return `${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`
}

/** Compute earnings: views / 1000 * ratePer1k. */
export function computeEarnings(views: number, ratePer1k: number): number {
  return Math.round((views / 1000) * ratePer1k * 100) / 100
}
