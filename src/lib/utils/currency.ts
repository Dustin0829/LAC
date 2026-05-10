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

/** View/reach counts with grouping separators (no K/M abbreviations). */
export function formatViews(value: number): string {
  return formatNumber(Math.round(value))
}

/** Compute earnings: views / 1000 * ratePer1k. */
export function computeEarnings(views: number, ratePer1k: number): number {
  return Math.round((views / 1000) * ratePer1k * 100) / 100
}
