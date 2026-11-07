import { useCallback, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import type { Chart, ChartData, ChartOptions, TooltipModel } from 'chart.js'
import type { SummaryResponse } from '../../../server/types'
import { useChartTheme } from '../../charts/setup'
import { formatDate, formatDateShort } from '../../utils/dates'
import { formatCompact, formatValue } from '../../utils/format'
import { METRIC_BY_KEY, type MetricDef, type MetricKey } from '../../utils/metrics'
import { FLAT_NODES, LEAF_NODE_IDS, NODE_COLOR, NODE_NAME } from '../../utils/tree'
import { ChartTooltip, type TooltipSection } from './ChartTooltip'

interface TrendChartProps {
  data: SummaryResponse
  primary: MetricKey
  compare: MetricKey | null
  hidden: string[]
}

interface HoverState {
  index: number
  x: number
  side: 'left' | 'right'
}

const withAlpha = (hex: string, alpha: number) => `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`


/**
 * Additive metrics (revenue, clicks...) are stacked areas per strategy, so the stack
 * height is the total. Ratios (CTR, RPC...) can't be stacked, so they're shown as lines.
 * The optional compare metric is the "All traffic" line on a second axis.
 */
export function TrendChart({ data, primary, compare, hidden }: TrendChartProps) {
  const theme = useChartTheme()
  const primaryDef = METRIC_BY_KEY[primary]
  const compareDef = compare ? METRIC_BY_KEY[compare] : null
  const [hover, setHover] = useState<HoverState | null>(null)

  // Building datasets walks every day for every strategy; only redo it when inputs change
  const chartData = useMemo<ChartData<'line'>>(() => {
    const stacked = primaryDef.additive
    const visibleLeaves = LEAF_NODE_IDS.filter(id => !hidden.includes(id))
    const datasets: ChartData<'line'>['datasets'] = visibleLeaves.map((id, i) => ({
      label: NODE_NAME[id],
      data: data.series[id].map(m => primaryDef.value(m)),
      borderColor: NODE_COLOR[id],
      // near-solid bands so each strategy reads clearly; lines for ratio metrics stay fully opaque
      backgroundColor: stacked ? withAlpha(NODE_COLOR[id], 0.85) : NODE_COLOR[id],
      fill: stacked ? (i === 0 ? 'origin' : '-1') : false,
      borderWidth: stacked ? 1 : 2.5,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBorderWidth: 2,
      pointHoverBackgroundColor: theme.surface,
      // smooth curves that never overshoot the real values
      cubicInterpolationMode: 'monotone',
      yAxisID: 'y',
      stack: 'primary',
      order: 1,
    }))
    if (compareDef) {
      // One dashed line per visible strategy, in its own colour. Additive metrics are stacked
      // (each line sits on the previous one, the top line is the total) so they never cross;
      // the y1 axis below places this group of lines in the band above the coloured areas.
      // Group and All traffic totals are shown in the tooltip.
      for (const id of visibleLeaves) {
        datasets.push({
          label: `${compareDef.label} · ${NODE_NAME[id]}`,
          data: data.series[id].map(m => compareDef.value(m)),
          borderColor: NODE_COLOR[id],
          backgroundColor: NODE_COLOR[id],
          borderDash: [5, 4],
          borderWidth: 2,
          // lower order draws later, i.e. on top of the stacked bands
          order: 0,
          pointRadius: 0,
          pointHoverRadius: 3,
          cubicInterpolationMode: 'monotone',
          fill: false,
          yAxisID: 'y1',
          stack: 'compare',
        })
      }
    }
    return { labels: data.dates.map(formatDateShort), datasets }
  }, [data, primaryDef, compareDef, hidden, theme.surface])

  // Chart.js calls this on every mouse move; only re-render when the hovered day or side changes
  const external = useCallback(({ chart, tooltip }: { chart: Chart; tooltip: TooltipModel<'line'> }) => {
    const index = tooltip.dataPoints?.[0]?.dataIndex
    if (tooltip.opacity === 0 || index === undefined) {
      setHover(null)
      return
    }
    const x = tooltip.caretX
    const side = x < chart.width / 2 ? 'right' : 'left'
    setHover(h => (h && h.index === index && h.side === side ? h : { index, x, side }))
  }, [])

  // Options are memoised so hover state changes don't make Chart.js re-apply them
  const options = useMemo<ChartOptions<'line'>>(() => {
    // lowest value the compare lines actually reach; right-axis labels below it are hidden
    const compareRange = { lo: -Infinity }
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: data.dates.length > 120 ? false : { duration: 400 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false, external },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: theme.text, maxTicksLimit: 10, maxRotation: 0 } },
        y: {
          stacked: primaryDef.additive,
          // a stacked area must start at zero, otherwise band sizes look exaggerated
          beginAtZero: primaryDef.additive,
          // leave headroom above the areas for the compare lines
          grace: compareDef ? '45%' : '5%',
          grid: { color: theme.grid },
          border: { display: false },
          ticks: { color: theme.text, callback: v => formatCompact(Number(v), primaryDef.format) },
          title: { display: true, text: primaryDef.label, color: theme.text },
        },
        ...(compareDef && {
          y1: {
            position: 'right' as const,
            stacked: compareDef.additive,
            /*
             * Spread the compare lines from the lower-middle of the chart to above the coloured areas:
             * extend the axis downwards by about a third of the lines' own range. Labels are only shown for
             * the range the lines use; exact values are in the tooltip.
             */
            afterDataLimits: (scale: { min: number; max: number }) => {
              const span = scale.max - scale.min || Math.abs(scale.max) || 1
              compareRange.lo = scale.min
              scale.min -= span * 0.37
              scale.max += span * 0.1
            },
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: theme.text,
              callback: (v: string | number) => (Number(v) < compareRange.lo ? '' : formatCompact(Number(v), compareDef.format)),
            },
            title: { display: true, text: compareDef.label, color: theme.text },
          },
        }),
      },
    }
  }, [data.dates.length, external, theme.text, theme.grid, primaryDef, compareDef])

  // Tooltip lists every visible strategy in tree order, for the primary and compare metric
  const tooltipSections = (index: number): TooltipSection[] => {
    const visible = FLAT_NODES.filter(({ node }) => !hidden.includes(node.id))
    const section = (def: MetricDef, dashed: boolean): TooltipSection => ({
      title: def.label,
      dashed,
      rows: visible.map(({ node }) => ({
        id: node.id,
        name: node.name,
        color: node.color,
        strong: !!node.children,
        value: formatValue(def.value(data.series[node.id][index]), def.format),
      })),
    })
    return compareDef ? [section(primaryDef, false), section(compareDef, true)] : [section(primaryDef, false)]
  }

  return (
    // fills the (min 420px) chart area given by the parent card
    <div className="absolute inset-0" role="img" aria-label={`${primaryDef.label} over time by bidding strategy`} onMouseLeave={() => setHover(null)}>
      <Line data={chartData} options={options} />
      {hover && (
        <ChartTooltip title={formatDate(data.dates[hover.index])} sections={tooltipSections(hover.index)} x={hover.x} side={hover.side} />
      )}
    </div>
  )
}
