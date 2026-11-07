import { useId, useState } from 'react'
import type { FilterKey } from '../../../server/types'
import { useGetFilterOptionsQuery } from '../../app/api'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { ChevronDownIcon, SearchIcon } from '../../components/icons'
import { Skeleton } from '../../components/ui/States'

interface FilterSectionProps {
  filterKey: FilterKey
  label: string
  hint?: string
  selected: string[]
  onChange: (ids: string[]) => void
  /** for Sub ID: options depend on the chosen publishers */
  publishers?: string[]
}

/** One collapsible multi-select inside the filter drawer. Options are only fetched once it is opened. */
export function FilterSection({ filterKey, label, hint, selected, onChange, publishers }: FilterSectionProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const listId = useId()

  const { data, isFetching, isError, refetch } = useGetFilterOptionsQuery(
    { key: filterKey, search: debouncedSearch, publishers },
    { skip: !open },
  )
  const options = data?.options ?? []
  const allVisibleSelected = options.length > 0 && options.every(o => selected.includes(o.id))

  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id])
  const selectAllVisible = () => onChange([...new Set([...selected, ...options.map(o => o.id)])])

  return (
    <div className="border-b border-slate-200 last:border-0 dark:border-slate-800">
      <button
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(o => !o)}
      >
        <span>
          {label}
          {selected.length > 0 && (
            <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDownIcon className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div id={listId} className="pb-4">
          {data?.needsPublisher ? (
            <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">{hint}</p>
          ) : (
            <>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
                <input
                  className="input pl-9"
                  placeholder={`Search ${label.toLowerCase()}`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label={`Search ${label}`}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <button className="font-medium text-indigo-600 disabled:opacity-40 dark:text-indigo-400" disabled={!options.length || allVisibleSelected} onClick={selectAllVisible}>
                  Select all{debouncedSearch ? ' results' : ''}
                </button>
                <button className="text-slate-500 disabled:opacity-40 dark:text-slate-400" disabled={!selected.length} onClick={() => onChange([])}>
                  Clear
                </button>
              </div>

              <ul className="scroll-thin mt-2 max-h-52 overflow-y-auto" role="listbox" aria-multiselectable="true" aria-label={label}>
                {isFetching && !options.length ? (
                  [0, 1, 2, 3].map(i => <Skeleton key={i} className="my-2 h-5" />)
                ) : isError ? (
                  <li className="py-3 text-sm text-rose-600">
                    Couldn’t load options.{' '}
                    <button className="underline" onClick={() => refetch()}>
                      Retry
                    </button>
                  </li>
                ) : options.length === 0 ? (
                  <li className="py-6 text-center text-sm text-slate-500">
                    No results found{debouncedSearch && ` for “${debouncedSearch}”`}.
                  </li>
                ) : (
                  options.map(o => (
                    <li key={o.id} role="option" aria-selected={selected.includes(o.id)}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={selected.includes(o.id)} onChange={() => toggle(o.id)} />
                        {o.label}
                      </label>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
