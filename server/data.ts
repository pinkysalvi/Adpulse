import type {
  BucketsResponse,
  DataView,
  Filters,
  Granularity,
  PerformanceRow,
  RawMetrics,
  StrategyDataResponse,
  StrategyDataRow,
  StrategyNode,
  SummaryResponse,
} from './types'
import { DIMENSIONS, FILTER_KEYS, LEAF_IDS, LEAF_PROFILES } from './dimensions'
import { NODE_LEAVES, STRATEGY_TREE } from './strategies'
import { randRange } from './random'
import { dateRange, dayIndex, dayLabel, monthKey, monthLabel, weekLabel, weekStart } from './dates'

const DAILY_REQUESTS = 140_000

export const emptyMetrics = (): RawMetrics => ({ requests: 0, wins: 0, clicks: 0, conversions: 0, tac: 0, gross: 0, sales: 0 })

export function addInto(target: RawMetrics, m: RawMetrics): RawMetrics {
  target.requests += m.requests
  target.wins += m.wins
  target.clicks += m.clicks
  target.conversions += m.conversions
  target.tac += m.tac
  target.gross += m.gross
  target.sales += m.sales
  return target
}

const sum = (list: RawMetrics[]) => list.reduce(addInto, emptyMetrics())

/**
 * How much of the total traffic the current filters cover, and how they shift revenue.
 * Sub IDs already imply their publishers, so when both are set only Sub IDs count.
 */
function filterImpact(filters: Filters) {
  let share = 1
  let rpcMul = 1
  for (const key of FILTER_KEYS) {
    const selected = filters[key]
    if (!selected?.length) continue
    if (key === 'publisher' && filters.subId?.length) continue
    const all = DIMENSIONS[key]
    const picked = all.filter(v => selected.includes(v.id))
    if (!picked.length) continue
    const total = all.reduce((s, v) => s + v.weight, 0)
    const pickedWeight = picked.reduce((s, v) => s + v.weight, 0)
    share *= pickedWeight / total
    rpcMul *= picked.reduce((s, v) => s + v.rpcMul * v.weight, 0) / pickedWeight
  }
  return { share, rpcMul, signature: JSON.stringify(filters) }
}

/** One leaf strategy on one day */
function leafDay(leaf: string, date: string, impact: ReturnType<typeof filterImpact>): RawMetrics {
  const p = LEAF_PROFILES[leaf]
  const day = dayIndex(date)
  // Shared market trend: a roughly monthly wave plus a slower swell, so any range shows gentle waves
  const trend = 1 + 0.1 * Math.sin(day / 4.5) + 0.08 * Math.sin(day / 11)
  /**
   * Smooth per-strategy variation instead of random daily noise: two overlapping waves
   * (roughly 1 and 3 weeks long) with phases seeded per strategy, metric and filter set.
   * Curves stay realistic but read as clean trends rather than zigzags.
   */
  const wave = (tag: string, amp: number) => {
    const seed = `${leaf}:${tag}:${impact.signature}`
    const phaseA = randRange(`${seed}:a`, 0, Math.PI * 2)
    const phaseB = randRange(`${seed}:b`, 0, Math.PI * 2)
    return 1 + amp * (0.6 * Math.sin(day / 3.2 + phaseA) + 0.4 * Math.sin(day / 9.5 + phaseB))
  }

  const requests = Math.round(DAILY_REQUESTS * p.share * trend * impact.share * wave('req', 0.18))
  const wins = Math.round(requests * p.win * wave('win', 0.04))
  const clicks = Math.round(wins * p.ctr * wave('ctr', 0.06))
  const conversions = Math.round(clicks * p.cr * wave('cr', 0.1))
  const tac = clicks * p.tacCpc * wave('tac', 0.04)
  const gross = clicks * p.rpc * impact.rpcMul * wave('rpc', 0.05)
  const sales = conversions * p.aov * wave('aov', 0.06)
  return { requests, wins, clicks, conversions, tac, gross, sales }
}

// Small in-memory cache: warm serverless instances skip regenerating the same query.
const cache = new Map<string, Record<string, RawMetrics[]>>()

