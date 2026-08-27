import { levelsForMode } from "../src/data/campaign";
import { analyzeCourseClearance } from "../src/systems/CourseValidation";
import {
  createGolfSimulationState,
  simulateShotToRest,
  type GolfSimulationState,
  type SimulationShot
} from "../src/systems/GolfSimulation";
import type { CourseMechanic, LevelDefinition, Vec2 } from "../src/types";

interface SolvedRun{strokes:number;time:number;shots:SimulationShot[];state:GolfSimulationState;}
interface SearchNode extends SolvedRun{score:number;}
type AuditStatus="OK"|"TOO_EASY_FOR_TARGET"|"MECHANIC_BYPASSED"|"NO_ROUTE_FOUND";
interface AuditRow{
  id:string;target:number;twoStar:number;bestKnownStrokes:number|null;blindKnownStrokes:number|null;bestKnownTime:number|null;holeInOne:boolean;
  primaryMechanic:CourseMechanic|null;mechanicUsed:boolean|null;naiveTrapTriggered:boolean|null;trapsTriggered:string[];
  solvable:boolean;bestShots:string[];blindShots:string[];robustness:number|null;difficultyScore:number|null;clearanceBlockingStates:string[];warnings:string[];status:AuditStatus;
}

const dist=(a:{x:number;y:number},b:{x:number;y:number}):number=>Math.hypot(a.x-b.x,a.y-b.y);
const rad=(d:number):number=>d*Math.PI/180;
const deg=(a:number):number=>a*180/Math.PI;
const wrap=(a:number):number=>{const t=Math.PI*2;return((a%t)+t)%t;};
const clamp=(v:number,a:number,b:number):number=>Math.max(a,Math.min(b,v));

function routePoints(level:LevelDefinition):Vec2[]{return level.designPath?.length?[level.ball,...level.designPath.filter(p=>dist(p,level.ball)>4),level.hole]:[level.ball,level.hole];}
function nextRoutePoint(level:LevelDefinition,state:GolfSimulationState):Vec2{
  const pts=routePoints(level);let nearest=0,best=Infinity;for(let i=0;i<pts.length;i++){const d=dist(state.ball,pts[i]!);if(d<best){best=d;nearest=i;}}
  return pts[Math.min(pts.length-1,nearest+1)]??level.hole;
}
function stateKey(state:GolfSimulationState):string{return[Math.round(state.ball.x/18),Math.round(state.ball.y/18),state.popWalls.map(x=>x.active?1:0).join(""),state.popBumpers.map(x=>x.active?1:0).join(""),state.popVoids.map(x=>x.active?1:0).join("")].join(":");}
function progressScore(level:LevelDefinition,state:GolfSimulationState):number{
  const hole=dist(state.ball,level.hole),next=dist(state.ball,nextRoutePoint(level,state));
  const trapBonus=level.mode==="troll"&&state.triggeredTraps.length>0?-42:0;
  const mechanicBonus=level.primaryMechanic&&state.touchedMechanics.includes(level.primaryMechanic)?-28:0;
  return hole+next*.22+state.time*.8+trapBonus+mechanicBonus;
}
function blindProgressScore(level:LevelDefinition,state:GolfSimulationState):number{
  const hole=dist(state.ball,level.hole);
  const trapBonus=level.mode==="troll"&&state.triggeredTraps.length>0?-20:0;
  return hole+state.time*.7+trapBonus;
}

function denseHoleInOne(level:LevelDefinition):SolvedRun|null{
  const start=createGolfSimulationState(level),direct=Math.atan2(level.hole.y-level.ball.y,level.hole.x-level.ball.x),angles:number[]=[];
  for(let d=0;d<360;d+=2)angles.push(rad(d));for(let d=-24;d<=24;d+=.5)angles.push(wrap(direct+rad(d)));
  const powers=[.34,.42,.50,.58,.66,.74,.82,.90,.96,1];let best:SolvedRun|null=null;
  for(const angle of angles)for(const power of powers){const result=simulateShotToRest(level,start,{angle,power},10);if(!result.sunk)continue;const run={strokes:1,time:result.state.time,shots:[{angle,power}],state:result.state};if(!best||run.time<best.time)best=run;}
  return best;
}

