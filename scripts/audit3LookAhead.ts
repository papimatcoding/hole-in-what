import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { levelsForMode } from "../src/data/campaign";
import {
  cloneGolfSimulationState,
  createGolfSimulationState,
  simulateShotToRest,
  type GolfSimulationState,
  type SimulationShot
} from "../src/systems/GolfSimulation";
import type { LevelDefinition } from "../src/types";

type Status="PASS"|"REVIEW"|"BLOCKER";
interface V3Troll{
  baitStrength:number;consequence:number;causalClarity:number;learnedFairness:number;
  bypassResistance:number;trapOriginality:number;trollScore:number;
  [key:string]:unknown;
}
interface V3Row{id:string;mode:string;status:Status;troll:V3Troll|null;advisories:string[];[key:string]:unknown;}
interface V3Report{version:string;mode:string;rows:V3Row[];[key:string]:unknown;}
interface Opportunity{quality:number;bestProgress:number;safeProgressRate:number;survivalRate:number;}
interface TriggerPair{actual:GolfSimulationState;clean:GolfSimulationState;immediate:number;}
interface LookAheadResult{
  triggeredSamples:number;stateSamples:number;immediateConditional:number;
  actualOpportunity:number;cleanOpportunity:number;optionLoss:number;
  consequenceV31:number;trollScoreV31:number;
}

const REPORT_PATH=process.env.AUDIT3_REPORT_FILE??"artifacts/audit3-report.json";
const MD_PATH=REPORT_PATH.replace(/\.json$/,".md");
const TAU=Math.PI*2;
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
const rad=(d:number)=>d*Math.PI/180;
const pct=(v:number)=>`${Math.round(v*100)}%`;

if(!existsSync(REPORT_PATH))throw new Error(`Audit V3.1 requires ${REPORT_PATH}`);
const report=JSON.parse(readFileSync(REPORT_PATH,"utf8")) as V3Report;
const hardLevels=levelsForMode("troll");
const levelById=new Map(hardLevels.map(level=>[level.id,level]));

function normAngle(a:number):number{return((a%TAU)+TAU)%TAU;}
function withoutHiddenTraps(level:LevelDefinition):LevelDefinition{return{...level,popWalls:[],popBumpers:[],popVoids:[]};}
function stateKey(state:GolfSimulationState):string{
  return `${Math.round(state.ball.x/34)}:${Math.round(state.ball.y/34)}:${state.popWalls.map(x=>x.active?1:0).join("")}:${state.popBumpers.map(x=>x.active?1:0).join("")}:${state.popVoids.map(x=>x.active?1:0).join("")}`;
}

/**
 * First-shot probes deliberately use only visible information: a dense fan around the cup line plus
 * broad off-axis shots. No designPath, trigger coordinates or troll intent are supplied.
 */
function firstShotProbes(level:LevelDefinition):SimulationShot[]{
  const base=Math.atan2(level.hole.y-level.ball.y,level.hole.x-level.ball.x),shots:SimulationShot[]=[];
  for(const offset of[-45,-36,-27,-18,-9,0,9,18,27,36,45])for(const power of[.50,.62,.74,.86,.98])shots.push({angle:normAngle(base+rad(offset)),power});
  for(let d=0;d<360;d+=30)for(const power of[.58,.78,.96])shots.push({angle:rad(d),power});
  const unique=new Map<string,SimulationShot>();
  for(const shot of shots)unique.set(`${Math.round(shot.angle*180/Math.PI)}:${Math.round(shot.power*100)}`,shot);
  return [...unique.values()];
}

function secondShotProbes():SimulationShot[]{
  const shots:SimulationShot[]=[];
  for(let d=0;d<360;d+=30)for(const power of[.46,.64,.82,.98])shots.push({angle:rad(d),power});
  return shots;
}
const SECOND_SHOTS=secondShotProbes();