/** Daily metrics for every leaf strategy */
export function leafSeries(from: string, to: string, filters: Filters): { dates: string[]; leaves: Record<string, RawMetrics[]> } {
  const dates = dateRange(from, to)
  const key = `${from}|${to}|${JSON.stringify(filters)}`
  let leaves = cache.get(key)
  if (!leaves) {
    const impact = filterImpact(filters)
    leaves = Object.fromEntries(LEAF_IDS.map(leaf => [leaf, dates.map(d => leafDay(leaf, d, impact))]))
    if (cache.size > 50) cache.delete(cache.keys().next().value as string)
    cache.set(key, leaves)
  }
  return { dates, leaves }
}

/** Daily metrics for any node (leaf or group) */
function nodeSeries(nodeId: string, leaves: Record<string, RawMetrics[]>, days: number): RawMetrics[] {
  return Array.from({ length: days }, (_, i) => sum(NODE_LEAVES[nodeId].map(l => leaves[l][i])))
}

export function getSummary(from: string, to: string, filters: Filters): SummaryResponse {
  const { dates, leaves } = leafSeries(from, to, filters)
  const series = Object.fromEntries(Object.keys(NODE_LEAVES).map(id => [id, nodeSeries(id, leaves, dates.length)]))
  return { dates, series }
}

export function getPerformance(from: string, to: string, filters: Filters): PerformanceRow[] {
  const { leaves } = leafSeries(from, to, filters)
  const build = (node: StrategyNode): PerformanceRow => {
    const children = node.children?.map(build)
    const totals = children ? sum(children) : sum(leaves[node.id])
    return { id: node.id, name: node.name, ...totals, ...(children && { children }) }
  }
  return [build(STRATEGY_TREE)]
}

interface StrategyDataQuery {
  strategy: string
  granularity: Granularity
  view: DataView
  sort: string
  dir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export function getStrategyData(from: string, to: string, filters: Filters, q: StrategyDataQuery): StrategyDataResponse {
  const { dates, leaves } = leafSeries(from, to, filters)
  const daily = nodeSeries(q.strategy, leaves, dates.length)
  const totals = sum(daily)
  let rows: StrategyDataRow[]

  if (q.view === 'geo') {
    // split the period totals across countries by their traffic weight
    const selected = filters.country?.length ? DIMENSIONS.country.filter(c => filters.country!.includes(c.id)) : DIMENSIONS.country
    const weightSum = selected.reduce((s, c) => s + c.weight, 0)
    rows = selected.map(c => {
      const part = c.weight / weightSum
      const j = (tag: string) => randRange(`${q.strategy}:${c.id}:${tag}:${from}:${to}`, 0.92, 1.08)
      return {
        key: c.id,
        label: c.label,
        requests: Math.round(totals.requests * part * j('r')),
        wins: Math.round(totals.wins * part * j('w')),
        clicks: Math.round(totals.clicks * part * j('c')),
        conversions: Math.round(totals.conversions * part * j('v')),
        tac: totals.tac * part * j('t'),
        gross: totals.gross * part * c.rpcMul * j('g'),
        sales: totals.sales * part * j('s'),
      }
    })
  } else {
    const groups = new Map<string, StrategyDataRow>()
    dates.forEach((date, i) => {
      const key = q.granularity === 'day' ? date : q.granularity === 'week' ? weekStart(date) : monthKey(date)
      const label = q.granularity === 'day' ? dayLabel(key) : q.granularity === 'week' ? weekLabel(key) : monthLabel(key)
      const row = groups.get(key) ?? { key, label, ...emptyMetrics() }
      groups.set(key, addInto(row, daily[i]) as StrategyDataRow)
    })
    rows = [...groups.values()]
  }

  const dir = q.dir === 'asc' ? 1 : -1
  rows.sort((a, b) => {
    const av = q.sort in a ? a[q.sort as keyof StrategyDataRow] : a.key
    const bv = q.sort in b ? b[q.sort as keyof StrategyDataRow] : b.key
    return (av > bv ? 1 : av < bv ? -1 : 0) * dir
  })

  const total = rows.length
  const start = (q.page - 1) * q.pageSize
  return { rows: rows.slice(start, start + q.pageSize), total, page: q.page, pageSize: q.pageSize, totals }
}

export function getBuckets(from: string, to: string, filters: Filters): BucketsResponse {
  const { leaves } = leafSeries(from, to, filters)
  const smart = STRATEGY_TREE.children!.find(c => c.id === 'smart')!
  return {
    buckets: smart.children!.map(b => ({ id: b.id, name: b.name, color: b.color, ...sum(leaves[b.id]) })),
  }
}