function candidateShots(level:LevelDefinition,state:GolfSimulationState):SimulationShot[]{
  const b=state.ball,anchors=[level.hole,nextRoutePoint(level,state),...routePoints(level)].filter((p,i,a)=>a.findIndex(q=>dist(p,q)<8)===i),out:SimulationShot[]=[];
  const powers=[.30,.40,.50,.60,.70,.80,.90,1];
  for(const target of anchors){const base=Math.atan2(target.y-b.y,target.x-b.x);for(const offset of[-38,-28,-20,-14,-9,-5,-2,0,2,5,9,14,20,28,38])for(const power of powers)out.push({angle:wrap(base+rad(offset)),power});}
  for(let d=0;d<360;d+=18)for(const power of[.45,.62,.78,.94])out.push({angle:rad(d),power});return out;
}
function blindCandidateShots(level:LevelDefinition,state:GolfSimulationState):SimulationShot[]{
  const b=state.ball,out:SimulationShot[]=[],direct=Math.atan2(level.hole.y-b.y,level.hole.x-b.x),powers=[.32,.46,.60,.74,.88,1];
  for(const offset of[-45,-32,-22,-14,-8,-4,0,4,8,14,22,32,45])for(const power of powers)out.push({angle:wrap(direct+rad(offset)),power});
  for(let d=0;d<360;d+=15)for(const power of[.42,.58,.76,.94])out.push({angle:rad(d),power});
  return out;
}

function solve(level:LevelDefinition,maxDepth:number,mode:"guided"|"blind"):SolvedRun|null{
  let beam:SearchNode[]=[{state:createGolfSimulationState(level),strokes:0,time:0,shots:[],score:0}];
  const width=mode==="guided"?170:82;
  for(let depth=1;depth<=maxDepth;depth++){
    const dedupe=new Map<string,SearchNode>();let solved:SolvedRun|null=null;
    for(const node of beam)for(const shot of mode==="guided"?candidateShots(level,node.state):blindCandidateShots(level,node.state)){
      const result=simulateShotToRest(level,node.state,shot,10);if(result.voided)continue;const strokes=node.strokes+1,shots=[...node.shots,shot];
      if(result.sunk){const run={strokes,time:result.state.time,shots,state:result.state};if(!solved||run.time<solved.time)solved=run;continue;}if(result.state.moving)continue;
      const candidate:SearchNode={state:result.state,strokes,time:result.state.time,shots,score:mode==="guided"?progressScore(level,result.state):blindProgressScore(level,result.state)},key=stateKey(result.state),old=dedupe.get(key);if(!old||candidate.score<old.score)dedupe.set(key,candidate);
    }
    if(solved)return solved;beam=[...dedupe.values()].sort((a,b)=>a.score-b.score).slice(0,width);if(beam.length===0)break;
  }return null;
}

