import {Choice, GameNode, Nodes, RawNode} from "./types.ts";

export function parseNodeData(nodeData: RawNode[]): Nodes {
  const nodesById = nodeData.reduce(
    (obj: { [nodeId: string]: RawNode }, item: RawNode) => {
      return {...obj, [item.node_id]: item}
    },
    {}
  )
  const nodes: Nodes = {}
  const backReferences: Choice[] = []

  const addNode = (nodeId: string): GameNode | null => {
    if (nodeId in nodes) return nodes[nodeId]
    if (!(nodeId in nodesById)) return null
    const rawNode = nodesById[nodeId];
    const gameNode = {
      nodeId: rawNode.node_id,
      text: rawNode.text,
      choices: rawNode.options.map((option) => {
        return {
          nodeId: option.node_id,
          text: option.text,
          node: option.node_id.length > nodeId.length ? addNode(option.node_id) : null,
        }
      }),
      author: rawNode.author,
      getChoiceById(choiceId: string) {
        return this.choices.find((choice: Choice) => choice.nodeId === choiceId)
      },
    }
    for (const choice of gameNode.choices) {
      if (choice.nodeId in nodesById && choice.node === null) {
        backReferences.push(choice)
      }
    }
    nodes[nodeId] = gameNode
    return gameNode
  }

  addNode("a")
  for (const backRef of backReferences) {
    backRef.node = nodes[backRef.nodeId]
  }
  return nodes
}