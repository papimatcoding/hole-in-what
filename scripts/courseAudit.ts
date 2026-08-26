import { buildCampaignCourse } from "../src/data/procedural/auditedCampaign";
import { sanitizeCourse } from "../src/data/procedural/courseUtils";
import {
  createGolfSimulationState,
  simulateShotToRest,
  type GolfSimulationState,
  type SimulationShot
} from "../src/systems/GolfSimulation";
import type { CourseMechanic, GameMode, LevelDefinition, Vec2 } from "../src/types";

interface SolvedRun {
  strokes:number;
  time:number;
  shots:SimulationShot[];
  state:GolfSimulationState;
}
interface SearchNode extends SolvedRun { score:number; }
interface AuditRow {
  id:string;
  target:number;
  twoStar:number;
  bestKnownStrokes:number|null;
  bestKnownTime:number|null;
  holeInOne:boolean;
  primaryMechanic:CourseMechanic|null;
  mechanicUsed:boolean|null;
  naiveTrapTriggered:boolean|null;
  trapsTriggered:string[];
  solvable:boolean;
  bestShots:string[];
  status:"OK"|"TOO_EASY_FOR_TARGET"|"MECHANIC_BYPASSED"|"NO_ROUTE_FOUND";
}

const clamp=(v:number,min:number,max:number):number=>Math.max(min,Math.min(max,v));
const dist=(a:{x:number;y:number},b:{x:number;y:number}):number=>Math.hypot(a.x-b.x,a.y-b.y);
const rad=(deg:number):number=>deg*Math.PI/180;
const deg=(radians:number):number=>radians*180/Math.PI;
const wrap=(angle:number):number=>{const tau=Math.PI*2;return((angle%tau)+tau)%tau;};

function finalLevel(mode:GameMode,index:number):LevelDefinition {
  return sanitizeCourse(buildCampaignCourse(mode,index));
}
function routePoints(level:LevelDefinition):Vec2[]{return level.designPath?.length?level.designPath:[level.ball,level.hole];}
function nextRoutePoint(level:LevelDefinition,state:GolfSimulationState):Vec2{
  const pts=routePoints(level);let nearest=0,best=Number.POSITIVE_INFINITY;
  for(let i=0;i<pts.length;i+=1){const d=dist(state.ball,pts[i]!);if(d<best){best=d;nearest=i;}}
  return pts[Math.min(pts.length-1,nearest+1)]??level.hole;
}
function stateKey(state:GolfSimulationState):string{
  return [Math.round(state.ball.x/18),Math.round(state.ball.y/18),state.popWalls.map(x=>x.active?1:0).join(""),state.popBumpers.map(x=>x.active?1:0).join(""),state.popVoids.map(x=>x.active?1:0).join("")].join(":");
}
function progressScore(level:LevelDefinition,state:GolfSimulationState):number{
  const hole=dist(state.ball,level.hole),next=dist(state.ball,nextRoutePoint(level,state));
  const trapBonus=level.mode==="troll"&&state.triggeredTraps.length>0?-34:0;
  const mechanicBonus=level.primaryMechanic&&state.touchedMechanics.includes(level.primaryMechanic)?-42:0;
  return hole+next*.18+state.time*1.1+trapBonus+mechanicBonus;
}

/** Dense, target-independent HIO sweep on every hole. */
function denseHoleInOne(level:LevelDefinition):SolvedRun|null{
  const start=createGolfSimulationState(level),direct=Math.atan2(level.hole.y-level.ball.y,level.hole.x-level.ball.x);
  const powers=[.36,.44,.52,.60,.68,.76,.84,.92,1.00],angles:number[]=[];
  for(let d=0;d<360;d+=1.5)angles.push(rad(d));
  for(let offset=-20;offset<=20;offset+=.5)angles.push(wrap(direct+rad(offset)));
  let best:SolvedRun|null=null;
  for(const angle of angles){for(const power of powers){const result=simulateShotToRest(level,start,{angle,power},10);if(!result.sunk)continue;const run:SolvedRun={strokes:1,time:result.state.time,shots:[{angle,power}],state:result.state};if(!best||run.time<best.time)best=run;}}
  return best;
}

