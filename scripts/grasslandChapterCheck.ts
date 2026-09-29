import assert from "node:assert/strict";
import { levelsForMode } from "../src/data/campaign";
import { createGolfSimulationState, simulateShotToRest } from "../src/systems/GolfSimulation";
import type { RectDef, Vec2 } from "../src/types";

const levels=levelsForMode("classic").slice(0,10);
const BALL_RADIUS=13;
const TRAP_MARGIN=8;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function pointSegmentDistance(p:Vec2,a:Vec2,b:Vec2):number{const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy||1,q=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/len,0,1);return Math.hypot(p.x-(a.x+dx*q),p.y-(a.y+dy*q));}
function pathDistance(p:Vec2,path:Vec2[]):number{let best=Infinity;for(let i=1;i<path.length;i++)best=Math.min(best,pointSegmentDistance(p,path[i-1]!,path[i]!));return best;}
function pathTouchesRect(path:Vec2[],rect:RectDef):boolean{const pad=BALL_RADIUS+TRAP_MARGIN;for(let i=1;i<path.length;i++){const a=path[i-1]!,b=path[i]!;const steps=Math.max(10,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/12));for(let s=0;s<=steps;s++){const q=s/steps,x=a.x+(b.x-a.x)*q,y=a.y+(b.y-a.y)*q;if(x>=rect.x-pad&&x<=rect.x+rect.w+pad&&y>=rect.y-pad&&y<=rect.y+rect.h+pad)return true;}}return false;}
assert.equal(levels.length,10,"Grassland must contain exactly 10 holes");

const disallowed=[
  ["sand",(level:any)=>level.sand],
  ["ice",(level:any)=>level.ice],
  ["boosters",(level:any)=>level.boosters],
  ["fans",(level:any)=>level.fans],
  ["winds",(level:any)=>level.winds],
  ["portals",(level:any)=>level.portals],
  ["movingWalls",(level:any)=>level.movingWalls],
  ["movingBumpers",(level:any)=>level.movingBumpers],
  ["voids",(level:any)=>level.voids],
  ["trampolines",(level:any)=>level.trampolines]
] as const;

levels.forEach((level,index)=>{
  assert.equal(level.id,`classic-${String(index+1).padStart(2,"0")}`,`Grassland order mismatch at ${index+1}`);
  assert(level.trollArchetype,`${level.id} must have a troll archetype`);
  assert((level.popWalls?.length??0)+(level.popBumpers?.length??0)+(level.popVoids?.length??0)>0,`${level.id} must contain a visible troll beat`);
  const bait=level.baitPath;
  assert((bait?.length??0)>=2,`${level.id} must declare a baitPath for trap validation`);
  assert(Math.hypot(bait![0]!.x-level.ball.x,bait![0]!.y-level.ball.y)<2,`${level.id} baitPath must start at the ball`);
  assert(Math.hypot(bait!.at(-1)!.x-level.hole.x,bait!.at(-1)!.y-level.hole.y)<2,`${level.id} baitPath must end at the hole`);
  for(const [trapIndex,trap] of (level.popWalls??[]).entries()){
    assert(pathDistance({x:trap.triggerX,y:trap.triggerY},bait!)<=trap.triggerRadius+TRAP_MARGIN,`${level.id} popWall[${trapIndex}] trigger misses its bait route`);
    assert(pathTouchesRect(bait!,trap),`${level.id} popWall[${trapIndex}] is decorative: it does not obstruct its bait route`);
  }
  for(const [trapIndex,trap] of (level.popBumpers??[]).entries()){
    assert(pathDistance({x:trap.triggerX,y:trap.triggerY},bait!)<=trap.triggerRadius+TRAP_MARGIN,`${level.id} popBumper[${trapIndex}] trigger misses its bait route`);
    assert(pathDistance({x:trap.x,y:trap.y},bait!)<=trap.r+BALL_RADIUS+TRAP_MARGIN,`${level.id} popBumper[${trapIndex}] is decorative: it does not obstruct its bait route`);
  }
  for(const [trapIndex,trap] of (level.popVoids??[]).entries()){
    assert(pathDistance({x:trap.triggerX,y:trap.triggerY},bait!)<=trap.triggerRadius+TRAP_MARGIN,`${level.id} popVoid[${trapIndex}] trigger misses its bait route`);
    assert(pathTouchesRect(bait!,trap),`${level.id} popVoid[${trapIndex}] is decorative: it does not cover its bait route`);
  }
  assert([undefined,"wall","bumper","ramp"].includes(level.primaryMechanic),`${level.id} uses a mechanic outside Grassland vocabulary`);
  for(const [name,read] of disallowed)assert.equal(read(level)?.length??0,0,`${level.id} must not use ${name}`);
});

