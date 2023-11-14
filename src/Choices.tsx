import './Choices.css'
import * as React from 'react'
import {Choice} from "./types"

function Choices(
  {choices, visitedIds, firstNode, handleChoice, handleUndo}: {
    choices: Choice[],
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
  const getChoiceClassName = (choice: Choice): string => {
    let className = choice.node ? "active choice" : "disabled"
    if (isChoiceVisited(choice)) {
      className += " visited"
    }
    if (isChoiceCompleted(choice)) {
      className += " completed"
    }
    return className
  }
  return (
    <ul className={"choices"}>
      {choices.map(
        (choice) => {
          return (
            <li key={choice.nodeId}
                className={getChoiceClassName(choice)}
                onClick={() => (choice.node ? handleChoice(choice.nodeId) : null)}>
              {choice.text}
            </li>
          )
        }
      )}
      {!firstNode && <li key={'#undo'} className={"active"} onClick={handleUndo}>Undo</li>}
    </ul>
  )
}

export default Choices