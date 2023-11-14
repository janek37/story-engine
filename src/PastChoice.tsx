import * as React from 'react'
import {GameNode} from "./types";

function PastChoice({node, choiceId}: {node: GameNode, choiceId: string}): React.ReactElement {
  const chosenChoice = node.getChoiceById(choiceId);
  return <p className={'choice'}>&gt; {chosenChoice?.text || 'ERROR: incorrect choice'}</p>
}

export default PastChoice