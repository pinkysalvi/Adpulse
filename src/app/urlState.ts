// Keeps the date range, filters and main view settings in the URL,
// so any dashboard view can be bookmarked or shared.

import type { Filters } from '../../server/types'
import { defaultDashboardState, type DashboardState, type TabId } from '../features/dashboard/dashboardSlice'
import { defaultFiltersState, type FiltersState } from '../features/filters/filtersSlice'
import { FILTER_KEYS } from '../features/filters/filterConfig'
import { METRIC_BY_KEY, type MetricKey } from '../utils/metrics'

const isDate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
const TABS: TabId[] = ['summary', 'strategy', 'buckets']

export function readUrlState(search: string): { filters: FiltersState; dashboard: DashboardState } {
  const p = new URLSearchParams(search)
  const filters = defaultFiltersState()
  const dashboard = defaultDashboardState()

  const from = p.get('from')
  const to = p.get('to')
  if (isDate(from) && isDate(to) && from <= to) Object.assign(filters, { from, to })

  const applied: Filters = {}
  for (const key of FILTER_KEYS) {
    const ids = p.get(key)?.split(',').filter(Boolean)
    if (ids?.length) applied[key] = ids
  }
  filters.applied = applied

  const tab = p.get('tab') as TabId | null
  if (tab && TABS.includes(tab)) dashboard.tab = tab
  const metric = p.get('metric') as MetricKey | null
  if (metric && METRIC_BY_KEY[metric]) dashboard.primaryMetric = metric
  const compare = p.get('compare')
  if (compare === 'none') dashboard.compareMetric = null
  else if (compare && METRIC_BY_KEY[compare as MetricKey]) dashboard.compareMetric = compare as MetricKey

  return { filters, dashboard }
}

export function writeUrlState(filters: FiltersState, dashboard: DashboardState) {
  const p = new URLSearchParams()
  p.set('from', filters.from)
  p.set('to', filters.to)
  for (const [key, ids] of Object.entries(filters.applied)) if (ids?.length) p.set(key, ids.join(','))
  if (dashboard.tab !== 'summary') p.set('tab', dashboard.tab)
  if (dashboard.primaryMetric !== 'gross') p.set('metric', dashboard.primaryMetric)
  if (dashboard.compareMetric !== 'tac') p.set('compare', dashboard.compareMetric ?? 'none')

  const next = `?${p.toString().replace(/%2C/g, ',')}`
  if (next !== window.location.search) window.history.replaceState(null, '', next)
}
