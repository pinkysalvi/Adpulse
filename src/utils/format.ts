import type { MetricFormat } from './metrics'

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const currency2 = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export function formatValue(value: number, format: MetricFormat): string {
  switch (format) {
    case 'currency':
      return currency.format(value)
    case 'decimal':
      return currency2.format(value)
    case 'percent':
      return percent.format(value)
    default:
      return integer.format(value)
  }
}

/** Short form for chart axes: 12.4K, $1.2M, 14.5% */
export function formatCompact(value: number, format: MetricFormat): string {
  if (format === 'percent') return percent.format(value)
  if (format === 'decimal') return currency2.format(value)
  const sign = value < 0 ? '-' : ''
  return sign + (format === 'currency' ? '$' : '') + compact.format(Math.abs(value))
}
