import * as React from 'react'
import {GameNode} from "./types";

function LogNode({node, choiceId}: {node: GameNode, choiceId: string}): React.ReactElement {
  const chosenChoice = node.getChoiceById(choiceId);
  return <>
    <div dangerouslySetInnerHTML={{__html: node.text}}/>
    <p className={'choice'}>&gt; {chosenChoice ? chosenChoice.text : 'ERROR: incorrect choice'}</p>
  </>
}

export default LogNode