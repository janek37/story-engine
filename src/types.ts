export interface Option {
  text: string
  node_id: string
}

export interface RawNode {
  text: string
  node_id: string
  options: Option[]
  author: string
}

export interface Choice {
  text: string
  nodeId: string
  node: GameNode | null
}

export interface GameNode {
  nodeId: string
  text: string
  choices: Choice[]
  author: string
  getChoiceById(choiceId: string): Choice | undefined
}

export type Nodes = {[nodeId: string]: GameNode}
