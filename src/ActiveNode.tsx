import './ActiveNode.css'
import * as React from 'react'
import {Choice, GameNode} from "./types"

function ActiveNode(
  {node, visitedIds, firstNode, handleChoice, handleUndo}: {
    node: GameNode,
    visitedIds: string[] | null,
    firstNode: boolean,
    handleChoice: (nodeId: string) => void,
    handleUndo: () => void,
  }
): React.ReactElement {
  const isChoiceVisited = (choice: Choice) => !!visitedIds && visitedIds.indexOf(choice.nodeId) > -1
  const isChoiceCompleted = (choice: Choice): boolean => (
    isChoiceVisited(choice) && !!choice.node && choice.node.choices.every(
      (subchoice) => !subchoice.node || subchoice.nodeId.length < choice.nodeId.length || isChoiceCompleted(subchoice)
    )
  )
  return <>
    <div dangerouslySetInnerHTML={{__html: node.text}}/>
    {!node.choices.length && <><p>The End</p><p><img src={"/skull.gif"} alt={"human skull"} height={50} /></p></>}
    <ul className={"choices"}>
      {node.choices.map(
        (choice) => {
          let className = choice.node ? "active choice" : "disabled"
          if (isChoiceVisited(choice)) {
            className += " visited"
          }
          if (isChoiceCompleted(choice)) {
            className += " completed"
          }
          return (
            <li key={choice.nodeId}
                className={className}
                onClick={() => (choice.node ? handleChoice(choice.nodeId) : null)}>
              {choice.text}
            </li>
          )
        }
      )}
      {!firstNode && <li key={'#undo'} className={"active"} onClick={handleUndo}>Undo</li>}
    </ul>
  </>
}

export default ActiveNode