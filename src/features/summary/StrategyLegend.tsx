import type { StrategyNode } from '../../../server/types'
import { useAppDispatch, useAppSelector } from '../../app/store'
import { EyeIcon, EyeOffIcon } from '../../components/icons'
import { STRATEGY_TREE, descendantIds } from '../../utils/tree'
import { showAll, toggleHidden } from '../dashboard/dashboardSlice'

/*
 * Connector lines: every child row draws a vertical line on its left (stopping halfway
 * on the last child) plus a short horizontal elbow into the row. ROW_MID matches the
 * vertical centre of a 36px row.
 */
const BRANCH =
  'relative pl-5 ' +
  'before:absolute before:top-0 before:bottom-0 before:left-0 before:w-px before:bg-slate-300 dark:before:bg-slate-700 ' +
  'last:before:bottom-auto last:before:h-[18px] ' +
  'after:absolute after:top-[18px] after:left-0 after:h-px after:w-4 after:bg-slate-300 dark:after:bg-slate-700'

function TreeItem({ node, depth, hidden }: { node: StrategyNode; depth: number; hidden: string[] }) {
  const dispatch = useAppDispatch()
  const isHidden = hidden.includes(node.id)

  return (
    <li className={depth > 0 ? BRANCH : ''}>
      <button
        className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
          isHidden ? 'text-slate-400 dark:text-slate-500' : ''
        }`}
        aria-pressed={!isHidden}
        aria-label={`${isHidden ? 'Show' : 'Hide'} ${node.name}`}
        onClick={() => dispatch(toggleHidden([node.id, ...descendantIds(node.id)]))}
      >
        {isHidden ? <EyeOffIcon className="shrink-0 text-slate-400" /> : <EyeIcon className="shrink-0 text-slate-500 dark:text-slate-400" />}
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: isHidden ? 'transparent' : node.color, border: `2px solid ${node.color}` }}
        />
        <span className={`truncate ${node.children ? 'font-semibold' : ''}`}>{node.name}</span>
      </button>

      {node.children && (
        // indent so the connector line sits under this row's eye icon
        <ul className="ml-4">
          {node.children.map(child => (
            <TreeItem key={child.id} node={child} depth={depth + 1} hidden={hidden} />
          ))}
        </ul>
      )}
    </li>
  )
}

/** Strategy tree used as the chart legend: the eye toggles a node and everything under it. */
export function StrategyLegend() {
  const dispatch = useAppDispatch()
  const hidden = useAppSelector(s => s.dashboard.hidden)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Strategies</h3>
        {hidden.length > 0 && (
          <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400" onClick={() => dispatch(showAll())}>
            Show all
          </button>
        )}
      </div>
      <ul aria-label="Strategies shown in the chart">
        <TreeItem node={STRATEGY_TREE} depth={0} hidden={hidden} />
      </ul>
    </div>
  )
}
