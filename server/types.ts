// Types shared by the API (Netlify Function) and the React app.

export type FilterKey =
  | 'publisher'
  | 'subId'
  | 'tag'
  | 'brand'
  | 'advertiser'
  | 'campaign'
  | 'country'
  | 'opsAm'
  | 'bdAm'

export type Filters = Partial<Record<FilterKey, string[]>>

/** Additive counts. Every rate (CTR, RPC, Net %...) is derived from these on the client. */
export interface RawMetrics {
  requests: number
  wins: number
  clicks: number
  conversions: number
  /** Pub TAC: traffic acquisition cost paid to publishers ($) */
  tac: number
  /** Gross revenue ($) */
  gross: number
  /** Advertiser sales value ($) */
  sales: number
}

export interface StrategyNode {
  id: string
  name: string
  color: string
  children?: StrategyNode[]
}

export interface Option {
  id: string
  label: string
}

export interface FilterOptionsResponse {
  options: Option[]
  /** true when Sub IDs are requested without choosing a publisher first */
  needsPublisher?: boolean
}

export interface MetaResponse {
  serverTime: string
  lastProcessed: string
  lastHour: number
  minDate: string
  maxDate: string
}

export interface SummaryResponse {
  dates: string[]
  /** raw metrics per strategy node id, one entry per date */
  series: Record<string, RawMetrics[]>
}

export interface PerformanceRow extends RawMetrics {
  id: string
  name: string
  children?: PerformanceRow[]
}

export interface PerformanceResponse {
  rows: PerformanceRow[]
}

export type Granularity = 'day' | 'week' | 'month'
export type DataView = 'date' | 'geo'

export interface StrategyDataRow extends RawMetrics {
  key: string
  label: string
}

export interface StrategyDataResponse {
  rows: StrategyDataRow[]
  total: number
  page: number
  pageSize: number
  totals: RawMetrics
}

export interface BucketSlice extends RawMetrics {
  id: string
  name: string
  color: string
}

export interface BucketsResponse {
  buckets: BucketSlice[]
}
