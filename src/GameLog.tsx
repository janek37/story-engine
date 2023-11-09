import './GameLog.css'
import * as React from 'react'
import type {RawNode, Nodes} from "./types"
import LogNode from "./LogNode"
import ActiveNode from "./ActiveNode"
import {parseNodeData} from "./parseNodeData.ts";

function GameLog(): React.ReactElement | null {
  const [nodeIds, setNodeIds] = React.useState<string[]>(["a"])
  const [visitedIds, setVisitedIds] = React.useState<string[] | null>(null)
  const [nodes, setNodes] = React.useState<Nodes | null>(null)

  React.useEffect(() => {
    const fetchNodes = async () => {
      const response = await fetch('/story_engine.json')
      const data: RawNode[] = await response.json()
      setNodes(parseNodeData(data))
    }

    fetchNodes()
  }, [])

  React.useEffect(() => {
    setVisitedIds(JSON.parse(localStorage.getItem("visited") || "[]"))
  }, [])

  React.useEffect(() => {
    if (visitedIds !== null) {
      localStorage.setItem("visited", JSON.stringify(visitedIds))
    }
  }, [visitedIds])

  React.useEffect(() => window.scrollTo(0, document.body.scrollHeight), [nodeIds])

  const handleChoice = (nodeId: string) => {
    setNodeIds([...nodeIds, nodeId])
    if (!visitedIds) return;
    if (visitedIds.indexOf(nodeId) === -1) {
      setVisitedIds([...visitedIds, nodeId])
    }
  }

  const handleUndo = () => {
    setNodeIds(nodeIds.filter((_nodeId, index) => index !== nodeIds.length - 1))
  }

  if (!nodes)
    return null;

  const lastNode = nodes[nodeIds[nodeIds.length - 1]]
  return <>
    {nodeIds.slice(0, -1).map((nodeId, index) =>
      <React.Fragment key={nodeId}>
        <p className={'author'}>{nodes[nodeId].author}</p>
        <LogNode node={nodes[nodeId]} choiceId={nodeIds[index + 1]} />
      </React.Fragment>
    )}
    <p className={'author'}>{lastNode.author}</p>
    <ActiveNode
      node={lastNode}
      visitedIds={visitedIds}
      firstNode={nodeIds.length === 1}
      handleChoice={handleChoice}
      handleUndo={handleUndo}
    />
  </>
}

export default GameLog
