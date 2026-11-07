import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { DataView, Granularity } from '../../../server/types'
import type { MetricKey } from '../../utils/metrics'

export type TabId = 'summary' | 'strategy' | 'buckets'

export interface DashboardState {
  tab: TabId
  primaryMetric: MetricKey
  compareMetric: MetricKey | null
  /** strategy node ids hidden from the chart */
  hidden: string[]
  strategy: string
  granularity: Granularity
  view: DataView
  sort: string
  dir: 'asc' | 'desc'
  page: number
  pageSize: number
}

export const defaultDashboardState = (): DashboardState => ({
  tab: 'summary',
  primaryMetric: 'gross',
  compareMetric: 'tac',
  hidden: [],
  strategy: 'all',
  granularity: 'day',
  view: 'date',
  sort: 'key',
  dir: 'desc',
  page: 1,
  pageSize: 25,
})

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: defaultDashboardState,
  reducers: {
    setTab(state, action: PayloadAction<TabId>) {
      state.tab = action.payload
    },
    setPrimaryMetric(state, action: PayloadAction<MetricKey>) {
      state.primaryMetric = action.payload
      if (state.compareMetric === action.payload) state.compareMetric = null
    },
    setCompareMetric(state, action: PayloadAction<MetricKey | null>) {
      state.compareMetric = action.payload
    },
    toggleHidden(state, action: PayloadAction<string[]>) {
      // the first id is the clicked node; the rest are its descendants
      const [id, ...descendants] = action.payload
      if (state.hidden.includes(id)) {
        state.hidden = state.hidden.filter(h => h !== id && !descendants.includes(h))
      } else {
        state.hidden = [...new Set([...state.hidden, id, ...descendants])]
      }
    },
    showAll(state) {
      state.hidden = []
    },
    setStrategyQuery(
      state,
      action: PayloadAction<Partial<Pick<DashboardState, 'strategy' | 'granularity' | 'view' | 'pageSize'>>>,
    ) {
      Object.assign(state, action.payload)
      state.page = 1
      if (action.payload.view === 'geo' && state.sort === 'key') state.sort = 'gross'
    },
    setSort(state, action: PayloadAction<string>) {
      if (state.sort === action.payload) state.dir = state.dir === 'asc' ? 'desc' : 'asc'
      else {
        state.sort = action.payload
        state.dir = 'desc'
      }
      state.page = 1
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload
    },
  },
})

export const { setTab, setPrimaryMetric, setCompareMetric, toggleHidden, showAll, setStrategyQuery, setSort, setPage } =
  dashboardSlice.actions
export default dashboardSlice.reducer
