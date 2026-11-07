import { useCallback, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/store'
import { useGetMetaQuery } from '../../app/api'
import { useDismiss } from '../../hooks/useDismiss'
import { DATE_PRESETS, addDays, daysBetween, formatDate, todayISO } from '../../utils/dates'
import { CalendarIcon, ChevronDownIcon } from '../../components/icons'
import { setDateRange } from './filtersSlice'

const MAX_DAYS = 366

export function DateRangePicker() {
  const dispatch = useAppDispatch()
  const { from, to } = useAppSelector(s => s.filters)
  const { data: meta } = useGetMetaQuery()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ from, to })
  const ref = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)

  const minDate = meta?.minDate ?? addDays(todayISO(), -(MAX_DAYS - 1))
  const maxDate = meta?.maxDate ?? todayISO()
  const activePreset = DATE_PRESETS.find(p => {
    const r = p.range()
    return r.from === from && r.to === to
  })

  const error =
    !draft.from || !draft.to
      ? 'Choose both dates.'
      : draft.from > draft.to
        ? 'Start date must be before end date.'
        : daysBetween(draft.from, draft.to) > MAX_DAYS
          ? 'Choose a range of up to 12 months.'
          : null

  const apply = (range: { from: string; to: string }) => {
    dispatch(setDateRange(range))
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        className="btn-secondary"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setDraft({ from, to })
          setOpen(o => !o)
        }}
      >
        <CalendarIcon className="text-slate-400" />
        <span className="hidden sm:inline">{activePreset ? `${activePreset.label}: ` : ''}</span>
        {formatDate(from)} – {formatDate(to)}
        <ChevronDownIcon className="text-slate-400" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose date range"
          className="card absolute right-0 z-40 mt-2 flex w-[min(92vw,520px)] flex-col overflow-hidden shadow-lg sm:flex-row"
        >
          <ul className="flex shrink-0 flex-row flex-wrap gap-1 border-b border-slate-200 p-2 sm:w-44 sm:flex-col sm:border-r sm:border-b-0 dark:border-slate-800">
            {DATE_PRESETS.map(p => (
              <li key={p.id}>
                <button
                  className={`w-full rounded-md px-3 py-1.5 text-left text-sm ${
                    activePreset?.id === p.id
                      ? 'bg-indigo-50 font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => apply(p.range())}
                >
                  {p.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <p className="label">Custom range</p>
            <label className="grid gap-1 text-sm">
              From
              <input type="date" className="input" min={minDate} max={maxDate} value={draft.from} onChange={e => setDraft(d => ({ ...d, from: e.target.value }))} />
            </label>
            <label className="grid gap-1 text-sm">
              To
              <input type="date" className="input" min={minDate} max={maxDate} value={draft.to} onChange={e => setDraft(d => ({ ...d, to: e.target.value }))} />
            </label>
            {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
            <div className="mt-auto flex justify-end gap-2 pt-2">
              <button className="btn-ghost" onClick={close}>
                Cancel
              </button>
              <button className="btn-primary" disabled={!!error} onClick={() => apply(draft)}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
