import { mkdirSync, writeFileSync } from "node:fs";
import { levelsForMode } from "../src/data/campaign";
import {
  createGolfSimulationState,
  simulateShotToRest,
  type GolfSimulationState,
  type SimulationShot
} from "../src/systems/GolfSimulation";
import type { LevelDefinition, Vec2 } from "../src/types";

type AgentKind="learned"|"naive"|"explorer";
type Audit2Status="PASS"|"REVIEW"|"BLOCKER";
interface SolvedRun{strokes:number;time:number;shots:SimulationShot[];state:GolfSimulationState;}
interface SearchNode extends SolvedRun{score:number;}
interface HumanProfile{name:string;angleSigma:number;powerSigma:number;trials:number;}
interface ProfileResult{name:string;successRate:number;voidRate:number;medianEndDistance:number;}
interface NaiveTrapResult{triggerRate:number;punishRate:number;sampleCount:number;}
interface RecoveryResult{sampleCount:number;recoverableRate:number;movingTimeoutRate:number;}
interface Audit2Row{
  id:string;
  mode:string;
  target:number;
  learnedStrokes:number|null;
  naiveStrokes:number|null;
  explorerStrokes:number|null;
  routeFamilies:number;
  profiles:ProfileResult[];
  minShotTolerance:number|null;
  naiveTrap:NaiveTrapResult|null;
  mechanicRelevant:boolean|null;
  recovery:RecoveryResult;
  minRestEdgeDistance:number|null;
  flags:string[];
  status:Audit2Status;
}

const FULL=process.env.AUDIT2_MODE==="full";
const STRICT=process.env.AUDIT2_STRICT==="1";
const FIELD={x:28,y:28,w:484,h:904};
const TAU=Math.PI*2;
const rad=(d:number)=>d*Math.PI/180;
const deg=(r:number)=>r*180/Math.PI;
const wrap=(a:number)=>((a%TAU)+TAU)%TAU;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);

