import { GOLF_PHYSICS, GolfSimulation, type SimulationShot } from "./GolfSimulation";
import type { LevelDefinition, Vec2 } from "../types";

const clamp=(v:number,a:number,b:number):number=>Math.max(a,Math.min(b,v));

function distanceToSegment(p:Vec2,a:Vec2,b:Vec2):number{
  const dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy||1;
  const q=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/len2,0,1);
  return Math.hypot(p.x-(a.x+dx*q),p.y-(a.y+dy*q));
}

/**
 * Returns true when the ball centre enters space that a moving obstacle can physically occupy
 * during its cycle. This is intentionally different from a collision: timing a gate correctly
 * should count as interacting with the mechanic even when the player never touches the wall.
 */
export function pointInMovingSweep(level:LevelDefinition,p:Vec2,margin=GOLF_PHYSICS.ballRadius+1):boolean{
  for(const wall of level.movingWalls??[]){
    const amplitude=Math.abs(wall.amplitude);
    const x=wall.axis==="x"?wall.x-amplitude:wall.x;
    const y=wall.axis==="y"?wall.y-amplitude:wall.y;
    const w=wall.w+(wall.axis==="x"?amplitude*2:0);
    const h=wall.h+(wall.axis==="y"?amplitude*2:0);
    if(p.x>=x-margin&&p.x<=x+w+margin&&p.y>=y-margin&&p.y<=y+h+margin)return true;
  }
  for(const bumper of level.movingBumpers??[]){
    const amplitude=Math.abs(bumper.amplitude),radius=bumper.r+margin;
    const a:Vec2=bumper.axis==="x"?{x:bumper.x-amplitude,y:bumper.y}:{x:bumper.x,y:bumper.y-amplitude};
    const b:Vec2=bumper.axis==="x"?{x:bumper.x+amplitude,y:bumper.y}:{x:bumper.x,y:bumper.y+amplitude};
    if(distanceToSegment(p,a,b)<=radius)return true;
  }
  return false;
}

/** Replay an authored solution at runtime fidelity and ask whether it actually traverses a moving
 * obstacle's sweep. Airborne crossings do not count because the ground obstacle cannot constrain them. */
export function routeTraversesMovingSweep(level:LevelDefinition,shots:SimulationShot[],maxSecondsPerShot=12):boolean{
  if(!(level.movingWalls?.length||level.movingBumpers?.length)||!shots.length)return false;
  const sim=new GolfSimulation(level);
  for(const shot of shots){
    if(!sim.launch(shot.angle,shot.power))return false;
    const startTime=sim.state.time;
    while(sim.state.moving&&!sim.state.sunk&&!sim.state.voided&&sim.state.time-startTime<maxSecondsPerShot){
      sim.step(1/60);
      if(!sim.isAirborne()&&pointInMovingSweep(level,{x:sim.state.ball.x,y:sim.state.ball.y}))return true;
    }
    if(sim.state.voided||sim.state.sunk)break;
  }
  return false;
}