assert.equal(levels[0]!.onboarding,true,"Grassland 01 remains onboarding");
for(let i=0;i<7;i++)assert.equal(levels[i]!.ramps?.length??0,0,`${levels[i]!.id} introduces ramps too early`);
for(let i=7;i<10;i++)assert((levels[i]!.ramps?.length??0)>0,`${levels[i]!.id} should belong to the ramp finale`);

const shot=(degrees:number,power:number)=>({angle:degrees*Math.PI/180,power});
const c4=levels[3]!,c4Start=simulateShotToRest(c4,createGolfSimulationState(c4),shot(344,.38),8).state;
assert(simulateShotToRest(c4,c4Start,shot(249,.94),8).sunk,"C04's corner bank must offer a successful alternative shot");
assert(!simulateShotToRest({...c4,triangles:[]},c4Start,shot(249,.94),8).sunk,"C04's bank must change that shot, not decorate it");
assert.equal(c4.triangles![0]!.a.y,c4.walls![0]!.y,"C04 bank must join the wall top");

const c6=levels[5]!,c6Bait=shot(220,.8),c6Blocked=simulateShotToRest(c6,createGolfSimulationState(c6),c6Bait,8),c6Open=simulateShotToRest({...c6,popWalls:[]},createGolfSimulationState(c6),c6Bait,8);
assert(c6Blocked.state.triggeredTraps.includes("wall:0"),"C06 gate must activate after the tempting shot");
assert(Math.hypot(c6Blocked.state.ball.x-c6Open.state.ball.x,c6Blocked.state.ball.y-c6Open.state.ball.y)>150,"C06 gate must change the route to the left bumper");
assert.equal(c6.popWalls![0]!.y,c6.walls![0]!.y+c6.walls![0]!.h,"C06 gate must grow from the fixed wall");
assert(Math.hypot(c6.ball.x-c6.popWalls![0]!.triggerX,c6.ball.y-c6.popWalls![0]!.triggerY)>c6.popWalls![0]!.triggerRadius,"C06 gate must stay hidden at spawn");

const c7=levels[6]!,curveShot=shot(324,1),withCurve=simulateShotToRest(c7,createGolfSimulationState(c7),curveShot,8),withoutCurve=simulateShotToRest({...c7,curves:[]},createGolfSimulationState(c7),curveShot,8);
assert(withCurve.state.touchedMechanics.includes("curve"),"C07's curve must participate in a plausible first shot");
assert(Math.hypot(withCurve.state.ball.x-withoutCurve.state.ball.x,withCurve.state.ball.y-withoutCurve.state.ball.y)>60,"C07's curve must change that route");
assert.equal(c7.curves![0]!.y-c7.curves![0]!.r,c7.walls![1]!.y+c7.walls![1]!.h,"C07 curve must meet the upper wall");
assert(c7.walls![0]!.y-(c7.curves![0]!.y+Math.sin(c7.curves![0]!.endAngle)*c7.curves![0]!.r)>40,"C07 curve must leave a playable gap before the lower wall");

const c9=levels[8]!,shortcut=shot(292,.5);
assert(simulateShotToRest({...c9,popWalls:[]},createGolfSimulationState(c9),shortcut,8).sunk,"C09 bait must look like a real hole-in-one route");
assert(!simulateShotToRest(c9,createGolfSimulationState(c9),shortcut,8).sunk,"C09 gate must deny that shortcut after it appears");
assert.equal(c9.popWalls![0]!.x,c9.walls![2]!.x+c9.walls![2]!.w,"C09 gate must continue the upper wall");

const c10=levels[9]!,finaleBait=shot(40,1);
const floorDrop=simulateShotToRest(c10,createGolfSimulationState(c10),finaleBait,8);
assert(floorDrop.voided&&floorDrop.events.some(event=>event.kind==="trap-void"),"C10's tempting bank shot must visibly force a retry");
assert(simulateShotToRest({...c10,popVoids:[]},createGolfSimulationState(c10),finaleBait,8).sunk,"C10's floor drop must deny a genuine one-shot route");
assert.equal(c10.popVoids![0]!.y+c10.popVoids![0]!.h,c10.walls![2]!.y,"C10 floor drop must meet the upper wall");

console.log("PASS Grassland contract: 10 troll holes · trap consequences and useful banks · geometry/bumpers/ramp and finale floor drop");
