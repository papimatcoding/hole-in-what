import { GolfSimulation, evaluateHoleSweep } from "../src/systems/GolfSimulation";
import type { LevelDefinition, Vec2 } from "../src/types";

const hole={x:270,y:155};

const sweepChecks:[string,Vec2,{x:number;y:number;vx:number;vy:number},ReturnType<typeof evaluateHoleSweep>][]=[
  ["slow centred",{x:270,y:190},{x:270,y:166,vx:0,vy:-120},"sink"],
  ["medium centred",{x:270,y:190},{x:270,y:150,vx:0,vy:-300},"sink"],
  ["slow forgiving edge",{x:286,y:190},{x:286,y:145,vx:0,vy:-140},"sink"],
  ["very fast centred",{x:270,y:190},{x:270,y:145,vx:0,vy:-560},"pass"],
  ["outside edge graze",{x:292,y:190},{x:292,y:140,vx:0,vy:-230},"pass"],
  ["true rim graze",{x:288.5,y:190},{x:288.5,y:140,vx:0,vy:-280},"lip"],
  ["diagonal valid entry",{x:235,y:190},{x:278,y:147,vx:245,vy:-245},"sink"]
];

let failed=false;
for(const [name,previous,ball,expected] of sweepChecks){
  const actual=evaluateHoleSweep(previous,ball,hole),ok=actual===expected;
  console.log(`${ok?"PASS":"FAIL"} ${name}: ${actual} (expected ${expected})`);
  if(!ok)failed=true;
}

function simpleCupLevel():LevelDefinition{
  return{
    id:"hole-test",mode:"classic",group:1,ball:{x:270,y:230},hole,
    threeStar:{maxStrokes:1},twoStar:{maxStrokes:2},designPath:[{x:270,y:230},hole],primaryMechanic:"wall",
    fairways:[],walls:[],triangles:[],curves:[],movingWalls:[],movingBumpers:[],sand:[],ice:[],boosters:[],fans:[],winds:[],portals:[],ramps:[],trampolines:[],voids:[],bumpers:[],popWalls:[],popBumpers:[],popVoids:[]
  };
}

// Regression for the reported "only enters after N strokes" symptom: the simulation has no
// stroke-gated cup state. The same legal entry must sink from fresh and time-advanced states.
for(const elapsed of[0,1.5,5,12]){
  const sim=new GolfSimulation(simpleCupLevel());
  sim.state.time=elapsed;
  sim.launchVector(0,-260);
  for(let i=0;i<120&&!sim.state.sunk&&sim.state.moving;i+=1)sim.step(1/60);
  const ok=sim.state.sunk;
  console.log(`${ok?"PASS":"FAIL"} integration sink at simTime=${elapsed}s`);
  if(!ok)failed=true;
}

if(failed)process.exitCode=1;
