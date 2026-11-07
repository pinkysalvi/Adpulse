export interface TooltipRow {
  id: string
  name: string
  color: string
  value: string
  /** parent rows (All traffic, groups) are shown in bold */
  strong?: boolean
}

export interface TooltipSection {
  title: string
  dashed?: boolean
  rows: TooltipRow[]
}

interface ChartTooltipProps {
  title: string
  sections: TooltipSection[]
  /** x position of the hovered point inside the chart container */
  x: number
  /** which side of the point the panel opens on, so it never runs off the chart */
  side: 'left' | 'right'
}

/** Rich hover panel for the trend chart: one block per metric, rows in two columns. */
export function ChartTooltip({ title, sections, x, side }: ChartTooltipProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-2 z-10 w-max max-w-[560px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900"
      style={{ left: x, transform: side === 'right' ? 'translateX(16px)' : 'translateX(calc(-100% - 16px))' }}
    >
      <p className="mb-3 text-sm font-semibold">{title}</p>
      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.title}>
            <p className="mb-2 border-b border-slate-100 pb-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase dark:border-slate-800 dark:text-slate-500">
              {section.title}
            </p>
            {/* fill top-to-bottom, then the second column */}
            <ul
              className="grid grid-flow-col grid-cols-2 gap-x-8 gap-y-1.5"
              style={{ gridTemplateRows: `repeat(${Math.ceil(section.rows.length / 2)}, auto)` }}
            >
              {section.rows.map(row => (
                <li key={row.id} className="flex items-center gap-2.5 text-[13px]">
                  <span
                    className={`w-4 shrink-0 border-t-2 ${section.dashed ? 'border-dashed' : ''}`}
                    style={{ borderColor: row.color }}
                  />
                  <span className={`truncate text-slate-600 dark:text-slate-300 ${row.strong ? 'font-medium text-slate-800 dark:text-slate-100' : ''}`}>
                    {row.name}
                  </span>
                  <span className="ml-auto pl-4 font-semibold whitespace-nowrap tabular-nums">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
