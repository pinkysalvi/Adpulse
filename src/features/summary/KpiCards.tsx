import { useGetPerformanceQuery } from '../../app/api'
import { useRangeArgs } from '../../app/store'
import { Skeleton } from '../../components/ui/States'
import { addDays, daysBetween } from '../../utils/dates'
import { formatValue } from '../../utils/format'
import { METRIC_BY_KEY, type MetricKey } from '../../utils/metrics'

const KPIS: MetricKey[] = ['gross', 'tac', 'net', 'clicks', 'rpc']
// for cost metrics a rise is bad news
const LOWER_IS_BETTER: MetricKey[] = ['tac']

/** Headline totals for the selected period, compared with the period just before it. */
export function KpiCards() {
  const range = useRangeArgs()
  const length = daysBetween(range.from, range.to)
  const previous = { ...range, from: addDays(range.from, -length), to: addDays(range.from, -1) }

  const current = useGetPerformanceQuery(range)
  const prior = useGetPerformanceQuery(previous)
  const now = current.data?.rows[0]
  const before = prior.data?.rows[0]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {KPIS.map(key => {
        const def = METRIC_BY_KEY[key]
        const value = now ? def.value(now) : null
        const prev = before ? def.value(before) : null
        const change = value !== null && prev ? (value - prev) / Math.abs(prev) : null
        const good = change !== null && (LOWER_IS_BETTER.includes(key) ? change <= 0 : change >= 0)
        return (
          <div key={key} className="card p-4">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{def.label}</p>
            {value === null ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-1 text-xl font-semibold tabular-nums">{formatValue(value, def.format)}</p>
            )}
            <p className="mt-1 h-4 text-xs">
              {change !== null && (
                <span className={good ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {change >= 0 ? '▲' : '▼'} {Math.abs(change * 100).toFixed(1)}%
                  <span className="text-slate-400 dark:text-slate-500"> vs previous {length} days</span>
                </span>
              )}
            </p>
          </div>
        )
      })}
    </div>
  )
}
