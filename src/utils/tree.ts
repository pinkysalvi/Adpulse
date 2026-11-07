import { FLAT_NODES, NODE_LEAVES, STRATEGY_TREE } from '../../server/strategies'

export { FLAT_NODES, NODE_LEAVES, STRATEGY_TREE }

export const NODE_COLOR: Record<string, string> = Object.fromEntries(FLAT_NODES.map(({ node }) => [node.id, node.color]))
export const NODE_NAME: Record<string, string> = Object.fromEntries(FLAT_NODES.map(({ node }) => [node.id, node.name]))
export const LEAF_NODE_IDS = NODE_LEAVES.all

/** All ids below a node (not including the node itself) */
export function descendantIds(id: string): string[] {
  const children = FLAT_NODES.filter(n => n.parentId === id).map(n => n.node.id)
  return children.flatMap(c => [c, ...descendantIds(c)])
}
