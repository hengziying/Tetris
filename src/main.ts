/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
 */

import "./style.css";

import { fromEvent, interval, merge } from "rxjs";
import { map, filter, scan } from "rxjs/operators";
import {Constants,Viewport,Cube, State, Key, Event, BlockSize } from './types'
import { initialState, reduceState,Move, Tick, Rotate, Restart, Hold } from './state';



/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");



/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};


/**
 * This is the function called on page load.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const holdView = document.querySelector("#svgHold") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;
  const restartButton = document.querySelector("#restartButton") as HTMLButtonElement;
 

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;
  const linesText = document.querySelector("#linesText") as HTMLElement;

  /** User input */

  const keypress$ = fromEvent<KeyboardEvent>(document, "keypress");
  const keydown$ = fromEvent<KeyboardEvent>(document, "keydown");
  

  const fromKeyPress = (keyCode: Key) =>
    keypress$.pipe(filter(({ code }) => code === keyCode));
  const fromKeyDown = (keyCode: Key) =>
    keydown$.pipe(filter(({ code }) => code === keyCode));

  /** Observables */
  const left$ = merge(fromKeyPress("KeyA"), fromKeyDown("ArrowLeft")).pipe(map(_=>new Move(-BlockSize.WIDTH,0)));
  const right$ = merge(fromKeyPress("KeyD"), fromKeyDown("ArrowRight")).pipe(map(_=>new Move(BlockSize.WIDTH,0)));
  const down$ = merge(fromKeyPress("KeyS"), fromKeyDown("ArrowDown")).pipe(map(_=>new Move(0,BlockSize.HEIGHT)));
  const rotate$ = merge(fromKeyPress("KeyW"), fromKeyDown("ArrowUp")).pipe(map(_=>new Rotate(90)));
  const hold$ = fromKeyPress("KeyC").pipe(map(_=>new Hold));
  const restart$ = fromEvent(restartButton, "click").pipe(map(() => new Restart()));

  
  /** Determines the rate of time steps */
  const tick$ = interval(Constants.TICK_RATE_MS).pipe((map(_=>new Tick())));


  /**
   * Renders the current state to the canvas.
   *
   * In MVC terms, this updates the View using the Model.
   *
   * @param s Current state
   */
  const render = (s: State) => {
       
    //create the cube view in the viewport
    const createCanvasView = (cube:Cube) => {
      const v = createSvgElement(svg.namespaceURI, "rect", {
        height: `${BlockSize.HEIGHT}`,
        width: `${BlockSize.WIDTH}`,
        x: `${cube.pos.x}`,
        y: `${cube.pos.y}`,
        style: `fill: ${cube.colour}; stroke: black;`,
      });
      svg.appendChild(v);
      return v;
    }
    
    //create the cube view in the preview
    const createCubePreview = (cube:Cube) => {
      const v = createSvgElement(svg.namespaceURI, "rect", {
        height: `${BlockSize.HEIGHT}`,
        width: `${BlockSize.WIDTH}`,
        x: `${BlockSize.WIDTH*2+ cube.pos.x- BlockSize.WIDTH*4}`,
        y: `${BlockSize.HEIGHT + cube.pos.y}`,
        style: `fill: ${cube.colour}; stroke: black;`,
      });
      preview.appendChild(v);
      return v;
    }

    //create the cube view in the hold
    const createHoldview = (cube:Cube) => {
      const v = createSvgElement(svg.namespaceURI, "rect", {
        height: `${BlockSize.HEIGHT}`,
        width: `${BlockSize.WIDTH}`,
        x: `${BlockSize.WIDTH*2+ cube.pos.x}`,
        y: `${BlockSize.HEIGHT + cube.pos.y}`,
        style: `fill: ${cube.colour}; stroke: black;`,
      });
      holdView.appendChild(v);
      return v;
    }
    
    //clear the viewport
    Array.from(svg.children).forEach((e) => {
      if(e.id !== "gameOver") {
        e.parentNode!.removeChild(e)
      }
    });
    //clear the preview
    Array.from(preview.children).forEach((e) => e.parentNode!.removeChild(e));
    //clear the hold
    Array.from(holdView.children).forEach((e) => e.parentNode!.removeChild(e));
    
    //show or hide the gameover according to the state
    if (s.gameEnd) {
      show(gameover)
    } else {
      hide(gameover);
     
    }

  //create the view accordingly to the state
  s.curBlock.cube.forEach(cube => createCanvasView(cube));
  s.prevBlocks.forEach(c => createCanvasView(c))
  s.nextBlock.cube.forEach(cube => createCubePreview(cube) )
  s.holdBlock.cube.forEach(cube => createHoldview(cube) )
 
  //update the text fields
  scoreText.textContent = `${s.score}`;
  highScoreText.textContent = `${s.highScore}`;
  levelText.textContent = `${s.level}`;
  linesText.textContent = `${s.lines}`;

  };

  /** The main game loop */
    const source$ = merge(tick$, left$, right$, down$, rotate$, restart$, hold$)
    .pipe(scan(reduceState, initialState))
    .subscribe((s: State) => {
        render(s);  
    });
       

}


// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
