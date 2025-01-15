import { Cube, State, Action  } from "./types"
import { Vec,RNG } from "./util"
import { Constants,Viewport, Block,BlockSize } from "./types"
export { initialState ,reduceState ,Move ,Tick ,Rotate ,Restart ,Hold};


/////////////// INITIAL STATE SET UP////////////////////
/** setting up 7 different Block object to represent 7 different geometric shapes of blocks */
//block O
const block1: Block = {
    id:'O',
    cube:[{id:'cube1',pos:new Vec(0,0),colour:'#FFE1A0',isPivot:false},
    {id:'cube2',pos:new Vec(BlockSize.WIDTH,0),colour:'#FFE1A0', isPivot:false},
    {id:'cube3',pos:new Vec(0,BlockSize.HEIGHT),colour:'#FFE1A0',isPivot:false},
    {id:'cube4',pos:new Vec(BlockSize.WIDTH,BlockSize.HEIGHT),colour:'#FFE1A0',isPivot:false}],
    

}

//block I
const block2: Block = {
    id:'I',
    cube:[{id:'cube1',pos:new Vec(0,0),colour:'#BAD6EB',isPivot:false},
    {id:'cube2',pos:new Vec(BlockSize.WIDTH,0),colour:'#BAD6EB', isPivot:false},
    {id:'cube3',pos:new Vec(2*BlockSize.WIDTH,0),colour:'#BAD6EB',isPivot:true},
    {id:'cube4',pos:new Vec(3*BlockSize.WIDTH,0),colour:'#BAD6EB', isPivot:false}],

}

//block T
const block3: Block = {
    id:'T',
    cube:[{id:'cube1',pos:new Vec(0,0),colour:'#E1D3E8', isPivot:false},
    {id:'cube2',pos:new Vec(BlockSize.WIDTH,0),colour:'#E1D3E8', isPivot:false},
    {id:'cube3',pos:new Vec(2*BlockSize.WIDTH,0),colour:'#E1D3E8', isPivot:false},
    {id:'cube4',pos:new Vec(BlockSize.WIDTH,BlockSize.HEIGHT),colour:'#E1D3E8',isPivot:true}],

}

//block Z
const block4: Block = {
    id:'Z',
    cube:[{id:'cube1',pos:new Vec(0,0),colour:'#D4B2A7', isPivot:false},
    {id:'cube2',pos:new Vec(BlockSize.WIDTH,0),colour:'#D4B2A7', isPivot:false},
    {id:'cube3',pos:new Vec(2*BlockSize.WIDTH,BlockSize.HEIGHT),colour:'#D4B2A7', isPivot:false},
    {id:'cube4',pos:new Vec(BlockSize.WIDTH,BlockSize.HEIGHT),colour:'#D4B2A7',isPivot:true}],

}

//block S
const block5: Block = {
    id:'S',
    cube:[{id:'cube1',pos:new Vec(0,BlockSize.HEIGHT),colour:'#A5A58D', isPivot:false},
    {id:'cube2',pos:new Vec(BlockSize.WIDTH,BlockSize.HEIGHT),colour:'#A5A58D',isPivot:true},
    {id:'cube3',pos:new Vec(BlockSize.WIDTH,0),colour:'#A5A58D', isPivot:false},
    {id:'cube4',pos:new Vec(2*BlockSize.WIDTH,0),colour:'#A5A58D', isPivot:false}],

}

//block J
const block6: Block = {
    id:'J',
    cube:[{id:'cube1',pos:new Vec(0,BlockSize.HEIGHT),colour:'#CB997E', isPivot:false},
    {id:'cube2',pos:new Vec(BlockSize.WIDTH,BlockSize.HEIGHT),colour:'#CB997E',isPivot:true},
    {id:'cube3',pos:new Vec(2*BlockSize.WIDTH,BlockSize.HEIGHT),colour:'#CB997E', isPivot:false},
    {id:'cube4',pos:new Vec(2*BlockSize.WIDTH,0),colour:'#CB997E', isPivot:false}],

}

