import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import { api } from './api'
import filters from '../features/filters/filtersSlice'
import dashboard from '../features/dashboard/dashboardSlice'
import { readUrlState, writeUrlState } from './urlState'

export const store = configureStore({
  reducer: { filters, dashboard, [api.reducerPath]: api.reducer },
  preloadedState: readUrlState(window.location.search),
  middleware: getDefault => getDefault().concat(api.middleware),
})

// mirror filters and view settings into the URL whenever they change
let previous = store.getState()
store.subscribe(() => {
  const state = store.getState()
  if (state.filters !== previous.filters || state.dashboard !== previous.dashboard) writeUrlState(state.filters, state.dashboard)
  previous = state
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()

/** Date range + applied filters: the arguments every data query shares */
export const useRangeArgs = () => {
  const from = useAppSelector(s => s.filters.from)
  const to = useAppSelector(s => s.filters.to)
  const filters = useAppSelector(s => s.filters.applied)
  return { from, to, filters }
}
