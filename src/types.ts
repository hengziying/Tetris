export { Constants,Viewport, BlockSize  }
export type { Cube, State, Key, Event, Action,Block }
import { Vec } from "./util"

/** Constants */
const Viewport = {
    CANVAS_WIDTH: 200,
    CANVAS_HEIGHT: 400,
    PREVIEW_WIDTH: 160,
    PREVIEW_HEIGHT: 80,
} as const;
  
const Constants = {
    TICK_RATE_MS: 1,
    GRID_WIDTH: 10,
    GRID_HEIGHT: 20,
} as const;
  
const BlockSize = {
    WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
    HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};
  
/** User input */

type Key = "KeyS" | "KeyA" | "KeyD" | "KeyW" | "KeyC" | "ArrowLeft" | "ArrowRight" | "ArrowDown" | "ArrowUp" ;

type Event = "keydown" | "keyup" | "keypress";




/**
 * ObjectIds help us identify objects in the game.
 */
type ObjectId = Readonly<{ id: string }>


/**Cube object for forming block */
type Cube = ObjectId & Readonly<{
  pos:Vec,
  colour:string,
  isPivot:boolean,
}>

/**Block object*/
type Block = ObjectId & Readonly<{
  cube:Cube[],
}>


/** State processing */
type State = Readonly<{
  curBlock: Block,
  prevBlocks:Cube[],
  nextBlock:Block,
  holdBlock:Block,
  score:number,
  lines:number,
  gameEnd: boolean,
  restart: boolean,
  highScore:number,
  level :number,
  curTick:number,
  gameSpeed:number,
  holdUsed:boolean;
}>;


/**
 * Actions modify state
 * Reference: https://tgdwyer.github.io/asteroids/
 */
interface Action {
  apply(s: State): State;
}


  