//block L
const block7: Block = {
    id:'L',
    cube:[{id:'cube1',pos:new Vec(0,0),colour:'#7096D1', isPivot:false},
    {id:'cube2',pos:new Vec(0,BlockSize.HEIGHT),colour:'#7096D1', isPivot:false},
    {id:'cube3',pos:new Vec(BlockSize.WIDTH,BlockSize.HEIGHT),colour:'#7096D1',isPivot:true},
    {id:'cube4',pos:new Vec(2*BlockSize.WIDTH,BlockSize.HEIGHT),colour:'#7096D1', isPivot:false}],

}

/**
 * @return a random block between block1 to block7
 */
const createRandomBlock= ():Block => {
    const blocks = [block1,block2,block3,block4,block5,block6,block7]
    //const randomIndex = Math.floor(Math.random() * blocks.length);
    const randomIndex = RNG.scaleToRange(RNG.hash(Math.floor(Math.random() * RNG.getM())));
    return {...blocks[randomIndex],cube:blocks[randomIndex].cube.map(c=>({...c,pos:c.pos.add(new Vec(4*BlockSize.WIDTH,0))}))}
}


//initial state for the game
const initialState: State = {
    curBlock:{...createRandomBlock()},
    prevBlocks:[] as Cube[],
    nextBlock:{...createRandomBlock()},
    holdBlock:<Block>{id:'hold',cube:[]},
    score:0,
    lines:0,
    gameEnd: false,
    restart: false,
    highScore:0,
    level:0,
    curTick:0,
    gameSpeed:150,
    holdUsed:false,
} as const;


//////////////// STATE UPDATES //////////////////////

/** 
* move the cube
* @param c cube to move
* @param x x direction
* @param y y direction
* @returns a new cube with updated position
*/
const moveCube = (c: Cube,x:number,y:number): Cube => ({
    ...c,
    pos: c.pos.add(new Vec(x,y)),   
})



/** 
* check if the block is on the ground(the height of the viewport)
* @param b block to check
* @returns true if the block is on the ground
*/
const isGround = (b:Cube[]) => {
    return b.some(c => c.pos.y >= Viewport.CANVAS_HEIGHT);  
}

/** 
* check if the block has reached the top of the viewport
* @param b block to check
* @returns true if the block has reached the top of the viewport
*/
const isTop = (b:Cube[]) => {
    return b.some(c => c.pos.y <= 0);  
}


/** 
* check if the block is colliding with the previous blocks
* @param b block to check
* @param prev previous blocks
* @returns true if the block is colliding with the previous blocks
*/
const isColliding = (b:Cube[],prev:Cube[]) => {
    return b.some(c1=>prev.some(c2=> c1.pos.y>=c2.pos.y && c1.pos.x === c2.pos.x))
}


 /** 
 * check a State for collisions with the updated block:
 * - if the block is on the ground, add the block to the previous blocks and create a new block
 * - if the block is colliding with the previous blocks, add the block to the previous blocks and create a new block
 * - if the block has reached the top of the viewport, game over
 * - otherwise, update the block to the updated block
 * @param s State to check
 * @param updatedBlock updated block
 * @returns a new State
 */
const handleCollisions = (s: State,updatedBlock:Cube[]):State => {

    if (isGround(updatedBlock)){
        const temp = [...s.prevBlocks, ...s.curBlock.cube];
        return <State>{...s,
            curBlock:s.nextBlock,
            prevBlocks:temp,
            nextBlock:{...createRandomBlock()},
            holdUsed:false,
        }
    }


    else if (isColliding(updatedBlock,s.prevBlocks)) {
      const temp = [...s.prevBlocks, ...s.curBlock.cube];
        if (isTop(s.curBlock.cube)){
            return <State>{...s,
                curBlock:{...s.curBlock,cube: []},
                prevBlocks:[],
                nextBlock:{...createRandomBlock()},
                gameEnd:isTop(s.curBlock.cube),
            }
        }
        return <State>{...s, 
            curBlock:s.nextBlock,
            prevBlocks:temp,
            nextBlock:{...createRandomBlock()},
            gameEnd:isTop(s.curBlock.cube),
            holdUsed:false,
        }
    }

    return <State>{...s,
        curBlock:{...s.curBlock,cube: updatedBlock,gameEnd:isTop(updatedBlock),}
    }


}


