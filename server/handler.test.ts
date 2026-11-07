import { describe, expect, it } from 'vitest'
import { handle } from './handler'
import { addDays, todayISO } from './dates'
import type { PerformanceResponse, StrategyDataResponse } from './types'

const to = todayISO()
const from = addDays(to, -29)
const get = (path: string) => handle('GET', new URL(`http://test${path}`))

describe('API handler', () => {
  it('returns the same numbers for the same query', () => {
    const a = get(`/api/performance?from=${from}&to=${to}`)
    const b = get(`/api/performance?from=${from}&to=${to}`)
    expect(a.body).toEqual(b.body)
  })

  it('makes parent rows the sum of their children', () => {
    const { rows } = get(`/api/performance?from=${from}&to=${to}`).body as PerformanceResponse
    const root = rows[0]
    const childRequests = root.children!.reduce((s, c) => s + c.requests, 0)
    expect(root.requests).toBe(childRequests)
  })

  it('shrinks traffic when a filter is applied', () => {
    const all = (get(`/api/performance?from=${from}&to=${to}`).body as PerformanceResponse).rows[0]
    const one = (get(`/api/performance?from=${from}&to=${to}&publisher=pub-1`).body as PerformanceResponse).rows[0]
    expect(one.requests).toBeLessThan(all.requests)
    expect(one.requests).toBeGreaterThan(0)
  })

  it('needs a publisher before listing Sub IDs', () => {
    expect(get('/api/filters/subId').body).toEqual({ options: [], needsPublisher: true })
    const { options } = get('/api/filters/subId?publishers=pub-1').body as { options: unknown[] }
    expect(options.length).toBeGreaterThan(0)
  })

  it('paginates strategy data', () => {
    const res = get(`/api/strategy-data?from=${from}&to=${to}&pageSize=10&page=2`).body as StrategyDataResponse
    expect(res.total).toBe(30)
    expect(res.rows).toHaveLength(10)
    expect(res.page).toBe(2)
  })

  it('rejects bad dates', () => {
    expect(get('/api/summary?from=yesterday&to=today').status).toBe(400)
  })
})
