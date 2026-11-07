import { useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ExpandedState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import type { PerformanceRow } from '../../../server/types'
import { ChevronRightIcon, ColumnsIcon, DownloadIcon, SortIcon } from '../../components/icons'
import { useDismiss } from '../../hooks/useDismiss'
import { csvNumber, downloadCsv } from '../../utils/csv'
import { formatValue } from '../../utils/format'
import { METRICS } from '../../utils/metrics'
import { NODE_COLOR } from '../../utils/tree'

interface PerformanceTableProps {
  rows: PerformanceRow[]
  fileName: string
}

export function PerformanceTable({ rows, fileName }: PerformanceTableProps) {
  const root = rows[0]
  const [expanded, setExpanded] = useState<ExpandedState>(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // TanStack Table needs stable column definitions
  const columns = useMemo<ColumnDef<PerformanceRow>[]>(
    () => [
      {
        id: 'name',
        header: 'Strategy',
        accessorKey: 'name',
        enableHiding: false,
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-1.5" style={{ paddingLeft: row.depth * 20 }}>
            {row.getCanExpand() ? (
              <button
                className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                onClick={row.getToggleExpandedHandler()}
                aria-label={`${row.getIsExpanded() ? 'Collapse' : 'Expand'} ${getValue<string>()}`}
                aria-expanded={row.getIsExpanded()}
              >
                <ChevronRightIcon className={`transition-transform ${row.getIsExpanded() ? 'rotate-90' : ''}`} />
              </button>
            ) : (
              <span className="w-5" />
            )}
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: NODE_COLOR[row.original.id] }} />
            <span className={row.depth === 0 ? 'font-semibold' : row.getCanExpand() ? 'font-medium' : ''}>{getValue<string>()}</span>
          </div>
        ),
      },
      ...METRICS.map<ColumnDef<PerformanceRow>>(m => ({
        id: m.key,
        header: m.label,
        accessorFn: row => m.value(row, root),
        sortDescFirst: true,
        cell: info => {
          const v = info.getValue<number>()
          return <span className={m.key === 'net' && v < 0 ? 'text-rose-600 dark:text-rose-400' : ''}>{formatValue(v, m.format)}</span>
        },
      })),
    ],
    [root],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { expanded, sorting, columnVisibility },
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getSubRows: r => r.children,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const exportCsv = () => {
    const cols = table.getVisibleLeafColumns()
    const flat = table.getCoreRowModel().flatRows
    downloadCsv(
      fileName,
      cols.map(c => String(c.columnDef.header)),
      flat.map(r => cols.map(c => (c.id === 'name' ? `${'  '.repeat(r.depth)}${r.original.name}` : csvNumber(r.getValue<number>(c.id))))),
    )
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Performance by strategy</h2>
        <div className="flex gap-2">
          <ColumnMenu table={table} />
          <button className="btn-secondary py-1.5" onClick={exportCsv}>
            <DownloadIcon /> Export CSV
          </button>
        </div>
      </div>

      <div className="scroll-thin overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="data-table">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map((h, i) => {
                  const sorted = h.column.getIsSorted()
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : 'none'}
                      className={`sticky top-0 z-10 ${i === 0 ? 'left-0 z-20 min-w-64 text-left' : 'text-right'}`}
                    >
                      <button className={`inline-flex items-center gap-1 ${i === 0 ? '' : 'flex-row-reverse'}`} onClick={h.column.getToggleSortingHandler()}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        <SortIcon dir={sorted} className="text-slate-400" />
                      </button>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className={`group ${row.depth === 0 ? 'font-semibold' : ''}`}>
                {row.getVisibleCells().map((cell, i) => (
                  <td
                    key={cell.id}
                    className={
                      i === 0
                        ? 'sticky left-0 bg-white text-left group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800'
                        : 'text-right text-slate-700 dark:text-slate-300'
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ColumnMenu({ table }: { table: ReturnType<typeof useReactTable<PerformanceRow>> }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useDismiss(ref, open, () => setOpen(false))
  const hideable = table.getAllLeafColumns().filter(c => c.getCanHide())

  return (
    <div ref={ref} className="relative">
      <button className="btn-secondary py-1.5" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <ColumnsIcon /> Columns
      </button>
      {open && (
        <div className="card absolute right-0 z-30 mt-2 w-56 p-2 shadow-lg">
          <div className="scroll-thin max-h-72 overflow-y-auto">
            {hideable.map(c => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={c.getIsVisible()} onChange={c.getToggleVisibilityHandler()} />
                {String(c.columnDef.header)}
              </label>
            ))}
          </div>
          <button className="mt-1 w-full rounded px-2 py-1.5 text-left text-xs font-medium text-indigo-600 hover:bg-slate-50 dark:text-indigo-400 dark:hover:bg-slate-800" onClick={() => table.resetColumnVisibility()}>
            Show all columns
          </button>
        </div>
      )}
    </div>
  )
}
