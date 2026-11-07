import { Drawer } from '../../components/ui/Drawer'
import { METRICS } from '../../utils/metrics'
import { FLAT_NODES } from '../../utils/tree'

const STRATEGY_NOTES: Record<string, string> = {
  manual: 'Bids set by hand by the account team.',
  rule: 'Bids follow fixed min / max rules.',
  'rule-max': 'Traffic bought at the maximum allowed bid.',
  'rule-under': 'Traffic won below the maximum bid.',
  smart: 'An AI model sets the bid for every request.',
  'smart-profit': 'Placements earning more than they cost.',
  'smart-loss': 'Placements currently costing more than they earn.',
  'smart-new': 'New placements still being learned.',
  'smart-test': 'Placements in an A/B bidding experiment.',
  'smart-soft': 'Placements recovering with lowered bids.',
  'smart-hard': 'Placements recovering with strict bid caps.',
}

const FAQS = [
  ['Where does the data come from?', 'AdPulse is a demo. A serverless API generates realistic, repeatable data: the same dates and filters always return the same numbers.'],
  ['Why do Sub IDs need a publisher?', 'Sub IDs belong to a publisher, so the list only shows Sub IDs for the publishers you have selected.'],
  ['Can I share a view?', 'Yes. Dates, filters, tab and metrics are saved in the page URL. Copy the address bar to share exactly what you see.'],
  ['Why are some metrics missing from the chart stack?', 'Rates such as CTR or RPC can’t be added together, so they’re shown as separate lines instead of a stacked area.'],
]

export default function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <Drawer title="Help & glossary" onClose={onClose} width="max-w-lg">
      <section>
        <h3 className="label mb-3">Metrics glossary</h3>
        <dl className="space-y-3">
          {METRICS.map(m => (
            <div key={m.key}>
              <dt className="text-sm font-medium">{m.label}</dt>
              <dd className="text-sm text-slate-500 dark:text-slate-400">{m.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-8">
        <h3 className="label mb-3">Drill-down structure</h3>
        <ul className="space-y-2">
          {FLAT_NODES.map(({ node, depth }) => (
            <li key={node.id} style={{ paddingLeft: depth * 16 }} className="text-sm">
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: node.color }} />
              <span className="font-medium">{node.name}</span>
              {STRATEGY_NOTES[node.id] && <span className="text-slate-500 dark:text-slate-400"> · {STRATEGY_NOTES[node.id]}</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h3 className="label mb-3">FAQs</h3>
        <div className="space-y-2">
          {FAQS.map(([q, a]) => (
            <details key={q} className="rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800">
              <summary className="cursor-pointer text-sm font-medium">{q}</summary>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </Drawer>
  )
}
