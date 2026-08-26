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
  strokes: number;
  time: number;
  shots: SimulationShot[];
  state: GolfSimulationState;
}

interface SearchNode extends SolvedRun {
  score: number;
}

interface AuditRow {
  id: string;
  target: number;
  twoStar: number;
  bestKnownStrokes: number | null;
  bestKnownTime: number | null;
  holeInOne: boolean;
  primaryMechanic: CourseMechanic | null;
  mechanicUsed: boolean | null;
  trapsTriggered: string[];
  solvable: boolean;
  status: "OK" | "TOO_EASY_FOR_TARGET" | "MECHANIC_BYPASSED" | "NO_ROUTE_FOUND";
}

const clamp=(v:number,min:number,max:number):number=>Math.max(min,Math.min(max,v));
const dist=(a:{x:number;y:number},b:{x:number;y:number}):number=>Math.hypot(a.x-b.x,a.y-b.y);
const rad=(deg:number):number=>deg*Math.PI/180;
const wrap=(angle:number):number=>{
  const tau=Math.PI*2;
  return ((angle%tau)+tau)%tau;
};

function finalLevel(mode:GameMode,index:number):LevelDefinition {
  return sanitizeCourse(buildCampaignCourse(mode,index));
}

function routePoints(level:LevelDefinition):Vec2[] {
  return level.designPath?.length ? level.designPath : [level.ball,level.hole];
}

function nextRoutePoint(level:LevelDefinition,state:GolfSimulationState):Vec2 {
  const pts=routePoints(level);
  let nearest=0;
  let best=Number.POSITIVE_INFINITY;
  for(let i=0;i<pts.length;i+=1){
    const d=dist(state.ball,pts[i]!);
    if(d<best){best=d;nearest=i;}
  }
  return pts[Math.min(pts.length-1,nearest+1)] ?? level.hole;
}

function stateKey(state:GolfSimulationState):string {
  return [
    Math.round(state.ball.x/18),Math.round(state.ball.y/18),
    state.popWalls.map(x=>x.active?1:0).join(""),
    state.popBumpers.map(x=>x.active?1:0).join(""),
    state.popVoids.map(x=>x.active?1:0).join("")
  ].join(":");
}

function progressScore(level:LevelDefinition,state:GolfSimulationState):number {
  const hole=dist(state.ball,level.hole);
  const next=dist(state.ball,nextRoutePoint(level,state));
  const trapBonus=level.mode==="troll"&&state.triggeredTraps.length>0?-34:0;
  const mechanicBonus=level.primaryMechanic&&level.primaryMechanic!=="wall"&&state.touchedMechanics.includes(level.primaryMechanic)?-42:0;
  return hole+next*.18+state.time*1.1+trapBonus+mechanicBonus;
}

/** Dense, target-independent HIO sweep. This runs for every hole, including holes whose
 * authored mastery target is 2+ strokes. It is intentionally broad enough to discover
 * silly bypass lines rather than only validating the designer's expected route. */
function denseHoleInOne(level:LevelDefinition):SolvedRun|null {
  const start=createGolfSimulationState(level);
  const direct=Math.atan2(level.hole.y-level.ball.y,level.hole.x-level.ball.x);
  const powers=[.40,.50,.60,.70,.80,.90,1.00];
  const angles:number[]=[];

  // Global 1.5-degree sweep plus denser sub-degree samples around the obvious/direct line.
  for(let deg=0;deg<360;deg+=1.5)angles.push(rad(deg));
  for(let offset=-18;offset<=18;offset+=.6)angles.push(wrap(direct+rad(offset)));

  let best:SolvedRun|null=null;
  for(const angle of angles){
    for(const power of powers){
      const result=simulateShotToRest(level,start,{angle,power},10);
      if(!result.sunk)continue;
      const run:SolvedRun={strokes:1,time:result.state.time,shots:[{angle,power}],state:result.state};
      if(!best||run.time<best.time)best=run;
    }
  }
  return best;
}

function candidateShots(level:LevelDefinition,state:GolfSimulationState,depth:number):SimulationShot[] {
  const b=state.ball;
  const anchors=[level.hole,nextRoutePoint(level,state),...routePoints(level)].filter((p,i,a)=>a.findIndex(q=>dist(p,q)<8)===i);
  const shots:SimulationShot[]=[];
  const powers=depth===1?[.42,.56,.70,.84,1]:[.30,.42,.54,.66,.78,.90,1];

  for(const target of anchors){
    const base=Math.atan2(target.y-b.y,target.x-b.x);
    for(const offset of [-30,-20,-12,-7,-3,0,3,7,12,20,30]){
      for(const power of powers)shots.push({angle:wrap(base+rad(offset)),power});
    }
  }
  // A small global lattice allows bank shots that are not represented in designPath.
  for(let deg=0;deg<360;deg+=15){
    shots.push({angle:rad(deg),power:.62},{angle:rad(deg),power:.82},{angle:rad(deg),power:1});
  }
  return shots;
}

