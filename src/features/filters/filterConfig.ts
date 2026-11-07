import type { FilterKey } from '../../../server/types'

export const FILTERS: { key: FilterKey; label: string; hint?: string }[] = [
  { key: 'publisher', label: 'Publisher' },
  { key: 'subId', label: 'Sub ID', hint: 'Choose at least one publisher to see its Sub IDs.' },
  { key: 'tag', label: 'Tag' },
  { key: 'brand', label: 'Brand' },
  { key: 'advertiser', label: 'Advertiser' },
  { key: 'campaign', label: 'Campaign' },
  { key: 'country', label: 'Country' },
  { key: 'opsAm', label: 'Ops Account Manager' },
  { key: 'bdAm', label: 'BD Account Manager' },
]

export const FILTER_LABEL = Object.fromEntries(FILTERS.map(f => [f.key, f.label])) as Record<FilterKey, string>
export const FILTER_KEYS = FILTERS.map(f => f.key)