//calculate the base point for each line cleared
const calculateBasePoint = (line: number): number => {
  switch (line) {
    case 1:
      return 40;
    case 2:
      return 100;
    case 3:
      return 300;
    case 4: 
      return 1200;
    default:
      return 0;
  }
};

/**
 * Handle the score and level
 * @param s 
 * @returns a new State
 */
const handleScore = (s: State): State => {
  const Blocks: Cube[] = [...s.prevBlocks ];

  // Check if any of the blocks are on the same row, if so, remove the row and update the positions of the blocks the removed row above by moving it down  
  const updatedBlocks = Blocks.reduce(
    (acc: { cubes: Cube[]; line: number ; level:number }, c: Cube) => {
      const matchingRows = acc.cubes.filter((c2) => c2.pos.y === c.pos.y);
  
      if (matchingRows.length === Viewport.CANVAS_WIDTH / BlockSize.WIDTH) {
        // Remove the matching row
        const filterRow = acc.cubes.filter((c2) => c2.pos.y !== c.pos.y);
        // Update the positions of the blocks above the removed row
        const updatedCubes = filterRow.map((c2) =>
          c2.pos.y < c.pos.y ? moveCube(c2, 0, BlockSize.HEIGHT) : c2 );
        const updatedLines = acc.line + 1;
        // Update the level evry 10 lines cleared
        const updatedlevel = updatedLines % 10 === 0 ? acc.level+1 : acc.level;   
        return {...acc,cubes:updatedCubes,line:updatedLines,level:updatedlevel,}
      }
  
      return acc;
    },
    { cubes: [...s.prevBlocks], line: s.lines, level:s.level }
  );

 
  //update the score based on  the Original Nintendo Scoring System 
  //Reference: https://tetris.wiki/Scoring
  const updatedScore = s.score + calculateBasePoint(updatedBlocks.line-s.lines) * (s.level + 1);
  //update the speed of the game based on the level, the game speed will increase by 10ms every level up to level 14
  const updatedGameSpeed = updatedBlocks.level > s.level && s.level < 14 ? s.gameSpeed-10: s.gameSpeed;

  if (updatedScore > s.score) {
    return {
      ...s,
      prevBlocks: updatedBlocks.cubes,
      score: updatedScore,
      lines: updatedBlocks.line,
      level:updatedBlocks.level,
      gameSpeed:updatedGameSpeed,
    };
  }
  return s;
};


  

class Tick implements Action {

    constructor() { }
    /** 
     * interval tick: move the block down by one block height
     * @param s old State
     * @returns new State
     */
    apply(s: State): State {
        const updatedBlock = s.curBlock.cube.map(cube => moveCube(cube,0,BlockSize.HEIGHT))
        //if the tick is less than the game speed, return the old state (use to manage the speed of game)
        if (s.curTick < s.gameSpeed ) {
          return <State>{...s,curTick:s.curTick+1,}
        }
       
        return {...handleScore(handleCollisions(s,updatedBlock)),curTick:0}
    }
  
  
}





class Move implements Action {
  constructor(public readonly x: number, public readonly y: number) {}