function beamSolve(level:LevelDefinition,maxDepth:number):SolvedRun|null {
  const initial:SearchNode={state:createGolfSimulationState(level),strokes:0,time:0,shots:[],score:0};
  let beam:SearchNode[]=[initial];

  for(let depth=1;depth<=maxDepth;depth+=1){
    const dedupe=new Map<string,SearchNode>();
    let solved:SolvedRun|null=null;

    for(const node of beam){
      for(const shot of candidateShots(level,node.state,depth)){
        const result=simulateShotToRest(level,node.state,shot,10);
        if(result.voided)continue;
        const strokes=node.strokes+1;
        const shots=[...node.shots,shot];
        if(result.sunk){
          const run:SolvedRun={strokes,time:result.state.time,shots,state:result.state};
          if(!solved||run.time<solved.time)solved=run;
          continue;
        }
        if(result.state.moving)continue;
        const candidate:SearchNode={
          state:result.state,
          strokes,
          time:result.state.time,
          shots,
          score:progressScore(level,result.state)
        };
        const key=stateKey(result.state);
        const old=dedupe.get(key);
        if(!old||candidate.score<old.score)dedupe.set(key,candidate);
      }
    }

    if(solved)return solved;
    beam=[...dedupe.values()].sort((a,b)=>a.score-b.score).slice(0,24);
    if(beam.length===0)break;
  }
  return null;
}

function mechanicWasUsed(level:LevelDefinition,run:SolvedRun|null):boolean|null {
  if(!run||!level.primaryMechanic||level.primaryMechanic==="wall")return null;
  return run.state.touchedMechanics.includes(level.primaryMechanic);
}

function classify(level:LevelDefinition,run:SolvedRun|null):AuditRow["status"] {
  if(!run)return "NO_ROUTE_FOUND";
  const mechanicUsed=mechanicWasUsed(level,run);
  const trapBypassed=level.mode==="troll"&&run.state.triggeredTraps.length===0;
  if(mechanicUsed===false||trapBypassed)return "MECHANIC_BYPASSED";
  const target=level.threeStar.maxStrokes??99;
  if(run.strokes<=target-2)return "TOO_EASY_FOR_TARGET";
  return "OK";
}

function audit(level:LevelDefinition):AuditRow {
  const hio=denseHoleInOne(level);
  const maxDepth=Math.max(4,(level.twoStar.maxStrokes??4)+1);
  const best=hio??beamSolve(level,maxDepth);
  const mechanicUsed=mechanicWasUsed(level,best);
  return {
    id:level.id,
    target:level.threeStar.maxStrokes??0,
    twoStar:level.twoStar.maxStrokes??0,
    bestKnownStrokes:best?.strokes??null,
    bestKnownTime:best?Number(best.time.toFixed(2)):null,
    holeInOne:Boolean(hio),
    primaryMechanic:level.primaryMechanic??null,
    mechanicUsed,
    trapsTriggered:best?.state.triggeredTraps??[],
    solvable:Boolean(best),
    status:classify(level,best)
  };
}

const rows:AuditRow[]=[];
for(const mode of ["classic","troll"] as const){
  console.log(`\n=== ${mode.toUpperCase()} ===`);
  for(let index=1;index<=40;index+=1){
    const level=finalLevel(mode,index);
    const row=audit(level);rows.push(row);
    const best=row.bestKnownStrokes===null?"?":String(row.bestKnownStrokes);
    const mechanic=row.primaryMechanic??"-";
    const used=row.mechanicUsed===null?"n/a":row.mechanicUsed?"yes":"NO";
    console.log(`${row.id.padEnd(10)} 3★=${String(row.target).padEnd(2)} best=${best.padEnd(2)} HIO=${row.holeInOne?"yes":"no "} main=${mechanic.padEnd(10)} used=${used.padEnd(3)} traps=${row.trapsTriggered.length} ${row.status}`);
  }
}

for(const mode of ["classic","troll"] as const){
  const section=rows.filter(x=>x.id.startsWith(mode));
  const clean=section.filter(x=>x.status==="OK").length;
  const bypass=section.filter(x=>x.status==="MECHANIC_BYPASSED").length;
  const easy=section.filter(x=>x.status==="TOO_EASY_FOR_TARGET").length;
  const broken=section.filter(x=>x.status==="NO_ROUTE_FOUND").length;
  console.log(`\n${mode.toUpperCase()} SUMMARY: ${clean}/40 clean · ${bypass} bypass · ${easy} target mismatch · ${broken} no-route`);
  for(const row of section.filter(x=>x.status!=="OK"))console.log(`FLAG ${row.id} ${row.status} target=${row.target} best=${row.bestKnownStrokes}`);
}

console.log(`\nAUDIT_JSON=${JSON.stringify(rows)}`);

// CI guards only physical/campaign regressions. Design warnings stay visible but non-fatal:
// the solver is evidence for the designer, not an optimisation target.
const fatal=rows.filter(x=>x.status==="NO_ROUTE_FOUND");
const firstThree=rows.filter(x=>/^classic-0[1-3]$/.test(x.id));
if(fatal.length>0||firstThree.some(x=>!x.holeInOne)){
  console.error(`\nAUDIT_FATAL: ${fatal.length} unsolved holes; opening Classic trio HIO=${firstThree.map(x=>x.holeInOne?"yes":"no").join(",")}`);
  process.exitCode=1;
}