function replay(level:LevelDefinition,shots:SimulationShot[]):GolfSimulationState|null{
  let state=createGolfSimulationState(level);for(const shot of shots){const result=simulateShotToRest(level,state,shot,10);state=result.state;if(result.voided)return null;if(result.sunk)return state;}return null;
}
function solutionRobustness(level:LevelDefinition,best:SolvedRun|null):number|null{
  if(!best)return null;let success=0,total=0;const angleDelta=[-5,-2.5,0,2.5,5],powerDelta=[-.06,-.03,0,.03,.06];
  for(let shotIndex=0;shotIndex<best.shots.length;shotIndex++)for(const da of angleDelta)for(const dp of powerDelta){const variant=best.shots.map(x=>({...x}));const s=variant[shotIndex]!;s.angle=wrap(s.angle+rad(da));s.power=clamp(s.power+dp,.18,1);total++;const end=replay(level,variant);if(end?.sunk)success++;}
  return total?success/total:null;
}
function trapRepresentsMechanic(level:LevelDefinition,best:SolvedRun|null):boolean{
  if(!best||!level.primaryMechanic)return false;
  if(level.primaryMechanic==="bumper")return best.state.triggeredTraps.some(x=>x.startsWith("bumper:"));
  if(level.primaryMechanic==="void")return best.state.triggeredTraps.some(x=>x.startsWith("void:"));
  if(level.primaryMechanic==="wall")return best.state.triggeredTraps.some(x=>x.startsWith("wall:"));
  return false;
}
function mechanicWasUsed(level:LevelDefinition,best:SolvedRun|null):boolean|null{
  if(!best||!level.primaryMechanic||level.primaryMechanic==="wall")return null;
  return best.state.touchedMechanics.includes(level.primaryMechanic)||trapRepresentsMechanic(level,best);
}
function naiveTrapProbe(level:LevelDefinition):boolean|null{
  if(level.mode!=="troll")return null;const targets=[level.hole,routePoints(level)[1]??level.hole];
  for(const target of targets)for(const power of[.68,.84,1]){const angle=Math.atan2(target.y-level.ball.y,target.x-level.ball.x),result=simulateShotToRest(level,createGolfSimulationState(level),{angle,power},5);if(result.state.triggeredTraps.length>0)return true;}
  return false;
}
function rawComplexity(level:LevelDefinition):number{
  return Math.min(9,(level.walls?.length??0)*.35)+(level.bumpers?.length??0)*1.5+(level.sand?.length??0)*1.1+(level.ice?.length??0)*1.3+(level.fans?.length??0)*1.8+(level.boosters?.length??0)*1.6+(level.curves?.length??0)*2+(level.portals?.length??0)*2.4+(level.movingWalls?.length??0)*2.5+(level.movingBumpers?.length??0)*2.5+(level.voids?.length??0)*2+(level.ramps?.length??0)*2.4+(level.trampolines?.length??0)*2.2+(level.popWalls?.length??0)*2.6+(level.popBumpers?.length??0)*2.6+(level.popVoids?.length??0)*2.8;
}
function difficultyScore(level:LevelDefinition,best:SolvedRun|null,robust:number|null):number|null{
  if(!best)return null;const precision=robust===null?5:(1-robust)*10,mode=level.mode==="troll"?6:0;
  return Number((best.strokes*12+precision+rawComplexity(level)+mode).toFixed(1));
}
function classify(level:LevelDefinition,best:SolvedRun|null,naiveTrap:boolean|null,clearanceBlockingStates:string[]):AuditStatus{
  if(!best||clearanceBlockingStates.length>0)return"NO_ROUTE_FOUND";
  const target=level.threeStar.maxStrokes??best.strokes;
  if(level.mode==="troll"&&naiveTrap===false)return"MECHANIC_BYPASSED";
  if(level.primaryMechanic&&level.primaryMechanic!=="wall"&&!best.state.touchedMechanics.includes(level.primaryMechanic)&&!trapRepresentsMechanic(level,best))return"MECHANIC_BYPASSED";
  if(best.strokes<=target-2)return"TOO_EASY_FOR_TARGET";
  return"OK";
}
function warningsFor(level:LevelDefinition,best:SolvedRun|null,blind:SolvedRun|null,robust:number|null,clearanceBlockingStates:string[]):string[]{
  const warnings:string[]=[];const target=level.threeStar.maxStrokes??best?.strokes??0;
  if(clearanceBlockingStates.length)warnings.push(`CLEARANCE_BLOCKED:${clearanceBlockingStates.join("+")}`);
  if(best&&blind&&blind.strokes>best.strokes+1)warnings.push(`GUIDED_ROUTE_ONLY:${best.strokes}->${blind.strokes}`);
  if(best&&!blind&&best.strokes>1)warnings.push("GUIDED_ROUTE_ONLY:no-blind-route");
  if(best?.strokes===1&&target>1&&(robust??0)>.22)warnings.push(`BROAD_HIO:${Math.round((robust??0)*100)}%`);
  if(level.mode==="troll"&&best&&best.state.triggeredTraps.length===0)warnings.push("TROLL_SOLVES_WITHOUT_TRAP");
  return warnings;
}
function shotLabel(s:SimulationShot):string{return`${Math.round(deg(s.angle))}°@${s.power.toFixed(2)}`;}
function audit(level:LevelDefinition):AuditRow{
  const clearance=analyzeCourseClearance(level),clearanceBlockingStates=clearance.blockingStates.filter(x=>!x.startsWith("moving@"));
  const hio=denseHoleInOne(level),guided=hio??solve(level,Math.max(5,(level.twoStar.maxStrokes??4)+1),"guided"),blind=hio??solve(level,Math.max(5,(level.twoStar.maxStrokes??4)+1),"blind"),best=guided,naive=naiveTrapProbe(level),robust=solutionRobustness(level,best),difficulty=difficultyScore(level,best,robust),warnings=warningsFor(level,best,blind,robust,clearanceBlockingStates);
  return{id:level.id,target:level.threeStar.maxStrokes??0,twoStar:level.twoStar.maxStrokes??0,bestKnownStrokes:best?.strokes??null,blindKnownStrokes:blind?.strokes??null,bestKnownTime:best?Number(best.time.toFixed(2)):null,holeInOne:Boolean(hio)||best?.strokes===1,primaryMechanic:level.primaryMechanic??null,mechanicUsed:mechanicWasUsed(level,best),naiveTrapTriggered:naive,trapsTriggered:best?.state.triggeredTraps??[],solvable:Boolean(best)&&clearanceBlockingStates.length===0,bestShots:best?.shots.map(shotLabel)??[],blindShots:blind?.shots.map(shotLabel)??[],robustness:robust===null?null:Number(robust.toFixed(2)),difficultyScore:difficulty,clearanceBlockingStates,warnings,status:classify(level,best,naive,clearanceBlockingStates)};
}

