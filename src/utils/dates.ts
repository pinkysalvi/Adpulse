// Client date helpers. The API works in UTC 'YYYY-MM-DD', so the client does too.

const DAY = 86_400_000

export const todayISO = () => new Date().toISOString().slice(0, 10)
export const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10)
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY) + 1

const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const fmtShort = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
export const formatDate = (iso: string) => fmt.format(new Date(`${iso}T00:00:00Z`))
export const formatDateShort = (iso: string) => fmtShort.format(new Date(`${iso}T00:00:00Z`))

export interface DatePreset {
  id: string
  label: string
  range: () => { from: string; to: string }
}

export const DATE_PRESETS: DatePreset[] = [
  { id: 'today', label: 'Today', range: () => ({ from: todayISO(), to: todayISO() }) },
  { id: '7d', label: 'Last 7 days', range: () => ({ from: addDays(todayISO(), -6), to: todayISO() }) },
  { id: '30d', label: 'Last 30 days', range: () => ({ from: addDays(todayISO(), -29), to: todayISO() }) },
  { id: '90d', label: 'Last 90 days', range: () => ({ from: addDays(todayISO(), -89), to: todayISO() }) },
  {
    id: 'month',
    label: 'This month',
    range: () => ({ from: `${todayISO().slice(0, 7)}-01`, to: todayISO() }),
  },
  { id: '12m', label: 'Last 12 months', range: () => ({ from: addDays(todayISO(), -364), to: todayISO() }) },
]
