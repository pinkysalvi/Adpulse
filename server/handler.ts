// Framework-free request router, shared by the Netlify Function and the Vite dev server.

import type { DataView, FilterKey, FilterOptionsResponse, Filters, Granularity, MetaResponse } from './types'
import { DIMENSIONS, FILTER_KEYS } from './dimensions'
import { NODE_LEAVES } from './strategies'
import { addDays, isISODate, todayISO } from './dates'
import { getBuckets, getPerformance, getStrategyData, getSummary } from './data'

export interface ApiResult {
  status: number
  body: unknown
}

const ok = (body: unknown): ApiResult => ({ status: 200, body })
const fail = (status: number, error: string): ApiResult => ({ status, body: { error } })

const MAX_DAYS = 366

function parseFilters(params: URLSearchParams): Filters {
  const filters: Filters = {}
  for (const key of FILTER_KEYS) {
    const value = params.get(key)
    if (value) filters[key] = value.split(',').filter(Boolean).sort()
  }
  return filters
}

function parseRange(params: URLSearchParams): { from: string; to: string } | ApiResult {
  const max = todayISO()
  const min = addDays(max, -(MAX_DAYS - 1))
  const from = params.get('from')
  const to = params.get('to')
  if (!isISODate(from) || !isISODate(to)) return fail(400, 'Query params "from" and "to" must be YYYY-MM-DD dates')
  if (from > to) return fail(400, '"from" must be on or before "to"')
  return { from: from < min ? min : from, to: to > max ? max : to }
}

function filterOptions(key: FilterKey, params: URLSearchParams): FilterOptionsResponse {
  const search = (params.get('search') ?? '').trim().toLowerCase()
  let values = DIMENSIONS[key]
  if (key === 'subId') {
    const publishers = params.get('publishers')?.split(',').filter(Boolean) ?? []
    if (!publishers.length) return { options: [], needsPublisher: true }
    values = values.filter(v => v.publisherId && publishers.includes(v.publisherId))
  }
  return {
    options: values.filter(v => !search || v.label.toLowerCase().includes(search)).map(({ id, label }) => ({ id, label })),
  }
}

function meta(): MetaResponse {
  const now = new Date()
  const lastHour = (now.getUTCHours() + 23) % 24
  return {
    serverTime: now.toISOString(),
    lastProcessed: todayISO(),
    lastHour,
    minDate: addDays(todayISO(), -(MAX_DAYS - 1)),
    maxDate: todayISO(),
  }
}

export function handle(method: string, url: URL): ApiResult {
  if (method !== 'GET') return fail(405, 'Only GET is supported')

  const path = url.pathname.replace(/^\/api/, '').replace(/\/+$/, '') || '/'
  const params = url.searchParams

  if (path === '/meta') return ok(meta())

  const filterMatch = path.match(/^\/filters\/([a-zA-Z]+)$/)
  if (filterMatch) {
    const key = filterMatch[1] as FilterKey
    if (!FILTER_KEYS.includes(key)) return fail(404, `Unknown filter "${key}"`)
    return ok(filterOptions(key, params))
  }

  const range = parseRange(params)
  if ('status' in range) return range
  const { from, to } = range
  const filters = parseFilters(params)

  switch (path) {
    case '/summary':
      return ok(getSummary(from, to, filters))
    case '/performance':
      return ok({ rows: getPerformance(from, to, filters) })
    case '/buckets':
      return ok(getBuckets(from, to, filters))
    case '/strategy-data': {
      const strategy = params.get('strategy') ?? 'all'
      if (!NODE_LEAVES[strategy]) return fail(404, `Unknown strategy "${strategy}"`)
      const granularity = (['day', 'week', 'month'].includes(params.get('granularity') ?? '') ? params.get('granularity') : 'day') as Granularity
      const view = (params.get('view') === 'geo' ? 'geo' : 'date') as DataView
      const pageSize = Math.min(Math.max(Number(params.get('pageSize')) || 25, 1), 500)
      const page = Math.max(Number(params.get('page')) || 1, 1)
      return ok(
        getStrategyData(from, to, filters, {
          strategy,
          granularity,
          view,
          sort: params.get('sort') ?? 'key',
          dir: params.get('dir') === 'asc' ? 'asc' : 'desc',
          page,
          pageSize,
        }),
      )
    }
    default:
      return fail(404, `No endpoint at ${url.pathname}`)
  }
}
