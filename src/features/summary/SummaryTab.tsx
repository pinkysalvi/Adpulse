import { useGetPerformanceQuery, useGetSummaryQuery } from '../../app/api'
import { useAppDispatch, useAppSelector, useRangeArgs } from '../../app/store'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States'
import { LEAF_NODE_IDS } from '../../utils/tree'
import { setCompareMetric, setPrimaryMetric } from '../dashboard/dashboardSlice'
import { MetricSelect } from './MetricSelect'
import { PerformanceTable } from './PerformanceTable'
import { StrategyLegend } from './StrategyLegend'
import { TrendChart } from './TrendChart'
import { KpiCards } from './KpiCards'
import '../../charts/setup'

export default function SummaryTab() {
  const dispatch = useAppDispatch()
  const range = useRangeArgs()
  const { primaryMetric, compareMetric, hidden } = useAppSelector(s => s.dashboard)
  const summary = useGetSummaryQuery(range)
  const performance = useGetPerformanceQuery(range)
  const allHidden = LEAF_NODE_IDS.every(id => hidden.includes(id))

  return (
    <div className="space-y-5">
      <KpiCards />

      {/* Chart and its controls live in separate cards side by side */}
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        {/* flex column: the chart grows to fill the card when the settings card beside it is taller */}
        <div className="card flex flex-col p-5">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Performance over time</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Daily trend by bidding strategy</p>
          </div>
          <div className={`relative min-h-[420px] flex-1 transition-opacity ${summary.isFetching ? 'opacity-60' : ''}`}>
            {summary.isError ? (
              <ErrorState onRetry={summary.refetch} />
            ) : !summary.data ? (
              <Skeleton className="absolute inset-0" />
            ) : allHidden ? (
              <EmptyState title="All strategies are hidden">Turn one on in the Strategies list to see the chart.</EmptyState>
            ) : (
              <TrendChart data={summary.data} primary={primaryMetric} compare={compareMetric} hidden={hidden} />
            )}
          </div>
        </div>

        <aside className="card space-y-4 p-5" aria-label="Chart settings">
          <MetricSelect label="Primary metric" value={primaryMetric} onChange={k => k && dispatch(setPrimaryMetric(k))} />
          <MetricSelect
            label="Compare with"
            value={compareMetric}
            onChange={k => dispatch(setCompareMetric(k))}
            onClear={() => dispatch(setCompareMetric(null))}
            allowNone
            exclude={primaryMetric}
          />
          <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
            <StrategyLegend />
          </div>
        </aside>
      </div>

      <div className="card p-5">
        {performance.isError ? (
          <ErrorState onRetry={performance.refetch} />
        ) : !performance.data ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ) : (
          <div className={performance.isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <PerformanceTable rows={performance.data.rows} fileName={`adpulse-performance_${range.from}_${range.to}.csv`} />
          </div>
        )}
      </div>
    </div>
  )
}
