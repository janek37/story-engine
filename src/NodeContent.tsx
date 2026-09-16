import * as React from 'react'
import type {GameNode} from "./types.ts";

function NodeContent({gameNode}: {gameNode: GameNode}): React.ReactElement {
  return <>
    <p className={'author'}>{gameNode.author}</p>
    <div dangerouslySetInnerHTML={{__html: gameNode.text}}/>
    {!gameNode.choices.length && <><p>The End</p><p><img src={import.meta.env.BASE_URL + "skull.gif"} alt={"human skull"} height={50} /></p></>}
  </>
}

export default NodeContent
