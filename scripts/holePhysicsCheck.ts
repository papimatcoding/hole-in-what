import { evaluateHoleInteraction } from "../src/systems/GolfSimulation";

const hole={x:270,y:155};
const checks:[string,ReturnType<typeof evaluateHoleInteraction>,ReturnType<typeof evaluateHoleInteraction>][]=[
  ["slow centred",evaluateHoleInteraction({x:270,y:166,vx:0,vy:-120},hole),"sink"],
  ["medium centred",evaluateHoleInteraction({x:270,y:166,vx:0,vy:-300},hole),"sink"],
  ["very fast centred",evaluateHoleInteraction({x:270,y:166,vx:0,vy:-560},hole),"pass"],
  ["edge graze",evaluateHoleInteraction({x:292,y:155,vx:0,vy:-230},hole),"pass"],
  ["rim inward",evaluateHoleInteraction({x:290,y:155,vx:-280,vy:0},hole),"lip"]
];

let failed=false;
for(const [name,actual,expected] of checks){
  const ok=actual===expected;
  console.log(`${ok?"PASS":"FAIL"} ${name}: ${actual} (expected ${expected})`);
  if(!ok)failed=true;
}
if(failed)process.exitCode=1;
