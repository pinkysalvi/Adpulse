import { CloseIcon } from '../../components/icons'
import { CHART_METRICS, type MetricKey } from '../../utils/metrics'

interface MetricSelectProps {
  label: string
  value: MetricKey | null
  onChange: (key: MetricKey | null) => void
  allowNone?: boolean
  exclude?: MetricKey
  /** shows a clear (✕) button next to the select while a value is chosen */
  onClear?: () => void
}

export function MetricSelect({ label, value, onChange, allowNone, exclude, onClear }: MetricSelectProps) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
      {label}
      <div className="flex gap-2">
        <select className="input py-2" value={value ?? ''} onChange={e => onChange((e.target.value || null) as MetricKey | null)}>
          {allowNone && <option value="">None</option>}
          {CHART_METRICS.filter(m => m.key !== exclude).map(m => (
            <option key={m.key} value={m.key}>
              {m.label}
            </option>
          ))}
        </select>
        {onClear && value && (
          <button
            type="button"
            className="icon-btn h-auto w-10 shrink-0 border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-500/40 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
            onClick={onClear}
            aria-label={`Clear ${label}`}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </label>
  )
}
