import type { KeyboardEvent } from 'react'
import { api } from '../../app/api'
import { useAppDispatch, useAppSelector, useRangeArgs } from '../../app/store'
import { setTab, type TabId } from './dashboardSlice'
import { loadBucketsTab, loadStrategyTab } from './lazyTabs'

const TABS: { id: TabId; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'strategy', label: 'Strategy Data' },
  { id: 'buckets', label: 'Bucket Analysis' },
]

export function Tabs() {
  const dispatch = useAppDispatch()
  const tab = useAppSelector(s => s.dashboard.tab)
  const strategyQuery = useAppSelector(s => s.dashboard)
  const range = useRangeArgs()
  const prefetchStrategy = api.usePrefetch('getStrategyData')
  const prefetchBuckets = api.usePrefetch('getBuckets')

  // warm up the tab's code and data when the user shows intent (hover / focus)
  const prefetch = (id: TabId) => {
    if (id === 'strategy') {
      loadStrategyTab()
      const { strategy, granularity, view, sort, dir, page, pageSize } = strategyQuery
      prefetchStrategy({ ...range, strategy, granularity, view, sort, dir, page, pageSize })
    }
    if (id === 'buckets') {
      loadBucketsTab()
      prefetchBuckets(range)
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = TABS.findIndex(t => t.id === tab)
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]
    dispatch(setTab(next.id))
    document.getElementById(`tab-${next.id}`)?.focus()
  }

  return (
    <div role="tablist" aria-label="Dashboard views" className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800" onKeyDown={onKeyDown}>
      {TABS.map(t => (
        <button
          key={t.id}
          id={`tab-${t.id}`}
          role="tab"
          aria-selected={tab === t.id}
          aria-controls="tab-panel"
          tabIndex={tab === t.id ? 0 : -1}
          onClick={() => dispatch(setTab(t.id))}
          onMouseEnter={() => prefetch(t.id)}
          onFocus={() => prefetch(t.id)}
          className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
            tab === t.id
              ? 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