function candidateShots(level:LevelDefinition,state:GolfSimulationState,depth:number):SimulationShot[]{
  const b=state.ball,anchors=[level.hole,nextRoutePoint(level,state),...routePoints(level)].filter((p,i,a)=>a.findIndex(q=>dist(p,q)<8)===i),shots:SimulationShot[]=[];
  const powers=depth===1?[.36,.48,.60,.72,.84,.96,1]:[.30,.40,.50,.60,.70,.80,.90,1];
  for(const target of anchors){const base=Math.atan2(target.y-b.y,target.x-b.x);for(const offset of[-34,-24,-16,-10,-6,-3,0,3,6,10,16,24,34])for(const power of powers)shots.push({angle:wrap(base+rad(offset)),power});}
  for(let d=0;d<360;d+=15)shots.push({angle:rad(d),power:.58},{angle:rad(d),power:.72},{angle:rad(d),power:.86},{angle:rad(d),power:1});
  return shots;
}

function beamSolve(level:LevelDefinition,maxDepth:number):SolvedRun|null{
  const initial:SearchNode={state:createGolfSimulationState(level),strokes:0,time:0,shots:[],score:0};let beam:SearchNode[]=[initial];
  for(let depth=1;depth<=maxDepth;depth+=1){const dedupe=new Map<string,SearchNode>();let solved:SolvedRun|null=null;
    for(const node of beam){for(const shot of candidateShots(level,node.state,depth)){const result=simulateShotToRest(level,node.state,shot,10);if(result.voided)continue;const strokes=node.strokes+1,shots=[...node.shots,shot];
      if(result.sunk){const run:SolvedRun={strokes,time:result.state.time,shots,state:result.state};if(!solved||run.time<solved.time)solved=run;continue;}
      if(result.state.moving)continue;const candidate:SearchNode={state:result.state,strokes,time:result.state.time,shots,score:progressScore(level,result.state)},key=stateKey(result.state),old=dedupe.get(key);if(!old||candidate.score<old.score)dedupe.set(key,candidate);
    }}
    if(solved)return solved;beam=[...dedupe.values()].sort((a,b)=>a.score-b.score).slice(0,30);if(beam.length===0)break;
  }
  return null;
}

function hasTrollTrap(level:LevelDefinition):boolean{return (level.popWalls?.length??0)+(level.popBumpers?.length??0)+(level.popVoids?.length??0)>0;}

/**
 * Tests the tempting first read, not the learned route. Avoiding a trap on a mastery run
 * is valid; a trap is bypassed when even obvious first-attempt shots never wake it up.
 */
function naiveTrapProbe(level:LevelDefinition):boolean|null{
  if(level.mode!=="troll"||!hasTrollTrap(level))return null;
  const start=createGolfSimulationState(level),targets=[level.hole,level.designPath?.[0]??level.hole],powers=[.52,.68,.84,1];
  for(const target of targets){const base=Math.atan2(target.y-level.ball.y,target.x-level.ball.x);for(const offset of[-8,-4,0,4,8])for(const power of powers){const result=simulateShotToRest(level,start,{angle:wrap(base+rad(offset)),power},6);if(result.state.triggeredTraps.length>0)return true;}}
  return false;
}

function mechanicWasUsed(level:LevelDefinition,run:SolvedRun|null):boolean|null{
  if(!run||!level.primaryMechanic||level.primaryMechanic==="wall")return null;
  return run.state.touchedMechanics.includes(level.primaryMechanic);
}

/** Contact is meaningful for traversal/redirection mechanics. Hazards and moving obstacles
 * can be mastered by deliberately avoiding them, so lack of contact is evidence, not failure. */
function contactExpected(mechanic:CourseMechanic|null):boolean{
  return mechanic!==null&&["bumper","booster","fan","curve","portal","ramp","trampoline"].includes(mechanic);
}

function levelIndex(level:LevelDefinition):number{const n=Number(level.id.split("-").at(-1));return Number.isFinite(n)?n:1;}

