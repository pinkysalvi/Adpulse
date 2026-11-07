import { useEffect, useState } from 'react'
import { useGetMetaQuery } from '../../app/api'
import { formatDate } from '../../utils/dates'
import { ClockIcon } from '../icons'

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZone: 'UTC',
})

/** Live server clock: uses the offset between server time and this device's clock. */
function useServerClock(serverTime?: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    if (serverTime) setOffset(Date.parse(serverTime) - Date.now())
  }, [serverTime])
  return serverTime ? new Date(now + offset) : null
}

export function Footer() {
  const { data } = useGetMetaQuery()
  const serverNow = useServerClock(data?.serverTime)

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-2 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-slate-400">
        <p>© {new Date().getFullYear()} AdPulse · Demo project with simulated data</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon /> Server time (UTC): {serverNow ? timeFmt.format(serverNow) : '—'}
          </span>
          <span>
            Last stats processed: {data ? `${formatDate(data.lastProcessed)}, ${String(data.lastHour).padStart(2, '0')}:00` : '—'}
          </span>
        </div>
      </div>
    </footer>
  )
}
