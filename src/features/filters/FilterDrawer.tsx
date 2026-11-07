import { useState } from 'react'
import type { FilterKey, Filters } from '../../../server/types'
import { useAppDispatch, useAppSelector } from '../../app/store'
import { Drawer } from '../../components/ui/Drawer'
import { FILTERS } from './filterConfig'
import { FilterSection } from './FilterSection'
import { applyFilters } from './filtersSlice'

/** Sub ID ids look like "sub-<publisherIndex>-<n>"; the publisher id is "pub-<publisherIndex>". */
const publisherOfSubId = (subId: string) => `pub-${subId.split('-')[1]}`

/**
 * Filters are edited as a draft and only applied on "Apply",
 * so the dashboard doesn't refetch on every checkbox click.
 */
export default function FilterDrawer({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch()
  const applied = useAppSelector(s => s.filters.applied)
  const [draft, setDraft] = useState<Filters>(applied)

  const setKey = (key: FilterKey, ids: string[]) =>
    setDraft(d => {
      const next = { ...d, [key]: ids }
      // keep only Sub IDs whose publisher is still selected
      if (key === 'publisher') next.subId = (d.subId ?? []).filter(s => ids.includes(publisherOfSubId(s)))
      return next
    })

  const selectedCount = Object.values(draft).reduce((n, ids) => n + (ids?.length ?? 0), 0)

  return (
    <Drawer
      title="Filters"
      onClose={onClose}
      footer={close => (
        <div className="flex items-center justify-between gap-2">
          <button className="btn-ghost" disabled={!selectedCount} onClick={() => setDraft({})}>
            Clear all
          </button>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={close}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                // apply now so the dashboard starts loading while the drawer slides away
                dispatch(applyFilters(draft))
                close()
              }}
            >
              Apply{selectedCount ? ` (${selectedCount})` : ''}
            </button>
          </div>
        </div>
      )}
    >
      {FILTERS.map(f => (
        <FilterSection
          key={f.key}
          filterKey={f.key}
          label={f.label}
          hint={f.hint}
          selected={draft[f.key] ?? []}
          onChange={ids => setKey(f.key, ids)}
          publishers={f.key === 'subId' ? (draft.publisher ?? []) : undefined}
        />
      ))}
    </Drawer>
  )
}