  /**
   * Move the block by x and y
   * @param s previous state
   * @returns moved state / previous state
   */
  apply = (s: State) => {
    const updatedCubes = s.curBlock.cube.map((cube) => moveCube(cube, this.x, this.y));
    
    // Check if any of the updated cubes are outside the canvas bounds
    const isWithinBounds = updatedCubes.every((cube) =>
      cube.pos.x >= 0 && cube.pos.x < Viewport.CANVAS_WIDTH
    );

    // Check if any of the updated cubes collide with existing blocks
    const isColliding = updatedCubes.some((cube) =>
      s.prevBlocks.some((prevCube) =>
        prevCube.pos.x === cube.pos.x && prevCube.pos.y === cube.pos.y
      )
    );

    if (isWithinBounds && !isColliding) {
      return handleCollisions(s, updatedCubes);
    } else {
      return s; // Keep the state unchanged if movement is not valid
    }
  };
}



  class Rotate implements Action {
    constructor(public readonly degree: number) {}

    /**
     * Rotate the block by degree usin the system of Super rotation system (SRS) without wall kick
     * Reference: https://strategywiki.org/wiki/Tetris/Rotation_systems
     * @param s previous state
     * @returns rotated state / previous state
     */
    apply = (s: State): State => {
      const pivotCube = s.curBlock.cube.find((cube) => cube.isPivot);
      if (!pivotCube) {
        return s; // No pivot cube found, can't rotate
      }

      // check whether it will collide if rotation occurs
      const rotateCollision = this.isRotateCollision(s.curBlock.cube,s.prevBlocks,pivotCube)
      //if there is no collision, rotate the block
      if (!rotateCollision){
        const rotatedCubes = s.curBlock.cube.map((cube) => {
          if (cube.id !== pivotCube.id) {
            const relativePos = cube.pos.sub(pivotCube.pos);
            const rotatedRelativePos = relativePos.rotate(this.degree);
            const rotatedPos = pivotCube.pos.add(rotatedRelativePos);
            return { ...cube, pos: rotatedPos };
          } else {
            return cube; // Keep pivot cube unchanged
          }
        })
        return handleCollisions(s, rotatedCubes);
      };

      return handleCollisions(s, s.curBlock.cube); //if the block cannot rotate, keep the block unchanged
      
    };
  
    /**
     * check whether the block will collide with the previous blocks if rotation occurs
     * @param curBlock current block
     * @param prevBlocks previous blocks
     * @param pivot pivot cube
     * @returns true if the block will collide with the previous blocks if rotation occurs
    */
    private isRotateCollision = (curBlock: Cube[], prevBlocks: Cube[],pivot: Cube):Boolean=> {
      return curBlock.some((cube) => {
        const isWithinBounds = (pos: Vec) =>{
          return pos.x >= 0 && pos.x < Viewport.CANVAS_WIDTH && pos.y >= 0 && pos.y < Viewport.CANVAS_HEIGHT;
        }   
          const isColliding = (pos: Vec, prev: Cube[]) =>
            pos.y >= Viewport.CANVAS_HEIGHT ||
            prev.some((c) => c.pos.y === pos.y && c.pos.x === pos.x);
        if (cube.id !== pivot.id ) {
          const relativePos = cube.pos.sub(pivot.pos);
          const rotatedRelativePos = relativePos.rotate(this.degree);
          const rotatedPos = pivot.pos.add(rotatedRelativePos);
          return (!isWithinBounds(rotatedPos) || isColliding(rotatedPos, prevBlocks)) // Keep the cube's original position if rotation is not valid 
          
        }
        else{
          return (!isWithinBounds(cube.pos) || isColliding(cube.pos, prevBlocks)) // Keep the cube's original position if rotation is not valid 
        }
        
      })
    }; 
 
  }
  

class Restart implements Action {
    constructor() {}
     /**
     * Restart the game
     * @param s previous state
     * @returns inintial state 
     */
    apply = (s: State) => {
        const highScore = s.score > s.highScore ? s.score : s.highScore;
      return <State>{...initialState,curBlock:createRandomBlock(),nextBlock:createRandomBlock(),highScore:highScore,}; 
  }
}

class Hold implements Action {
    constructor() {}
     /**
     * Hold the current block and swap it with the hold block / create a new hold block if there is no hold block
     * @param s previous state
     * @returns swapped state / previous state
     */
    apply = (s: State) => {
        const blocks = [block1,block2,block3,block4,block5,block6,block7]
        const curblock = blocks.find(b=>b.id === s.curBlock.id)
        if (!s.holdUsed){
          if (s.holdBlock.id === 'hold'){
              return <State>{...s,holdBlock:{...curblock},curBlock:{...s.nextBlock},nextBlock:createRandomBlock(),holdUsed:true,curTick:0,};
          }
        return <State>{...s,curBlock:{...s.holdBlock,cube:s.holdBlock.cube.map(c=>({...c,pos:c.pos.add(new Vec(4*BlockSize.WIDTH,0))}))},holdBlock:{...curblock},holdUsed:true,curTick:0,}; 
        }
        return s
  }
}




/**
 * state transducer
 * @param s input State
 * @param action type of action to apply to the State
 * @returns a new State 
 * Reference: https://tgdwyer.github.io/asteroids/
 */
const reduceState  = (s: State, action: Action) => action.apply(s);