function hashString(value:string):number{
  let h=2166136261>>>0;
  for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function rng(seed:number):()=>number{
  let a=seed>>>0;
  return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
}
function gaussian(random:()=>number):number{
  const u=Math.max(1e-9,random()),v=Math.max(1e-9,random());
  return Math.sqrt(-2*Math.log(u))*Math.cos(TAU*v);
}
function routePoints(level:LevelDefinition):Vec2[]{
  return level.designPath?.length?[level.ball,...level.designPath.filter(p=>dist(p,level.ball)>4),level.hole]:[level.ball,level.hole];
}
function nextRoutePoint(level:LevelDefinition,state:GolfSimulationState):Vec2{
  const pts=routePoints(level);let nearest=0,best=Infinity;
  for(let i=0;i<pts.length;i++){const d=dist(state.ball,pts[i]!);if(d<best){best=d;nearest=i;}}
  return pts[Math.min(pts.length-1,nearest+1)]??level.hole;
}
function stateKey(state:GolfSimulationState):string{
  return[
    Math.round(state.ball.x/18),Math.round(state.ball.y/18),
    state.popWalls.map(x=>x.active?1:0).join(""),
    state.popBumpers.map(x=>x.active?1:0).join(""),
    state.popVoids.map(x=>x.active?1:0).join("")
  ].join(":");
}
function score(level:LevelDefinition,state:GolfSimulationState,agent:AgentKind):number{
  const hole=dist(state.ball,level.hole);
  if(agent==="naive")return hole+state.time*.65;
  if(agent==="explorer")return hole+state.time*.45+(state.triggeredTraps.length?8:0);
  const next=dist(state.ball,nextRoutePoint(level,state));
  const learnedTrapBonus=level.mode==="troll"&&state.triggeredTraps.length>0?-10:0;
  const mechanicBonus=level.primaryMechanic&&state.touchedMechanics.includes(level.primaryMechanic)?-14:0;
  return hole+next*.25+state.time*.6+learnedTrapBonus+mechanicBonus;
}
function uniqueShots(shots:SimulationShot[]):SimulationShot[]{
  const map=new Map<string,SimulationShot>();
  for(const shot of shots){const key=`${Math.round(deg(shot.angle)*2)}:${Math.round(shot.power*100)}`;if(!map.has(key))map.set(key,shot);}
  return [...map.values()];
}
function candidateShots(level:LevelDefinition,state:GolfSimulationState,agent:AgentKind):SimulationShot[]{
  const b=state.ball,out:SimulationShot[]=[];
  if(agent==="explorer"){
    const step=FULL?12:20;const powers=FULL?[.30,.42,.54,.66,.78,.90,1]:[.38,.56,.74,.92,1];
    for(let d=0;d<360;d+=step)for(const power of powers)out.push({angle:rad(d),power});
    return out;
  }
  if(agent==="naive"){
    const anchors=[level.hole,routePoints(level)[1]??level.hole];
    const offsets=FULL?[-28,-18,-10,-5,0,5,10,18,28]:[-24,-12,0,12,24];
    const powers=FULL?[.42,.56,.70,.84,.96,1]:[.50,.68,.86,1];
    for(const target of anchors){const base=Math.atan2(target.y-b.y,target.x-b.x);for(const d of offsets)for(const power of powers)out.push({angle:wrap(base+rad(d)),power});}
    for(let d=0;d<360;d+=(FULL?30:45))for(const power of[.62,.90])out.push({angle:rad(d),power});
    return uniqueShots(out);
  }
  const anchors=[level.hole,nextRoutePoint(level,state),...routePoints(level)].filter((p,i,a)=>a.findIndex(q=>dist(p,q)<8)===i);
  const offsets=FULL?[-34,-24,-16,-10,-6,-3,0,3,6,10,16,24,34]:[-28,-14,-6,0,6,14,28];
  const powers=FULL?[.28,.38,.48,.58,.68,.78,.88,.96,1]:[.34,.50,.66,.82,.96];
  for(const target of anchors){const base=Math.atan2(target.y-b.y,target.x-b.x);for(const d of offsets)for(const power of powers)out.push({angle:wrap(base+rad(d)),power});}
  for(let d=0;d<360;d+=(FULL?24:36))for(const power of[.48,.72,.94])out.push({angle:rad(d),power});
  return uniqueShots(out);
}
function solve(level:LevelDefinition,agent:AgentKind,maxDepth:number):SolvedRun[]{
  let beam:SearchNode[]=[{state:createGolfSimulationState(level),strokes:0,time:0,shots:[],score:0}];
  const width=agent==="learned"?(FULL?150:64):agent==="naive"?(FULL?70:30):(FULL?90:42);
  const maxSolutions=FULL?24:12;
  for(let depth=1;depth<=maxDepth;depth++){
    const dedupe=new Map<string,SearchNode>(),solved:SolvedRun[]=[];
    for(const node of beam){
      for(const shot of candidateShots(level,node.state,agent)){
        const result=simulateShotToRest(level,node.state,shot,FULL?10:8);
        if(result.voided||result.state.moving)continue;
        const run:SearchNode={state:result.state,strokes:depth,time:result.state.time,shots:[...node.shots,shot],score:0};
        if(result.sunk){solved.push(run);if(solved.length>=maxSolutions)break;continue;}
        run.score=score(level,result.state,agent);
        const key=stateKey(result.state),old=dedupe.get(key);
        if(!old||run.score<old.score)dedupe.set(key,run);
      }
      if(solved.length>=maxSolutions)break;
    }
    if(solved.length)return solved.sort((a,b)=>a.time-b.time);
    beam=[...dedupe.values()].sort((a,b)=>a.score-b.score).slice(0,width);
    if(!beam.length)break;
  }
  return [];
}
function replay(level:LevelDefinition,shots:SimulationShot[]):{state:GolfSimulationState;sunk:boolean;voided:boolean;rests:Vec2[]}{
  let state=createGolfSimulationState(level),voided=false,sunk=false;const rests:Vec2[]=[];
  for(const shot of shots){const result=simulateShotToRest(level,state,shot,FULL?10:8);state=result.state;rests.push({x:state.ball.x,y:state.ball.y});if(result.voided){voided=true;break;}if(result.sunk){sunk=true;break;}}
  return{state,sunk,voided,rests};
}
function profileRun(level:LevelDefinition,best:SolvedRun|null,profile:HumanProfile):ProfileResult{
  if(!best)return{name:profile.name,successRate:0,voidRate:0,medianEndDistance:9999};
  const random=rng(hashString(`${level.id}:${profile.name}:${FULL?"full":"fast"}`));let success=0,voids=0;const distances:number[]=[];
  for(let i=0;i<profile.trials;i++){
    const shots=best.shots.map(s=>({angle:wrap(s.angle+rad(gaussian(random)*profile.angleSigma)),power:clamp(s.power+gaussian(random)*profile.powerSigma,.18,1)}));
    const end=replay(level,shots);if(end.sunk)success++;if(end.voided)voids++;distances.push(dist(end.state.ball,level.hole));
  }
  distances.sort((a,b)=>a-b);return{name:profile.name,successRate:success/profile.trials,voidRate:voids/profile.trials,medianEndDistance:distances[Math.floor(distances.length/2)]??9999};
}
function shotTolerance(level:LevelDefinition,best:SolvedRun|null):number|null{
  if(!best)return null;let minimum=1;
  const angleD=FULL?[-7,-5,-3,-1,0,1,3,5,7]:[-6,-3,0,3,6];
  const powerD=FULL?[-.08,-.06,-.04,-.02,0,.02,.04,.06,.08]:[-.06,-.03,0,.03,.06];
  for(let i=0;i<best.shots.length;i++){
    let ok=0,total=0;
    for(const da of angleD)for(const dp of powerD){const variant=best.shots.map(s=>({...s}));variant[i]={angle:wrap(variant[i]!.angle+rad(da)),power:clamp(variant[i]!.power+dp,.18,1)};total++;if(replay(level,variant).sunk)ok++;}
    minimum=Math.min(minimum,total?ok/total:0);
  }
  return minimum;
}
function firstRest(level:LevelDefinition,run:SolvedRun):Vec2{
  const result=simulateShotToRest(level,createGolfSimulationState(level),run.shots[0]!,FULL?10:8);return{x:result.state.ball.x,y:result.state.ball.y};
}
function routeFamilyCount(level:LevelDefinition,runs:SolvedRun[]):number{
  const families=new Set<string>();
  for(const run of runs){if(!run.shots.length)continue;const shot=run.shots[0]!,rest=firstRest(level,run);families.add(`${Math.round(deg(shot.angle)/25)}:${Math.round(rest.x/90)}:${Math.round(rest.y/90)}`);}
  return families.size;
}
function withoutPopTraps(level:LevelDefinition):LevelDefinition{return{...level,popWalls:[],popBumpers:[],popVoids:[]};}
function naiveTrapProbe(level:LevelDefinition):NaiveTrapResult|null{
  if(level.mode!=="troll")return null;
  const targets=[level.hole,routePoints(level)[1]??level.hole],offsets=FULL?[-18,-12,-6,0,6,12,18]:[-15,-7,0,7,15],powers=FULL?[.55,.68,.81,.94,1]:[.62,.78,.94];
  let samples=0,triggers=0,punishes=0;
  const noTraps=withoutPopTraps(level);
  for(const target of targets){const base=Math.atan2(target.y-level.ball.y,target.x-level.ball.x);for(const da of offsets)for(const power of powers){samples++;const shot={angle:wrap(base+rad(da)),power};const actual=simulateShotToRest(level,createGolfSimulationState(level),shot,7),control=simulateShotToRest(noTraps,createGolfSimulationState(noTraps),shot,7);const triggered=actual.state.triggeredTraps.length>0;if(triggered)triggers++;const positionDelta=dist(actual.state.ball,control.state.ball),distancePenalty=dist(actual.state.ball,level.hole)-dist(control.state.ball,level.hole);if(actual.voided||(triggered&&(control.sunk&&!actual.sunk||positionDelta>55||distancePenalty>70)))punishes++;}}
  return{triggerRate:samples?triggers/samples:0,punishRate:samples?punishes/samples:0,sampleCount:samples};
}
function mechanicRelevant(level:LevelDefinition,best:SolvedRun|null,trap:NaiveTrapResult|null):boolean|null{
  if(!level.primaryMechanic||!best)return null;
  if(level.mode==="troll"&&trap)return trap.punishRate>.08;
  if(level.primaryMechanic==="wall")return null;
  return best.state.touchedMechanics.includes(level.primaryMechanic)||best.state.triggeredTraps.some(t=>t.startsWith(`${level.primaryMechanic}:`));
}
function recoverable(level:LevelDefinition,state:GolfSimulationState):boolean{
  for(let d=0;d<360;d+=30)for(const power of[.45,.72,.96]){const result=simulateShotToRest(level,state,{angle:rad(d),power},7);if(result.sunk)return true;if(result.voided||result.state.moving)continue;if(dist(result.state.ball,state.ball)>55)return true;}
  return false;
}
function recoveryProbe(level:LevelDefinition):RecoveryResult{
  const random=rng(hashString(`${level.id}:recovery`)),count=FULL?32:16;let tested=0,recoveries=0,moving=0;
  for(let i=0;i<count;i++){
    const shot={angle:random()*TAU,power:.28+random()*.72},first=simulateShotToRest(level,createGolfSimulationState(level),shot,7);
    if(first.sunk||first.voided)continue;tested++;if(first.state.moving){moving++;continue;}if(recoverable(level,first.state))recoveries++;
  }
  return{sampleCount:tested,recoverableRate:tested?recoveries/tested:1,movingTimeoutRate:tested?moving/tested:0};
}
function edgeDistance(p:Vec2):number{return Math.min(p.x-FIELD.x,FIELD.x+FIELD.w-p.x,p.y-FIELD.y,FIELD.y+FIELD.h-p.y);}
function minRestEdge(level:LevelDefinition,best:SolvedRun|null):number|null{
  if(!best)return null;const replayed=replay(level,best.shots);return Math.min(edgeDistance(level.ball),...replayed.rests.map(edgeDistance));
}
function statusFor(flags:string[]):Audit2Status{return flags.some(x=>x.startsWith("BLOCKER:"))?"BLOCKER":flags.length?"REVIEW":"PASS";}
function auditLevel(level:LevelDefinition):Audit2Row{
  const maxDepth=Math.max(5,(level.twoStar.maxStrokes??4)+1),learnedRuns=solve(level,"learned",maxDepth),naiveRuns=solve(level,"naive",Math.min(maxDepth,4)),explorerRuns=solve(level,"explorer",Math.min(maxDepth,4));
  const learned=learnedRuns[0]??null,naive=naiveRuns[0]??null,explorer=explorerRuns[0]??null;
  const profiles:HumanProfile[]=[
    {name:"mouse",angleSigma:1.5,powerSigma:.015,trials:FULL?220:70},
    {name:"touch",angleSigma:3.25,powerSigma:.035,trials:FULL?280:90},
    {name:"casual",angleSigma:5.5,powerSigma:.060,trials:FULL?320:110}
  ];
  const profileResults=profiles.map(p=>profileRun(level,learned,p)),tolerance=shotTolerance(level,learned),trap=naiveTrapProbe(level),recovery=recoveryProbe(level),families=routeFamilyCount(level,[...learnedRuns,...explorerRuns]),relevant=mechanicRelevant(level,learned,trap),edge=minRestEdge(level,learned),flags:string[]=[];
  const touch=profileResults.find(x=>x.name==="touch")!,casual=profileResults.find(x=>x.name==="casual")!;
  if(!learned)flags.push("BLOCKER:NO_LEARNED_ROUTE");
  if(learned&&touch.successRate<.08)flags.push(`BLOCKER:HUMAN_EXECUTION:${Math.round(touch.successRate*100)}%`);
  else if(learned&&touch.successRate<.28)flags.push(`TOUCH_PRECISION_RISK:${Math.round(touch.successRate*100)}%`);
  if(learned&&casual.successRate<.12)flags.push(`CASUAL_EXECUTION_RISK:${Math.round(casual.successRate*100)}%`);
  if(tolerance!==null&&tolerance<.08)flags.push(`BLOCKER:PIXEL_PERFECT:${Math.round(tolerance*100)}%`);
  else if(tolerance!==null&&tolerance<.22)flags.push(`NARROW_SHOT_WINDOW:${Math.round(tolerance*100)}%`);
  if(level.mode==="troll"&&trap&&trap.punishRate<.08)flags.push(`BLOCKER:TRAP_IRRELEVANT:${Math.round(trap.punishRate*100)}%`);
  else if(level.mode==="troll"&&trap&&trap.punishRate<.22)flags.push(`WEAK_TROLL_CONSEQUENCE:${Math.round(trap.punishRate*100)}%`);
  if(relevant===false)flags.push("MECHANIC_RELEVANCE_LOW");
  if(recovery.recoverableRate<.70)flags.push(`RECOVERY_RISK:${Math.round(recovery.recoverableRate*100)}%`);
  if(recovery.movingTimeoutRate>.04)flags.push(`MOVING_TIMEOUT_RISK:${Math.round(recovery.movingTimeoutRate*100)}%`);
  if(families<=1&&level.group>=3)flags.push("LOW_ROUTE_DIVERSITY:1");
  if(edge!==null&&edge<18)flags.push(`EDGE_REST_RISK:${Math.round(edge)}px`);
  const target=level.threeStar.maxStrokes??0,bestAny=Math.min(learned?.strokes??99,naive?.strokes??99,explorer?.strokes??99);
  if(target>=3&&bestAny===1)flags.push("CHEESE_HIO");
  return{id:level.id,mode:level.mode,target,learnedStrokes:learned?.strokes??null,naiveStrokes:naive?.strokes??null,explorerStrokes:explorer?.strokes??null,routeFamilies:families,profiles:profileResults,minShotTolerance:tolerance,naiveTrap:trap,mechanicRelevant:relevant,recovery,minRestEdgeDistance:edge,flags,status:statusFor(flags)};
}
function pct(v:number|null|undefined):string{return v===null||v===undefined?"n/a":`${Math.round(v*100)}%`;}

const rows:Audit2Row[]=[];
console.log(`\nAUDIT 2.0 · ${FULL?"full human-model":"fast calibration"}${STRICT?" · strict":""}`);
for(const mode of["classic","troll"]as const){
  console.log(`\n=== ${mode.toUpperCase()} ===`);
  for(const level of levelsForMode(mode)){
    const row=auditLevel(level);rows.push(row);const touch=row.profiles.find(x=>x.name==="touch")!,casual=row.profiles.find(x=>x.name==="casual")!;
    console.log(`${row.id.padEnd(10)} learned=${String(row.learnedStrokes??"?").padEnd(2)} naive=${String(row.naiveStrokes??"?").padEnd(2)} families=${String(row.routeFamilies).padEnd(2)} touch=${pct(touch.successRate).padEnd(4)} casual=${pct(casual.successRate).padEnd(4)} shotTol=${pct(row.minShotTolerance).padEnd(4)} recover=${pct(row.recovery.recoverableRate).padEnd(4)} trap=${row.naiveTrap?pct(row.naiveTrap.punishRate):"n/a"} ${row.status}${row.flags.length?` [${row.flags.join(" | ")}]`:""}`);
  }
}
const summary={pass:rows.filter(r=>r.status==="PASS").length,review:rows.filter(r=>r.status==="REVIEW").length,blocker:rows.filter(r=>r.status==="BLOCKER").length,total:rows.length};
console.log(`\nAUDIT 2.0 SUMMARY: ${summary.pass}/${summary.total} pass · ${summary.review} review · ${summary.blocker} blocker`);
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/audit2-report.json",JSON.stringify({generatedAt:new Date().toISOString(),mode:FULL?"full":"fast",summary,rows},null,2));
const md=["# Troll Golf · Audit 2.0",`Mode: **${FULL?"full human-model":"fast calibration"}**`,`Summary: **${summary.pass}/${summary.total} PASS · ${summary.review} REVIEW · ${summary.blocker} BLOCKER**`,"","| Hole | Learned | Naive | Families | Touch | Casual | Shot tolerance | Recovery | Trap consequence | Status |","|---|---:|---:|---:|---:|---:|---:|---:|---:|---|",...rows.map(r=>{const touch=r.profiles.find(x=>x.name==="touch")!,casual=r.profiles.find(x=>x.name==="casual")!;return`| ${r.id} | ${r.learnedStrokes??"?"} | ${r.naiveStrokes??"?"} | ${r.routeFamilies} | ${pct(touch.successRate)} | ${pct(casual.successRate)} | ${pct(r.minShotTolerance)} | ${pct(r.recovery.recoverableRate)} | ${r.naiveTrap?pct(r.naiveTrap.punishRate):"n/a"} | ${r.status}${r.flags.length?` · ${r.flags.join(", ")}`:""} |`;})];
writeFileSync("artifacts/audit2-report.md",md.join("\n"));
console.log("Reports: artifacts/audit2-report.json + artifacts/audit2-report.md");
if(STRICT&&summary.blocker>0)process.exitCode=1;
