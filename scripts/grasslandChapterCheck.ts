import assert from "node:assert/strict";
import { levelsForMode } from "../src/data/campaign";
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
  ["popVoids",(level:any)=>level.popVoids],
  ["trampolines",(level:any)=>level.trampolines]
] as const;

levels.forEach((level,index)=>{
  assert.equal(level.id,`classic-${String(index+1).padStart(2,"0")}`,`Grassland order mismatch at ${index+1}`);
  assert(level.trollArchetype,`${level.id} must have a troll archetype`);
  assert((level.popWalls?.length??0)+(level.popBumpers?.length??0)>0,`${level.id} must contain a visible troll beat`);
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
  assert([undefined,"wall","bumper","ramp"].includes(level.primaryMechanic),`${level.id} uses a mechanic outside Grassland vocabulary`);
  for(const [name,read] of disallowed)assert.equal(read(level)?.length??0,0,`${level.id} must not use ${name}`);
});

assert.equal(levels[0]!.onboarding,true,"Grassland 01 remains onboarding");
for(let i=0;i<7;i++)assert.equal(levels[i]!.ramps?.length??0,0,`${levels[i]!.id} introduces ramps too early`);
for(let i=7;i<10;i++)assert((levels[i]!.ramps?.length??0)>0,`${levels[i]!.id} should belong to the ramp finale`);

console.log("PASS Grassland contract: 10 troll holes · bait routes validated · traps obstruct their bait · geometry/bumpers/ramp only · ramps reserved for 08–10");
