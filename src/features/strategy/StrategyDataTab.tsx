import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { DataView, Granularity, RawMetrics, StrategyDataRow } from '../../../server/types'
import { useGetStrategyDataQuery } from '../../app/api'
import { useAppDispatch, useAppSelector, useRangeArgs } from '../../app/store'
import { DownloadIcon, SortIcon } from '../../components/icons'
import { Segmented } from '../../components/ui/Segmented'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States'
import { csvNumber, downloadCsv } from '../../utils/csv'
import { formatValue } from '../../utils/format'
import { METRICS } from '../../utils/metrics'
import { FLAT_NODES, NODE_NAME } from '../../utils/tree'
import { setPage, setSort, setStrategyQuery } from '../dashboard/dashboardSlice'

const COLUMNS = METRICS.filter(m => m.key !== 'requestShare')
// the API sorts on stored totals; ratios are derived on the client so aren't server-sortable
const SORTABLE = new Set(['key', 'requests', 'clicks', 'tac', 'conversions', 'gross', 'sales'])
const PAGE_SIZES = [25, 50, 100, 500]
const ROW_HEIGHT = 45 // py-3 cell padding + one text line + 1px border

export default function StrategyDataTab() {
  const dispatch = useAppDispatch()
  const range = useRangeArgs()
  const { strategy, granularity, view, sort, dir, page, pageSize } = useAppSelector(s => s.dashboard)
  const query = useGetStrategyDataQuery({ ...range, strategy, granularity, view, sort, dir, page, pageSize })
  const { data, isError, isFetching, refetch } = query

  const firstColumn = view === 'geo' ? 'Country' : granularity === 'day' ? 'Date' : granularity === 'week' ? 'Week' : 'Month'
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  const exportCsv = () => {
    if (!data) return
    downloadCsv(
      `adpulse-${strategy}-${view === 'geo' ? 'by-country' : granularity}_${range.from}_${range.to}.csv`,
      [firstColumn, ...COLUMNS.map(c => c.label)],
      data.rows.map(r => [r.label, ...COLUMNS.map(c => csvNumber(c.value(r)))]),
    )
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="grid gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          Strategy
          <select className="input min-w-56 py-1.5" value={strategy} onChange={e => dispatch(setStrategyQuery({ strategy: e.target.value }))}>
            {FLAT_NODES.map(({ node, depth }) => (
              <option key={node.id} value={node.id}>
                {'  '.repeat(depth * 2)}
                {node.name}
              </option>
            ))}
          </select>
        </label>
        <Segmented<DataView>
          label="View"
          value={view}
          options={[
            { value: 'date', label: 'By date' },
            { value: 'geo', label: 'By country' },
          ]}
          onChange={v => dispatch(setStrategyQuery({ view: v }))}
        />
        <Segmented<Granularity>
          label="Granularity"
          value={granularity}
          disabled={view === 'geo'}
          options={[
            { value: 'day', label: 'Daily' },
            { value: 'week', label: 'Weekly' },
            { value: 'month', label: 'Monthly' },
          ]}
          onChange={g => dispatch(setStrategyQuery({ granularity: g }))}
        />
        <button className="btn-secondary ml-auto py-1.5" onClick={exportCsv} disabled={!data?.rows.length}>
          <DownloadIcon /> Export CSV
        </button>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-8" />
          ))}
        </div>
      ) : data.rows.length === 0 ? (
        <EmptyState title="No data for this selection">Try a wider date range or fewer filters.</EmptyState>
      ) : (
        <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <DataTable
            rows={data.rows}
            totals={data.totals}
            firstColumn={firstColumn}
            sort={sort}
            dir={dir}
            onSort={key => dispatch(setSort(key))}
            caption={`${NODE_NAME[strategy]}, ${view === 'geo' ? 'by country' : granularity}`}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span>
              Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
            </span>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                Rows
                <select className="input w-auto py-1" value={pageSize} onChange={e => dispatch(setStrategyQuery({ pageSize: Number(e.target.value) }))}>
                  {PAGE_SIZES.map(s => (
                    <option key={s} value={s}>
                      {s === 500 ? 'All' : s}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn-secondary py-1" disabled={page <= 1} onClick={() => dispatch(setPage(page - 1))}>
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button className="btn-secondary py-1" disabled={page >= totalPages} onClick={() => dispatch(setPage(page + 1))}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface DataTableProps {
  rows: StrategyDataRow[]
  totals: RawMetrics
  firstColumn: string
  sort: string
  dir: 'asc' | 'desc'
  onSort: (key: string) => void
  caption: string
}

/**
 * Pages of 25–100 rows render normally. The "All" option can return a full year of
 * days, so rows are virtualised: only the ones in view are in the DOM.
 */
function DataTable({ rows, totals, firstColumn, sort, dir, onSort, caption }: DataTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualize = rows.length > 100
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    enabled: virtualize,
  })

  const items = virtualize ? virtualizer.getVirtualItems() : rows.map((_, index) => ({ index, start: index * ROW_HEIGHT }))
  const padTop = virtualize && items.length ? items[0].start : 0
  const padBottom = virtualize && items.length ? virtualizer.getTotalSize() - (items[items.length - 1].start + ROW_HEIGHT) : 0

  const header = (key: string, label: string, align: 'left' | 'right') => {
    const sortable = SORTABLE.has(key)
    const active = sort === key
    return (
      <th
        key={key}
        scope="col"
        aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
        className={`sticky top-0 z-10 ${align === 'left' ? 'left-0 z-20 min-w-48 text-left' : 'text-right'}`}
      >
        {sortable ? (
          <button className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`} onClick={() => onSort(key)}>
            {label}
            <SortIcon dir={active && dir} className="text-slate-400" />
          </button>
        ) : (
          label
        )}
      </th>
    )
  }

  return (
    <div ref={scrollRef} className={`scroll-thin overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 ${virtualize ? 'max-h-[560px]' : ''}`}>
      <table className="data-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {header('key', firstColumn, 'left')}
            {COLUMNS.map(c => header(c.key, c.label, 'right'))}
          </tr>
        </thead>
        <tbody>
          {padTop > 0 && <tr style={{ height: padTop }} aria-hidden="true" />}
          {items.map(({ index }) => {
            const row = rows[index]
            return (
              <tr key={row.key} style={{ height: ROW_HEIGHT }} className="group">
                <td className="sticky left-0 bg-white text-left group-hover:bg-slate-50 dark:bg-slate-900 dark:group-hover:bg-slate-800">{row.label}</td>
                {COLUMNS.map(c => {
                  const v = c.value(row)
                  return (
                    <td key={c.key} className={`text-right ${c.key === 'net' && v < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {formatValue(v, c.format)}
                    </td>
                  )
                })}
              </tr>
            )
          })}
          {padBottom > 0 && <tr style={{ height: padBottom }} aria-hidden="true" />}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <td className="sticky bottom-0 left-0 z-10 border-t border-b-0 bg-slate-50 text-left dark:bg-slate-800">Total</td>
            {COLUMNS.map(c => (
              <td key={c.key} className="sticky bottom-0 border-t border-b-0 bg-slate-50 text-right dark:bg-slate-800">
                {formatValue(c.value(totals), c.format)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
