import type { FilterKey } from '../../../server/types'
import { useGetFilterOptionsQuery } from '../../app/api'
import { useAppDispatch, useAppSelector } from '../../app/store'
import { CloseIcon } from '../../components/icons'
import { FILTER_LABEL, FILTER_KEYS } from './filterConfig'
import { clearFilters, removeFilterValue } from './filtersSlice'

function FilterChips({ filterKey, ids }: { filterKey: FilterKey; ids: string[] }) {
  const dispatch = useAppDispatch()
  const publishers = useAppSelector(s => s.filters.applied.publisher)
  // labels come from the (cached) options endpoint; ids are what the URL stores
  const { data } = useGetFilterOptionsQuery({ key: filterKey, publishers: filterKey === 'subId' ? publishers : undefined })
  const labelOf = (id: string) => data?.options.find(o => o.id === id)?.label ?? id

  return (
    <>
      {ids.map(id => (
        <span
          key={id}
          className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 py-0.5 pr-1 pl-2.5 text-xs text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200"
        >
          <span className="text-indigo-500 dark:text-indigo-400">{FILTER_LABEL[filterKey]}:</span> {labelOf(id)}
          <button
            className="grid h-5 w-5 place-items-center rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
            aria-label={`Remove ${FILTER_LABEL[filterKey]} ${labelOf(id)}`}
            onClick={() => dispatch(removeFilterValue({ key: filterKey, id }))}
          >
            <CloseIcon className="h-3 w-3" />
          </button>
        </span>
      ))}
    </>
  )
}

export function AppliedFilters() {
  const dispatch = useAppDispatch()
  const applied = useAppSelector(s => s.filters.applied)
  const keys = FILTER_KEYS.filter(k => applied[k]?.length)
  if (!keys.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Applied filters">
      {keys.map(k => (
        <FilterChips key={k} filterKey={k} ids={applied[k]!} />
      ))}
      <button className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100" onClick={() => dispatch(clearFilters())}>
        Clear all
      </button>
    </div>
  )
}
