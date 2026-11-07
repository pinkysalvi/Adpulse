import { Suspense, lazy, useCallback, useState } from 'react'
import { useAppSelector } from './app/store'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { FilterIcon } from './components/icons'
import { Skeleton } from './components/ui/States'
import { DateRangePicker } from './features/filters/DateRangePicker'
import { AppliedFilters } from './features/filters/AppliedFilters'
import { Tabs } from './features/dashboard/Tabs'
import { BucketsTab, StrategyDataTab, SummaryTab } from './features/dashboard/lazyTabs'

// Each tab, and panels the user may never open, are loaded on demand
const FilterDrawer = lazy(() => import('./features/filters/FilterDrawer'))
const HelpDrawer = lazy(() => import('./features/help/HelpDrawer'))

function TabFallback() {
  return (
    <div className="card space-y-4 p-6">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-64" />
    </div>
  )
}

export default function App() {
  const tab = useAppSelector(s => s.dashboard.tab)
  const filterCount = useAppSelector(s => Object.values(s.filters.applied).reduce((n, ids) => n + (ids?.length ?? 0), 0))
  const [panel, setPanel] = useState<'filters' | 'help' | null>(null)
  const closePanel = useCallback(() => setPanel(null), [])

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#tab-panel" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Header onOpenHelp={() => setPanel('help')} />

      <main className="mx-auto w-full max-w-[1680px] flex-1 space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bid Strategy Performance</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Publisher traffic, TAC and revenue by bidding strategy.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" onClick={() => setPanel('filters')} aria-haspopup="dialog">
              <FilterIcon className="text-slate-400" />
              Filters
              {filterCount > 0 && <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[11px] leading-none text-white">{filterCount}</span>}
            </button>
            <DateRangePicker />
          </div>
        </div>

        <AppliedFilters />
        <Tabs />

        <section id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          <Suspense fallback={<TabFallback />}>
            {tab === 'summary' && <SummaryTab />}
            {tab === 'strategy' && <StrategyDataTab />}
            {tab === 'buckets' && <BucketsTab />}
          </Suspense>
        </section>
      </main>

      <Footer />

      <Suspense fallback={null}>
        {panel === 'filters' && <FilterDrawer onClose={closePanel} />}
        {panel === 'help' && <HelpDrawer onClose={closePanel} />}
      </Suspense>
    </div>
  )
}
