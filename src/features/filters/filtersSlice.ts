import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FilterKey, Filters } from '../../../server/types'
import { addDays, todayISO } from '../../utils/dates'

export interface FiltersState {
  from: string
  to: string
  applied: Filters
}

export const defaultFiltersState = (): FiltersState => ({
  from: addDays(todayISO(), -29),
  to: todayISO(),
  applied: {},
})

const filtersSlice = createSlice({
  name: 'filters',
  initialState: defaultFiltersState,
  reducers: {
    setDateRange(state, action: PayloadAction<{ from: string; to: string }>) {
      state.from = action.payload.from
      state.to = action.payload.to
    },
    applyFilters(state, action: PayloadAction<Filters>) {
      // drop empty lists so URLs and cache keys stay clean
      state.applied = Object.fromEntries(Object.entries(action.payload).filter(([, ids]) => ids?.length))
    },
    removeFilterValue(state, action: PayloadAction<{ key: FilterKey; id: string }>) {
      const { key, id } = action.payload
      const next = (state.applied[key] ?? []).filter(v => v !== id)
      if (next.length) state.applied[key] = next
      else delete state.applied[key]
      // Sub IDs belong to publishers: without publishers they no longer apply
      if (key === 'publisher' && !state.applied.publisher) delete state.applied.subId
    },
    clearFilters(state) {
      state.applied = {}
    },
  },
})

export const { setDateRange, applyFilters, removeFilterValue, clearFilters } = filtersSlice.actions
export default filtersSlice.reducer
