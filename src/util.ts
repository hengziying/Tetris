
export { Vec, RNG }

/**
 * A simple immutable vector class
 * Reference: https://tgdwyer.github.io/asteroids/
 */
class Vec {
    constructor(public readonly x: number = 0, public readonly y: number = 0) {}
    add = (b:Vec) => new Vec(this.x + b.x, this.y + b.y)
    sub = (b:Vec) => this.add(b.scale(-1))
    len = ()=> Math.sqrt(this.x*this.x + this.y*this.y)
    scale = (s:number) => new Vec(this.x*s,this.y*s)
    ortho = ()=> new Vec(this.y,-this.x)
    rotate = (deg:number) =>
              (rad =>(
                  (cos,sin,{x,y})=>new Vec(x*cos - y*sin, x*sin + y*cos)
                )(Math.cos(rad), Math.sin(rad), this)
              )(Math.PI * deg / 180)
  
    static unitVecInDirection = (deg: number) => new Vec(0,-1).rotate(deg)
    static Zero = new Vec();
  }


  

/**
 * A random number generator which provides two pure functions
 * `hash` and `scaleToRange`.  Call `hash` repeatedly to generate the
 * sequence of hashes.
 * 
 * Reference: https://tgdwyer.github.io/asteroids/
 */
abstract class RNG {
  // LCG using GCC's constants
  private static m = 0x80000000; // 2**31
  private static a = 1103515245;
  private static c = 12345;


  public static getM() {
    return RNG.m;
  }
  /**
   * Call `hash` repeatedly to generate the sequence of hashes.
   * @param seed 
   * @returns a hash of the seed
   */
  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

   /**
     * Takes hash value and scales it to the range [0, 6]
     */
   public static scaleToRange = (hash: number) => (hash % 7);;
}


