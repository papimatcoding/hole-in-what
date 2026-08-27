import { DESIGN_HEIGHT, DESIGN_WIDTH } from "../config/display";
import { GOLF_PHYSICS, powerFromPhysicalPull } from "./GolfSimulation";
import type { Vec2 } from "../types";

export const SHOT_GRAB_RADIUS=96;
const MIN_EDGE_DISTANCE=38;
const MAX_EDGE_ASSIST=3.35;

export interface ShotPull{
  dx:number;
  dy:number;
  length:number;
  unitX:number;
  unitY:number;
  power:number;
  assist:number;
}

/**
 * Maps the physical finger position to a virtual pull while preserving angle.
 * In the middle of the board assist=1. Near a screen edge, where the player
 * physically cannot drag the full distance behind the ball, the remaining
 * gesture is amplified just enough to make full power reachable.
 */
export function resolveShotPull(ball:Vec2,pointer:Vec2):ShotPull{
  const rawDx=ball.x-pointer.x,rawDy=ball.y-pointer.y,rawLength=Math.hypot(rawDx,rawDy);
  if(rawLength<0.0001)return{dx:0,dy:0,length:0,unitX:0,unitY:0,power:0,assist:1};
  const unitX=rawDx/rawLength,unitY=rawDy/rawLength;
  // Pointer travels opposite the shot direction.
  const pullX=-unitX,pullY=-unitY;
  let tx=Infinity,ty=Infinity;
  if(pullX<-.0001)tx=ball.x/-pullX;else if(pullX>.0001)tx=(DESIGN_WIDTH-ball.x)/pullX;
  if(pullY<-.0001)ty=ball.y/-pullY;else if(pullY>.0001)ty=(DESIGN_HEIGHT-ball.y)/pullY;
  const available=Math.max(MIN_EDGE_DISTANCE,Math.min(tx,ty));
  const fullPhysicalPull=GOLF_PHYSICS.maxPull/GOLF_PHYSICS.dragGain;
  const assist=available<fullPhysicalPull?Math.min(MAX_EDGE_ASSIST,fullPhysicalPull/available):1;
  const length=rawLength*assist;
  return{dx:unitX*length,dy:unitY*length,length,unitX,unitY,power:powerFromPhysicalPull(length),assist};
}
