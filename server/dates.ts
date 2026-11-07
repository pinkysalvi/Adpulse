// UTC date helpers working with 'YYYY-MM-DD' strings.

const DAY = 86_400_000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const isISODate = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))

export const toISO = (d: Date): string => d.toISOString().slice(0, 10)

export const parseISO = (s: string): Date => new Date(`${s}T00:00:00Z`)

export const addDays = (s: string, n: number): string => toISO(new Date(parseISO(s).getTime() + n * DAY))

export const todayISO = (): string => toISO(new Date())

export function dateRange(from: string, to: string): string[] {
  const out: string[] = []
  for (let t = parseISO(from).getTime(), end = parseISO(to).getTime(); t <= end; t += DAY) out.push(toISO(new Date(t)))
  return out
}

/** Monday of the week containing the date */
export function weekStart(s: string): string {
  const d = parseISO(s)
  const dow = (d.getUTCDay() + 6) % 7
  return addDays(s, -dow)
}

export const monthKey = (s: string): string => s.slice(0, 7)

export const dayLabel = (s: string): string => {
  const d = parseISO(s)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export const weekLabel = (s: string): string => `Week of ${dayLabel(s)}`

export const monthLabel = (key: string): string => `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`

export const dayOfWeek = (s: string): number => parseISO(s).getUTCDay()

export const dayIndex = (s: string): number => Math.floor(parseISO(s).getTime() / DAY)
