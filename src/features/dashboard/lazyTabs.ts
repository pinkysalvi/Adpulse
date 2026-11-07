import { lazy } from 'react'

// Each tab is its own chunk. The loaders are exported so tabs can be
// preloaded on hover before the user clicks.
export const loadSummaryTab = () => import('../summary/SummaryTab')
export const loadStrategyTab = () => import('../strategy/StrategyDataTab')
export const loadBucketsTab = () => import('../buckets/BucketsTab')

export const SummaryTab = lazy(loadSummaryTab)
export const StrategyDataTab = lazy(loadStrategyTab)
export const BucketsTab = lazy(loadBucketsTab)
