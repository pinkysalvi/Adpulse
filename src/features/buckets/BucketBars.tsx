import { Bar } from 'react-chartjs-2'
import type { ChartOptions } from 'chart.js'
import type { BucketSlice } from '../../../server/types'
import { useChartTheme } from '../../charts/setup'
import { formatCompact, formatValue } from '../../utils/format'
import { METRIC_BY_KEY, type MetricKey } from '../../utils/metrics'

/**
 * One metric compared across buckets. Unlike the donuts this works for rates
 * (CTR, CR) and for negative values (an unprofitable bucket's net revenue).
 */
export function BucketBars({ buckets, metric, large = false }: { buckets: BucketSlice[]; metric: MetricKey; large?: boolean }) {
  const theme = useChartTheme()
  const def = METRIC_BY_KEY[metric]

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme.tooltipBg,
        titleColor: theme.tooltipText,
        bodyColor: theme.tooltipText,
        borderColor: theme.tooltipBorder,
        borderWidth: 1,
        callbacks: { label: ctx => ` ${def.label}: ${formatValue(ctx.parsed.y ?? 0, def.format)}` },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: theme.text, autoSkip: false, maxRotation: large ? 0 : 45 },
        title: { display: true, text: 'Bucket', color: theme.text },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        // make the zero line stand out so negative bars read clearly
        grid: { color: ctx => (ctx.tick.value === 0 ? theme.text : theme.grid) },
        ticks: { color: theme.text, callback: v => formatCompact(Number(v), def.format) },
        title: { display: true, text: def.label, color: theme.text },
      },
    },
  }

  return (
    <div className={large ? 'h-96' : 'h-64'} role="img" aria-label={`${def.label} by bucket`}>
      <Bar
        data={{
          labels: buckets.map(b => b.name),
          datasets: [
            {
              data: buckets.map(b => def.value(b)),
              backgroundColor: buckets.map(b => b.color),
              borderRadius: 6,
              maxBarThickness: large ? 72 : 48,
            },
          ],
        }}
        options={options}
      />
    </div>
  )
}
