import './GameLog.css'
import * as React from 'react'
import type {RawNode, Nodes} from "./types"
import NodeContent from "./NodeContent.tsx";
import PastChoice from "./PastChoice.tsx"
import Choices from "./Choices.tsx"
import {parseNodeData} from "./parseNodeData.ts";
import {useNavigate, useParams} from 'react-router-dom';

function GameLog(): React.ReactElement | null {
  const [nodeIds, setNodeIds] = React.useState<string[]>(["a"])
  const [visitedIds, setVisitedIds] = React.useState<string[] | null>(null)
  const [nodes, setNodes] = React.useState<Nodes | null>(null)
  const activeNodeRef: React.MutableRefObject<HTMLDivElement | null> = React.useRef(null)
  const params = useParams();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchNodes = async () => {
      const response = await fetch('/story_engine.json')
      const data: RawNode[] = await response.json()
      setNodes(parseNodeData(data))
    }

    fetchNodes()
  }, [])

  React.useEffect(() => {
    if (params.nodeId && nodeIds.at(-1) != params.nodeId) {
      const nodeIds = [];
      for (let i = 1; i <= params.nodeId.length; i++) {
        nodeIds.push(params.nodeId.slice(0, i))
      }
      setNodeIds(nodeIds)
    }
  }, [nodeIds, params])

  React.useEffect(() => {
    setVisitedIds(JSON.parse(localStorage.getItem("visited") || "[]"))
  }, [])

  React.useEffect(() => {
    if (visitedIds !== null) {
      localStorage.setItem("visited", JSON.stringify(visitedIds))
    }
  }, [visitedIds])

  React.useEffect(() => activeNodeRef.current?.scrollIntoView({behavior: "smooth"}), [nodeIds])

  const handleChoice = (nodeId: string) => {
    setNodeIds([...nodeIds, nodeId])
    navigate(`/${nodeId}`)
    if (!visitedIds) return;
    if (visitedIds.indexOf(nodeId) === -1) {
      setVisitedIds([...visitedIds, nodeId])
    }
  }

  const handleUndo = () => {
    setNodeIds(nodeIds.filter((_nodeId, index) => index !== nodeIds.length - 1))
    navigate(`/${nodeIds.at(-2)}`)
  }

  if (!nodes)
    return null;

  const lastNode = nodes[nodeIds.at(-1) as string]
  return <>
    {nodeIds.slice(0, -1).map((nodeId, index) =>
      <React.Fragment key={nodeId}>
        <NodeContent gameNode={nodes[nodeId]} />
        <PastChoice node={nodes[nodeId]} choiceId={nodeIds[index + 1]} />
      </React.Fragment>
    )}
    <div ref={activeNodeRef}>
      <NodeContent gameNode={lastNode} />
      <Choices
        choices={lastNode.choices}
        visitedIds={visitedIds}
        firstNode={nodeIds.length === 1}
        handleChoice={handleChoice}
        handleUndo={handleUndo}
      />
    </div>
  </>
}

export default GameLog
