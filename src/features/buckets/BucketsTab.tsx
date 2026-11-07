import { useCallback, useState, type ReactNode } from 'react'
import { Doughnut } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import type { BucketSlice } from '../../../server/types'
import { useGetBucketsQuery } from '../../app/api'
import { useRangeArgs } from '../../app/store'
import { useChartTheme } from '../../charts/setup'
import { ExpandIcon } from '../../components/icons'
import { Modal } from '../../components/ui/Modal'
import { ErrorState, Skeleton } from '../../components/ui/States'
import { formatValue } from '../../utils/format'
import { METRIC_BY_KEY, type MetricKey } from '../../utils/metrics'
import { BucketBars } from './BucketBars'
import '../../charts/setup'

/** Volume metrics: shown as share-of-total donuts */
const DONUTS: MetricKey[] = ['requests', 'clicks', 'conversions', 'net']
/** Rates and profit: compared side by side as bars */
const BARS: MetricKey[] = ['ctr', 'cr', 'net']

type Expanded = { kind: 'donut' | 'bar'; metric: MetricKey } | null

function ChartCard({ title, onExpand, disabled, children }: { title: string; onExpand: () => void; disabled: boolean; children: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button className="icon-btn h-8 w-8 border-0" aria-label={`Expand ${title} chart`} onClick={onExpand} disabled={disabled}>
          <ExpandIcon />
        </button>
      </div>
      {children}
    </div>
  )
}

function BucketDonut({ buckets, metric, large = false }: { buckets: BucketSlice[]; metric: MetricKey; large?: boolean }) {
  const theme = useChartTheme()
  const def = METRIC_BY_KEY[metric]
  // negative values (e.g. net revenue of the unprofitable bucket) can't be a slice
  const values = buckets.map(b => Math.max(0, def.value(b)))
  const total = values.reduce((s, v) => s + v, 0)

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.tooltipBg,
        titleColor: theme.tooltipText,
        bodyColor: theme.tooltipText,
        borderColor: theme.tooltipBorder,
        borderWidth: 1,
        callbacks: {
          label: ctx => ` ${ctx.label}: ${formatValue(ctx.parsed, def.format)} (${total ? ((ctx.parsed / total) * 100).toFixed(1) : 0}%)`,
        },
      },
    },
  }

  return (
    <div className={large ? 'grid items-center gap-6 md:grid-cols-[320px_1fr]' : ''}>
      <div className={`relative mx-auto ${large ? 'h-80 w-80' : 'h-44 w-44'}`}>
        <Doughnut
          data={{
            labels: buckets.map(b => b.name),
            datasets: [{ data: values, backgroundColor: buckets.map(b => b.color), borderColor: theme.surface, borderWidth: 2 }],
          }}
          options={options}
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className={`font-semibold tabular-nums ${large ? 'text-2xl' : 'text-base'}`}>{formatValue(total, def.format)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
          </div>
        </div>
      </div>
      <ul className={`text-sm ${large ? '' : 'mt-4'} space-y-1.5`}>
        {buckets.map((b, i) => (
          <li key={b.id} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: b.color }} />
            <span className="flex-1 truncate text-slate-600 dark:text-slate-300">{b.name}</span>
            <span className="tabular-nums">{formatValue(def.value(b), def.format)}</span>
            <span className="w-12 text-right text-xs text-slate-400 tabular-nums">{total ? ((values[i] / total) * 100).toFixed(1) : '0.0'}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function BucketsTab() {
  const range = useRangeArgs()
  const { data, isError, isFetching, refetch } = useGetBucketsQuery(range)
  const [expanded, setExpanded] = useState<Expanded>(null)
  const close = useCallback(() => setExpanded(null), [])

  if (isError) return <div className="card"><ErrorState onRetry={refetch} /></div>

  return (
    <div className={`space-y-6 transition-opacity ${isFetching ? 'opacity-60' : ''}`}>
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Bucket-wise distribution</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">How Smart bidding (AI) traffic splits across its buckets for the selected period.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {DONUTS.map(metric => (
            <ChartCard key={metric} title={`Total ${METRIC_BY_KEY[metric].label}`} disabled={!data} onExpand={() => setExpanded({ kind: 'donut', metric })}>
              {data ? <BucketDonut buckets={data.buckets} metric={metric} /> : <Skeleton className="mx-auto h-44 w-44 rounded-full" />}
            </ChartCard>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Bucket-wise comparison</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Click-through rate, conversion rate and net revenue for each bucket.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {BARS.map(metric => (
            <ChartCard key={metric} title={METRIC_BY_KEY[metric].label} disabled={!data} onExpand={() => setExpanded({ kind: 'bar', metric })}>
              {data ? <BucketBars buckets={data.buckets} metric={metric} /> : <Skeleton className="h-64" />}
            </ChartCard>
          ))}
        </div>
      </section>

      {expanded && data && (
        <Modal title={`${METRIC_BY_KEY[expanded.metric].label} by bucket`} onClose={close}>
          {expanded.kind === 'donut' ? (
            <BucketDonut buckets={data.buckets} metric={expanded.metric} large />
          ) : (
            <BucketBars buckets={data.buckets} metric={expanded.metric} large />
          )}
        </Modal>
      )}
    </div>
  )
}
