import assert from "node:assert/strict";
import { levelsForMode } from "../src/data/campaign";

const levels=levelsForMode("classic").slice(0,10);
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
  assert([undefined,"wall","bumper","ramp"].includes(level.primaryMechanic),`${level.id} uses a mechanic outside Grassland vocabulary`);
  for(const [name,read] of disallowed)assert.equal(read(level)?.length??0,0,`${level.id} must not use ${name}`);
});

assert.equal(levels[0]!.onboarding,true,"Grassland 01 remains onboarding");
for(let i=0;i<7;i++)assert.equal(levels[i]!.ramps?.length??0,0,`${levels[i]!.id} introduces ramps too early`);
for(let i=7;i<10;i++)assert((levels[i]!.ramps?.length??0)>0,`${levels[i]!.id} should belong to the ramp finale`);

console.log("PASS Grassland contract: 10 troll holes · geometry/bumpers/ramp only · ramps reserved for 08–10");
