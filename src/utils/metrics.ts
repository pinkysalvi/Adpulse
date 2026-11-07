import type { RawMetrics } from '../../server/types'

export type MetricKey =
  | 'requests'
  | 'requestShare'
  | 'wins'
  | 'clicks'
  | 'winRate'
  | 'ctr'
  | 'tac'
  | 'tacCpc'
  | 'conversions'
  | 'cr'
  | 'gross'
  | 'net'
  | 'rpc'
  | 'sales'
  | 'netPct'

export type MetricFormat = 'number' | 'currency' | 'percent' | 'decimal'

export interface MetricDef {
  key: MetricKey
  label: string
  format: MetricFormat
  /** additive metrics can be stacked in charts and summed across rows */
  additive: boolean
  description: string
  value: (m: RawMetrics, total?: RawMetrics) => number
}

const ratio = (a: number, b: number) => (b ? a / b : 0)

export const METRICS: MetricDef[] = [
  { key: 'requests', label: 'Raw Requests', format: 'number', additive: true, description: 'Bid requests received from publishers.', value: m => m.requests },
  {
    key: 'requestShare',
    label: 'Request Share',
    format: 'percent',
    additive: false,
    description: 'Share of all requests in the selected view handled by this strategy.',
    value: (m, total) => ratio(m.requests, total?.requests ?? m.requests),
  },
  { key: 'clicks', label: 'Clicks', format: 'number', additive: true, description: 'Clicks on ads served.', value: m => m.clicks },
  { key: 'winRate', label: 'Win Rate', format: 'percent', additive: false, description: 'Auctions won ÷ raw requests.', value: m => ratio(m.wins, m.requests) },
  { key: 'ctr', label: 'CTR', format: 'percent', additive: false, description: 'Clicks ÷ auctions won (impressions).', value: m => ratio(m.clicks, m.wins) },
  { key: 'tac', label: 'Pub TAC', format: 'currency', additive: true, description: 'Traffic acquisition cost: what we pay publishers for their traffic.', value: m => m.tac },
  { key: 'tacCpc', label: 'Pub TAC CPC', format: 'decimal', additive: false, description: 'Pub TAC ÷ clicks: cost per click paid to publishers.', value: m => ratio(m.tac, m.clicks) },
  { key: 'conversions', label: 'Conversions', format: 'number', additive: true, description: 'Purchases or sign-ups after a click.', value: m => m.conversions },
  { key: 'cr', label: 'CR', format: 'percent', additive: false, description: 'Conversion rate: conversions ÷ clicks.', value: m => ratio(m.conversions, m.clicks) },
  { key: 'gross', label: 'Gross Revenue', format: 'currency', additive: true, description: 'Revenue billed to advertisers.', value: m => m.gross },
  { key: 'net', label: 'Net Revenue', format: 'currency', additive: true, description: 'Gross revenue − Pub TAC.', value: m => m.gross - m.tac },
  { key: 'rpc', label: 'RPC', format: 'decimal', additive: false, description: 'Revenue per click: gross revenue ÷ clicks.', value: m => ratio(m.gross, m.clicks) },
  { key: 'sales', label: 'Sales', format: 'currency', additive: true, description: 'Advertiser sales value from conversions.', value: m => m.sales },
  { key: 'netPct', label: 'Net %', format: 'percent', additive: false, description: 'Net margin: net revenue ÷ gross revenue.', value: m => ratio(m.gross - m.tac, m.gross) },
]

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map(m => [m.key, m])) as Record<MetricKey, MetricDef>

/** Metrics that make sense to plot over time */
export const CHART_METRICS = METRICS.filter(m => m.key !== 'requestShare')