/**
 * Measures how much agency a player has on the next stroke from a world state.
 * It rewards: a strong best progress option, a broad set of shots that make useful progress,
 * and simply having non-void/non-timeout choices. This is not a solver and does not know the route.
 */
function opportunity(level:LevelDefinition,start:GolfSimulationState):Opportunity{
  if(start.sunk)return{quality:1,bestProgress:1,safeProgressRate:1,survivalRate:1};
  if(start.voided||start.moving)return{quality:0,bestProgress:0,safeProgressRate:0,survivalRate:0};
  const startDistance=Math.max(1,dist(start.ball,level.hole));
  let bestProgress=0,safeProgress=0,survived=0;
  for(const shot of SECOND_SHOTS){
    const result=simulateShotToRest(level,cloneGolfSimulationState(start),shot,8);
    if(result.sunk){bestProgress=1;safeProgress++;survived++;continue;}
    if(result.voided||result.state.moving)continue;
    survived++;
    const endDistance=dist(result.state.ball,level.hole);
    const progress=clamp((startDistance-endDistance)/startDistance,0,1);
    bestProgress=Math.max(bestProgress,progress);
    if(progress>=.08)safeProgress++;
  }
  const safeProgressRate=safeProgress/SECOND_SHOTS.length,survivalRate=survived/SECOND_SHOTS.length;
  const quality=clamp(bestProgress*.52+safeProgressRate*.33+survivalRate*.15);
  return{quality,bestProgress,safeProgressRate,survivalRate};
}

function immediateSeverity(level:LevelDefinition,actual:ReturnType<typeof simulateShotToRest>,clean:ReturnType<typeof simulateShotToRest>):number{
  if(actual.voided)return 1;
  if(clean.sunk&&!actual.sunk)return 1;
  const positional=clamp(dist(actual.state.ball,clean.state.ball)/190);
  const holePenalty=clamp((dist(actual.state.ball,level.hole)-dist(clean.state.ball,level.hole))/220);
  return Math.max(positional,holePenalty);
}

function topHalfMean(values:number[]):number{
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>b-a),take=Math.max(1,Math.ceil(sorted.length/2));
  return sorted.slice(0,take).reduce((sum,v)=>sum+v,0)/take;
}

function analyse(level:LevelDefinition,baseTroll:V3Troll):LookAheadResult{
  const cleanLevel=withoutHiddenTraps(level),pairs=new Map<string,TriggerPair>();
  let triggeredSamples=0;
  for(const shot of firstShotProbes(level)){
    const actual=simulateShotToRest(level,createGolfSimulationState(level),shot,8);
    if(actual.state.triggeredTraps.length===0)continue;
    triggeredSamples++;
    const clean=simulateShotToRest(cleanLevel,createGolfSimulationState(cleanLevel),shot,8);
    const key=stateKey(actual.state);
    const pair={actual:actual.state,clean:clean.state,immediate:immediateSeverity(level,actual,clean)};
    const old=pairs.get(key);if(!old||pair.immediate>old.immediate)pairs.set(key,pair);
  }

  // Prefer states with some immediate evidence, then keep spatial/state diversity from stateKey.
  const sampled=[...pairs.values()].sort((a,b)=>b.immediate-a.immediate).slice(0,14);
  const immediateValues:number[]=[],actualQ:number[]=[],cleanQ:number[]=[],losses:number[]=[];
  for(const pair of sampled){
    immediateValues.push(pair.immediate);
    if(pair.actual.sunk||pair.clean.sunk||pair.actual.voided||pair.clean.voided||pair.actual.moving||pair.clean.moving)continue;
    const a=opportunity(level,pair.actual),c=opportunity(cleanLevel,pair.clean);
    actualQ.push(a.quality);cleanQ.push(c.quality);losses.push(clamp(c.quality-a.quality));
  }
  const immediateConditional=topHalfMean(immediateValues);
  const optionLoss=topHalfMean(losses);
  const actualOpportunity=actualQ.length?actualQ.reduce((s,v)=>s+v,0)/actualQ.length:0;
  const cleanOpportunity=cleanQ.length?cleanQ.reduce((s,v)=>s+v,0)/cleanQ.length:0;

  // V3.0 consequence mostly measured immediate displacement/punishment frequency. V3.1 keeps that
  // evidence but allows a consistent loss of next-shot agency to reveal delayed/chained punishment.
  const chained=clamp(immediateConditional*.58+optionLoss*.78);
  const consequenceV31=Math.max(baseTroll.consequence,chained);
  const trollScoreV31=clamp((baseTroll.baitStrength*.20+consequenceV31*.19+baseTroll.causalClarity*.13+baseTroll.learnedFairness*.22+baseTroll.bypassResistance*.14+baseTroll.trapOriginality*.12)*100,0,100);
  return{triggeredSamples,stateSamples:sampled.length,immediateConditional,actualOpportunity,cleanOpportunity,optionLoss,consequenceV31,trollScoreV31};
}

