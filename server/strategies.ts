// Bidding strategy tree, shared by the API and the React app.

import type { StrategyNode } from './types'

export const STRATEGY_TREE: StrategyNode = {
  id: 'all',
  name: 'All traffic',
  color: '#64748b',
  children: [
    { id: 'manual', name: 'Manual bidding', color: '#f0a03c' },
    {
      id: 'rule',
      name: 'Rule-based bidding',
      color: '#4f9fde',
      children: [
        { id: 'rule-max', name: 'Max-bid tier', color: '#5fa8e0' },
        { id: 'rule-under', name: 'Below-max tier', color: '#48c9b0' },
      ],
    },
    {
      id: 'smart',
      name: 'Smart bidding (AI)',
      color: '#8a78ec',
      children: [
        { id: 'smart-profit', name: 'Profitable', color: '#7b68ee' },
        { id: 'smart-loss', name: 'Unprofitable', color: '#e8766a' },
        { id: 'smart-new', name: 'New', color: '#58d68d' },
        { id: 'smart-test', name: 'Testing', color: '#a66bbe' },
        { id: 'smart-soft', name: 'Soft recovery', color: '#f1948a' },
        { id: 'smart-hard', name: 'Hard recovery', color: '#a5b4fc' },
      ],
    },
  ],
}

/** Every node id with the leaf ids underneath it */
export const NODE_LEAVES: Record<string, string[]> = {}
const walk = (n: StrategyNode): string[] => {
  const leaves = n.children ? n.children.flatMap(walk) : [n.id]
  NODE_LEAVES[n.id] = leaves
  return leaves
}
walk(STRATEGY_TREE)

/** All nodes in tree order with their depth */
export const FLAT_NODES: { node: StrategyNode; depth: number; parentId?: string }[] = []
const flatten = (n: StrategyNode, depth: number, parentId?: string) => {
  FLAT_NODES.push({ node: n, depth, parentId })
  n.children?.forEach(c => flatten(c, depth + 1, n.id))
}
flatten(STRATEGY_TREE, 0)