const rows:AuditRow[]=[];
for(const mode of["classic","troll"]as const){
  const levels=levelsForMode(mode);console.log(`\n=== ${mode.toUpperCase()} (${levels.length}) ===`);
  let previousScore:number|null=null;
  for(const level of levels){const row=audit(level);if(previousScore!==null&&row.difficultyScore!==null&&row.difficultyScore<previousScore-8)row.warnings.push(`DIFFICULTY_DIP:${previousScore.toFixed(1)}->${row.difficultyScore.toFixed(1)}`);if(row.difficultyScore!==null)previousScore=row.difficultyScore;rows.push(row);const best=row.bestKnownStrokes??"?",blind=row.blindKnownStrokes??"?",robust=row.robustness===null?"n/a":`${Math.round(row.robustness*100)}%`,used=row.mechanicUsed===null?"n/a":row.mechanicUsed?"yes":"NO",trap=row.naiveTrapTriggered===null?"n/a":row.naiveTrapTriggered?"yes":"NO",diff=row.difficultyScore===null?"n/a":row.difficultyScore.toFixed(1),warn=row.warnings.length?` warn=${row.warnings.join("|")}`:"";console.log(`${row.id.padEnd(10)} 3★=${row.target} best=${String(best).padEnd(2)} blind=${String(blind).padEnd(2)} HIO=${row.holeInOne?"yes":"no "} robust=${robust.padEnd(4)} diff=${diff.padEnd(5)} main=${String(row.primaryMechanic??"-").padEnd(9)} used=${used.padEnd(3)} trap=${trap.padEnd(3)} ${row.status}${warn}`);}
  const section=rows.filter(x=>levels.some(l=>l.id===x.id)),clean=section.filter(x=>x.status==="OK").length;console.log(`${mode.toUpperCase()} SUMMARY: ${clean}/${levels.length} clean · ${section.filter(x=>x.status==="MECHANIC_BYPASSED").length} bypass · ${section.filter(x=>x.status==="TOO_EASY_FOR_TARGET").length} too-easy · ${section.filter(x=>x.status==="NO_ROUTE_FOUND").length} no-route · ${section.reduce((sum,x)=>sum+x.warnings.length,0)} warnings`);
}
console.log(`\nAUDIT_JSON=${JSON.stringify(rows)}`);
const fatal=rows.filter(x=>x.status==="NO_ROUTE_FOUND");if(fatal.length){console.error(`\nAUDIT_FATAL: ${fatal.map(x=>x.id).join(", ")}`);process.exitCode=1;}