const results=new Map<string,LookAheadResult>();
for(const row of report.rows){
  if(row.mode!=="troll"||!row.troll)continue;
  const level=levelById.get(row.id);if(!level)continue;
  const result=analyse(level,row.troll);results.set(row.id,result);
  row.troll.v31LookAhead=result;
  row.troll.consequenceV31=result.consequenceV31;
  row.troll.trollScoreV31=result.trollScoreV31;
  row.advisories=row.advisories.filter(flag=>!flag.startsWith("WEAK_CONSEQUENCE:"));
  if(result.consequenceV31<.18)row.advisories.push(`WEAK_CONSEQUENCE_V31:${Math.round(result.consequenceV31*100)}%`);
  else if(row.troll.consequence<.18&&result.consequenceV31>=.18)row.advisories.push(`CHAINED_CONSEQUENCE:${Math.round(result.optionLoss*100)}%_OPTION_LOSS`);
}
report.version="3.1-shadow";
writeFileSync(REPORT_PATH,JSON.stringify(report,null,2));

if(existsSync(MD_PATH)){
  const marker="\n## Audit V3.1 · consequence look-ahead";
  const original=readFileSync(MD_PATH,"utf8").split(marker)[0]!.trimEnd();
  const md=[original,marker,"","V3.1 adds one-stroke look-ahead after triggered HARD states. It measures next-shot agency without using `designPath`, hidden trigger coordinates or the intended solution.","","| HARD | V3 consequence | V3.1 consequence | option loss | immediate severity | state samples | Troll V3→V3.1 |","|---|---:|---:|---:|---:|---:|---:|"];
  for(const row of report.rows.filter(r=>r.mode==="troll"&&r.troll)){
    const r=results.get(row.id);if(!r)continue;
    md.push(`| ${row.id} | ${pct(row.troll!.consequence)} | ${pct(r.consequenceV31)} | ${pct(r.optionLoss)} | ${pct(r.immediateConditional)} | ${r.stateSamples} | ${Math.round(row.troll!.trollScore)}→${Math.round(r.trollScoreV31)} |`);
  }
  md.push("","Interpretation: option loss is the reduction in sampled next-shot agency versus the same first shot in a counterfactual map with hidden pop traps removed. It is a shadow diagnostic, not a fun score or strict gate.","");
  writeFileSync(MD_PATH,md.join("\n"));
}

console.log("Audit V3.1 consequence look-ahead");
for(const row of report.rows.filter(r=>r.mode==="troll"&&r.troll)){
  const r=results.get(row.id);if(!r)continue;
  console.log(`${row.id.padEnd(10)} consequence ${pct(row.troll!.consequence)} -> ${pct(r.consequenceV31)} · option-loss ${pct(r.optionLoss)} · troll ${Math.round(row.troll!.trollScore)} -> ${Math.round(r.trollScoreV31)}`);
}