function classify(level:LevelDefinition,run:SolvedRun|null,naiveTrapTriggered:boolean|null):AuditRow["status"]{
  if(!run)return"NO_ROUTE_FOUND";
  const mechanicUsed=mechanicWasUsed(level,run),index=levelIndex(level);
  // Classic teaches its declared primary traversal mechanic. In early HARD the troll beat
  // is the main lesson; from HARD 11 onward both trap literacy and the visible mechanic matter.
  const requirePrimary=contactExpected(level.primaryMechanic??null)&&(level.mode==="classic"||index>=11);
  if(requirePrimary&&mechanicUsed===false)return"MECHANIC_BYPASSED";
  if(level.mode==="troll"&&naiveTrapTriggered===false)return"MECHANIC_BYPASSED";
  const target=level.threeStar.maxStrokes??99;
  if(run.strokes<=target-2)return"TOO_EASY_FOR_TARGET";
  return"OK";
}

function shotLabel(shot:SimulationShot):string{return`${Math.round(deg(shot.angle))}°@${shot.power.toFixed(2)}`;}
function audit(level:LevelDefinition):AuditRow{
  const hio=denseHoleInOne(level),maxDepth=Math.max(4,(level.twoStar.maxStrokes??4)+1),beam=beamSolve(level,maxDepth);
  const best=hio??beam,naiveTrapTriggered=naiveTrapProbe(level),mechanicUsed=mechanicWasUsed(level,best);
  return{id:level.id,target:level.threeStar.maxStrokes??0,twoStar:level.twoStar.maxStrokes??0,bestKnownStrokes:best?.strokes??null,bestKnownTime:best?Number(best.time.toFixed(2)):null,holeInOne:Boolean(hio)||best?.strokes===1,primaryMechanic:level.primaryMechanic??null,mechanicUsed,naiveTrapTriggered,trapsTriggered:best?.state.triggeredTraps??[],solvable:Boolean(best),bestShots:best?.shots.map(shotLabel)??[],status:classify(level,best,naiveTrapTriggered)};
}

const rows:AuditRow[]=[];
for(const mode of["classic","troll"]as const){console.log(`\n=== ${mode.toUpperCase()} ===`);for(let index=1;index<=40;index+=1){const row=audit(finalLevel(mode,index));rows.push(row);const best=row.bestKnownStrokes===null?"?":String(row.bestKnownStrokes),mechanic=row.primaryMechanic??"-",used=row.mechanicUsed===null?"n/a":row.mechanicUsed?"yes":"NO",naive=row.naiveTrapTriggered===null?"n/a":row.naiveTrapTriggered?"yes":"NO";console.log(`${row.id.padEnd(10)} 3★=${String(row.target).padEnd(2)} best=${best.padEnd(2)} HIO=${row.holeInOne?"yes":"no "} main=${mechanic.padEnd(10)} used=${used.padEnd(3)} naiveTrap=${naive.padEnd(3)} bestShot=${(row.bestShots[0]??"-").padEnd(10)} ${row.status}`);}}

for(const mode of["classic","troll"]as const){const section=rows.filter(x=>x.id.startsWith(mode)),clean=section.filter(x=>x.status==="OK").length,bypass=section.filter(x=>x.status==="MECHANIC_BYPASSED").length,easy=section.filter(x=>x.status==="TOO_EASY_FOR_TARGET").length,broken=section.filter(x=>x.status==="NO_ROUTE_FOUND").length;console.log(`\n${mode.toUpperCase()} SUMMARY: ${clean}/40 clean · ${bypass} bypass · ${easy} target mismatch · ${broken} no-route`);for(const row of section.filter(x=>x.status!=="OK"))console.log(`FLAG ${row.id} ${row.status} target=${row.target} best=${row.bestKnownStrokes} shot=${row.bestShots.join(",")}`);}
console.log(`\nAUDIT_JSON=${JSON.stringify(rows)}`);

// CI guards physical/campaign regressions only. Design warnings remain non-fatal.
const fatal=rows.filter(x=>x.status==="NO_ROUTE_FOUND"),firstThree=rows.filter(x=>/^classic-0[1-3]$/.test(x.id));
if(fatal.length>0||firstThree.some(x=>!x.holeInOne)){console.error(`\nAUDIT_FATAL: ${fatal.length} unsolved holes; opening Classic trio HIO=${firstThree.map(x=>x.holeInOne?"yes":"no").join(",")}`);process.exitCode=1;}
