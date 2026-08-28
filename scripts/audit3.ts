import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { levelsForMode } from "../src/data/campaign";
import { TROLL_AUDIT_INTENT, type TrollAuditIntent } from "../src/data/trollAuditIntent";
import {
  createGolfSimulationState,
  simulateShotToRest,
  type GolfSimulationState,
  type SimulationShot
} from "../src/systems/GolfSimulation";
import type { CurveDef, LevelDefinition, TriangleDef, Vec2 } from "../src/types";

type Status="PASS"|"REVIEW"|"BLOCKER";
type BeliefAgent="blind"|"curious"|"suspicious";
type Confidence="NONE"|"LOW"|"MEDIUM"|"HIGH";

interface Audit2Profile{name:string;successRate:number;voidRate:number;medianEndDistance:number;}
interface Audit2Trap{triggerRate:number;punishRate:number;sampleCount:number;}
interface Audit2Recovery{sampleCount:number;recoverableRate:number;movingTimeoutRate:number;}
interface Audit2Row{
  id:string;mode:string;target:number;learnedStrokes:number|null;humanStrokes:number|null;
  naiveStrokes:number|null;explorerStrokes:number|null;routeFamilies:number;
  profiles:Audit2Profile[];minShotTolerance:number|null;humanScore:number|null;
  naiveTrap:Audit2Trap|null;mechanicRelevant:boolean|null;recovery:Audit2Recovery;
  minRestEdgeDistance:number|null;flags:string[];status:Status;
}
interface Audit2Report{generatedAt?:string;mode?:string;rows:Audit2Row[];}

interface HumanRow{
  build_id?:string;buildId?:string;level_id?:string;levelId?:string;mode?:string;
  players?:number;attempts?:number;completed_attempts?:number;completedAttempts?:number;
  attempt_completion_rate?:number;attemptCompletionRate?:number;
  explicit_abandons?:number;explicitAbandons?:number;stale_attempts?:number;staleAttempts?:number;
  median_strokes?:number;medianStrokes?:number;p75_strokes?:number;p75Strokes?:number;
  median_time_ms?:number;medianTimeMs?:number;shots?:number;touch_shots?:number;touchShots?:number;
  mouse_shots?:number;mouseShots?:number;void_shot_rate?:number;voidShotRate?:number;
  mobile_players?:number;mobilePlayers?:number;desktop_players?:number;desktopPlayers?:number;
  feedback_n?:number;feedbackN?:number;avg_fun?:number;avgFun?:number;
  avg_originality?:number;avgOriginality?:number;avg_difficulty?:number;avgDifficulty?:number;
  avg_surprise?:number;avgSurprise?:number;extra_attempts_per_player?:number;extraAttemptsPerPlayer?:number;
}
interface HumanSnapshot{generatedAt?:string;levels:HumanRow[];}

interface MapMetrics{
  visibleBlockedRatio:number;hazardRatio:number;hiddenTrapRatio:number;reachableOpenRatio:number;
  spatialEntropy:number;symmetry:number;decisionDensity:number;layoutType:"open"|"mixed"|"corridor";
  nearestMap:string|null;nearestSimilarity:number;
}
interface AgentProbe{agent:BeliefAgent;samples:number;triggerRate:number;punishRate:number;terminalRate:number;}
interface TrollMetrics{
  intent:TrollAuditIntent|null;agents:AgentProbe[];baitStrength:number;consequence:number;causalClarity:number;
  learnedFairness:number;bypassResistance:number;trapOriginality:number;trollScore:number;
  terminalObserved:boolean;terminalIntentional:boolean;knowledgeGainPotential:number;
}
interface StatsFusion{
  available:boolean;confidence:Confidence;players:number;attempts:number;completedAttempts:number;
  artificialCompletion:number;humanCompletion:number|null;posteriorCompletion:number;
  artificialDifficulty:number;humanDifficulty:number|null;fusedDifficulty:number;
  avgFun:number|null;avgOriginality:number|null;avgSurprise:number|null;
  abandonmentRate:number|null;deviceMix:{mobile:number;desktop:number;other:number};
  disagreement:number;notes:string[];
}
interface Audit3Row{
  id:string;mode:string;baseStatus:Status;status:Status;baseFlags:string[];
  map:MapMetrics;troll:TrollMetrics|null;stats:StatsFusion;advisories:string[];
}
interface Audit3Report{
  version:"3.0-shadow";generatedAt:string;mode:"shadow"|"strict";humanSnapshot:string|null;
  summary:{levels:number;pass:number;review:number;blocker:number;humanLevels:number;trollLevels:number;};
  rows:Audit3Row[];
}

const FULL=process.env.AUDIT3_MODE==="full";
const STRICT=process.env.AUDIT3_STRICT==="1";
const REPORT_PATH=process.env.AUDIT2_REPORT_FILE??"artifacts/audit2-report.json";
const HUMAN_PATH=process.env.AUDIT3_HUMAN_FILE??"artifacts/audit3-human.json";
const OUT_JSON=process.env.AUDIT3_REPORT_FILE??"artifacts/audit3-report.json";
const OUT_MD=OUT_JSON.replace(/\.json$/,".md");
const TAU=Math.PI*2;
const FIELD={x:28,y:28,w:484,h:904};
const COLS=FULL?28:22,ROWS=FULL?46:34;

const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const dist=(a:{x:number;y:number},b:{x:number;y:number})=>Math.hypot(a.x-b.x,a.y-b.y);
const rad=(d:number)=>d*Math.PI/180;
const pct=(v:number)=>`${Math.round(v*100)}%`;
const n=(row:HumanRow,...keys:(keyof HumanRow)[]):number|null=>{
  for(const key of keys){const value=row[key];if(typeof value==="number"&&Number.isFinite(value))return value;}
  return null;
};
const profile=(row:Audit2Row,name:string):Audit2Profile=>row.profiles.find(x=>x.name===name)??{name,successRate:0,voidRate:0,medianEndDistance:9999};

if(!existsSync(REPORT_PATH))throw new Error(`Audit V3 requires Audit 2 report: ${REPORT_PATH}`);
const base=JSON.parse(readFileSync(REPORT_PATH,"utf8")) as Audit2Report;
const human:HumanSnapshot|null=existsSync(HUMAN_PATH)?JSON.parse(readFileSync(HUMAN_PATH,"utf8")) as HumanSnapshot:null;
const humanByLevel=new Map<string,HumanRow>();
for(const row of human?.levels??[]){
  const id=String(row.level_id??row.levelId??"");
  if(!id)continue;
  const previous=humanByLevel.get(id);
  if(!previous||(n(row,"attempts")??0)>=(n(previous,"attempts")??0))humanByLevel.set(id,row);
}
const levels=[...levelsForMode("classic"),...levelsForMode("troll")];
const baseById=new Map(base.rows.map(row=>[row.id,row]));

function normAngle(a:number):number{return((a%TAU)+TAU)%TAU;}
function pointInTriangle(p:Vec2,t:TriangleDef):boolean{
  const sign=(p1:Vec2,p2:Vec2,p3:Vec2)=>(p1.x-p3.x)*(p2.y-p3.y)-(p2.x-p3.x)*(p1.y-p3.y);
  const d1=sign(p,t.a,t.b),d2=sign(p,t.b,t.c),d3=sign(p,t.c,t.a),neg=d1<0||d2<0||d3<0,pos=d1>0||d2>0||d3>0;
  return!(neg&&pos);
}
function inArc(a:number,c:CurveDef):boolean{const x=normAngle(a),s=normAngle(c.startAngle),e=normAngle(c.endAngle);return s<=e?x>=s&&x<=e:x>=s||x<=e;}
function inRect(p:Vec2,r:{x:number;y:number;w:number;h:number}):boolean{return p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;}
function inCircle(p:Vec2,c:{x:number;y:number;r:number}):boolean{return dist(p,c)<=c.r+8;}
function visibleBlocked(level:LevelDefinition,p:Vec2):boolean{
  if((level.walls??[]).some(r=>inRect(p,r)))return true;
  if((level.voids??[]).some(r=>inRect(p,r)))return true;
  if((level.bumpers??[]).some(c=>inCircle(p,c)))return true;
  if((level.triangles??[]).some(t=>pointInTriangle(p,t)))return true;
  if((level.curves??[]).some(c=>{const d=dist(p,c);return Math.abs(d-c.r)<=(c.thickness??22)/2+7&&inArc(Math.atan2(p.y-c.y,p.x-c.x),c);}))return true;
  return false;
}
function hiddenBlocked(level:LevelDefinition,p:Vec2):boolean{
  return (level.popWalls??[]).some(r=>inRect(p,r))||(level.popVoids??[]).some(r=>inRect(p,r))||(level.popBumpers??[]).some(c=>inCircle(p,c));
}
function hazardAt(level:LevelDefinition,p:Vec2):boolean{return(level.voids??[]).some(r=>inRect(p,r))||(level.sand??[]).some(r=>inRect(p,r))||(level.ice??[]).some(r=>inRect(p,r));}
function cellPoint(index:number):Vec2{
  const x=index%COLS,y=Math.floor(index/COLS);
  return{x:FIELD.x+(x+.5)*FIELD.w/COLS,y:FIELD.y+(y+.5)*FIELD.h/ROWS};
}
function raster(level:LevelDefinition,hidden=false):Set<number>{
  const out=new Set<number>();for(let i=0;i<COLS*ROWS;i++){const p=cellPoint(i);if(hidden?hiddenBlocked(level,p):visibleBlocked(level,p))out.add(i);}return out;
}
function jaccard(a:Set<number>,b:Set<number>):number{
  if(!a.size&&!b.size)return 1;let inter=0;for(const x of a)if(b.has(x))inter++;
  return inter/(a.size+b.size-inter||1);
}
function mirrorRaster(a:Set<number>):Set<number>{
  const out=new Set<number>();for(const i of a){const x=i%COLS,y=Math.floor(i/COLS);out.add(y*COLS+(COLS-1-x));}return out;
}
function reachableRatio(level:LevelDefinition,blocked:Set<number>):number{
  const cell=(p:Vec2)=>{const x=clamp(Math.floor((p.x-FIELD.x)/FIELD.w*COLS),0,COLS-1),y=clamp(Math.floor((p.y-FIELD.y)/FIELD.h*ROWS),0,ROWS-1);return y*COLS+x;};
  const start=cell(level.ball);if(blocked.has(start))return 0;
  const seen=new Set<number>([start]),queue=[start];
  while(queue.length){const i=queue.shift()!,x=i%COLS,y=Math.floor(i/COLS);for(const [dx,dy] of[[1,0],[-1,0],[0,1],[0,-1]] as const){const nx=x+dx,ny=y+dy;if(nx<0||nx>=COLS||ny<0||ny>=ROWS)continue;const ni=ny*COLS+nx;if(blocked.has(ni)||seen.has(ni))continue;seen.add(ni);queue.push(ni);}}
  return seen.size/Math.max(1,COLS*ROWS-blocked.size);
}
function entropy(level:LevelDefinition):number{
  const points:Vec2[]=[
    ...(level.walls??[]).map(r=>({x:r.x+r.w/2,y:r.y+r.h/2})),
    ...(level.bumpers??[]).map(b=>({x:b.x,y:b.y})),
    ...(level.voids??[]).map(r=>({x:r.x+r.w/2,y:r.y+r.h/2})),
    ...(level.sand??[]).map(r=>({x:r.x+r.w/2,y:r.y+r.h/2})),
    ...(level.ice??[]).map(r=>({x:r.x+r.w/2,y:r.y+r.h/2})),
    ...(level.boosters??[]).map(r=>({x:r.x+r.w/2,y:r.y+r.h/2})),
    ...(level.trampolines??[]).map(b=>({x:b.x,y:b.y}))
  ];
  if(points.length<2)return 0;
  const bins=new Array(6).fill(0) as number[];
  for(const p of points){const col=p.x<FIELD.x+FIELD.w/2?0:1,row=clamp(Math.floor((p.y-FIELD.y)/FIELD.h*3),0,2);bins[row*2+col]++;}
  let h=0;for(const count of bins){if(!count)continue;const q=count/points.length;h-=q*Math.log(q);}
  return h/Math.log(6);
}
function objectCount(level:LevelDefinition):number{
  return (level.walls?.length??0)+(level.triangles?.length??0)+(level.curves?.length??0)+(level.bumpers?.length??0)+(level.movingWalls?.length??0)+(level.movingBumpers?.length??0)+(level.sand?.length??0)+(level.ice?.length??0)+(level.boosters?.length??0)+(level.fans?.length??0)+(level.portals?.length??0)+(level.ramps?.length??0)+(level.trampolines?.length??0)+(level.voids?.length??0);
}
function mapMetrics(level:LevelDefinition):MapMetrics{
  const visible=raster(level),hidden=raster(level,true),total=COLS*ROWS;
  let hazards=0;for(let i=0;i<total;i++)if(hazardAt(level,cellPoint(i)))hazards++;
  const blockedRatio=visible.size/total,reachable=reachableRatio(level,visible),decision=clamp(objectCount(level)/18,0,1);
  const layoutType=blockedRatio<.10?"open":blockedRatio>.22||reachable<.70?"corridor":"mixed";
  return{visibleBlockedRatio:blockedRatio,hazardRatio:hazards/total,hiddenTrapRatio:hidden.size/total,reachableOpenRatio:reachable,spatialEntropy:entropy(level),symmetry:jaccard(visible,mirrorRaster(visible)),decisionDensity:decision,layoutType,nearestMap:null,nearestSimilarity:0};
}
const mapById=new Map(levels.map(level=>[level.id,mapMetrics(level)]));
for(const level of levels){
  const own=raster(level);let bestId:string|null=null,best=0;
  for(const other of levels){if(other.id===level.id||other.mode!==level.mode)continue;const otherRaster=raster(other);const score=Math.max(jaccard(own,otherRaster),jaccard(own,mirrorRaster(otherRaster)));if(score>best){best=score;bestId=other.id;}}
  const metrics=mapById.get(level.id)!;metrics.nearestMap=bestId;metrics.nearestSimilarity=best;
}

function withoutHiddenTraps(level:LevelDefinition):LevelDefinition{return{...level,popWalls:[],popBumpers:[],popVoids:[]};}
function visibleTargets(level:LevelDefinition,agent:BeliefAgent):Vec2[]{
  const targets:Vec2[]=[level.hole];
  if(agent==="curious"){
    for(const b of level.bumpers??[])targets.push({x:b.x,y:b.y});
    for(const b of level.trampolines??[])targets.push({x:b.x,y:b.y});
    for(const r of level.boosters??[])targets.push({x:r.x+r.w/2,y:r.y+r.h/2});
    for(const p of level.portals??[])targets.push({x:p.a.x,y:p.a.y},{x:p.b.x,y:p.b.y});
  }
  return targets;
}
function probeShots(level:LevelDefinition,agent:BeliefAgent):SimulationShot[]{
  const b=level.ball,targets=visibleTargets(level,agent),out:SimulationShot[]=[];
  const offsets=agent==="suspicious"?[-48,-34,-22,22,34,48]:agent==="curious"?[-22,-12,-6,0,6,12,22]:[-18,-9,-4,0,4,9,18];
  const powers=FULL?[.48,.60,.72,.84,.94,1]:[.56,.72,.88,1];
  for(const target of targets){const base=Math.atan2(target.y-b.y,target.x-b.x);for(const off of offsets)for(const power of powers)out.push({angle:normAngle(base+rad(off)),power});}
  if(agent==="suspicious")for(let d=0;d<360;d+=(FULL?24:36))for(const power of[.58,.78,.96])out.push({angle:rad(d),power});
  const unique=new Map<string,SimulationShot>();for(const shot of out){const key=`${Math.round(shot.angle*180/Math.PI)}:${Math.round(shot.power*100)}`;unique.set(key,shot);}return[...unique.values()];
}
function stateKey(state:GolfSimulationState):string{return`${Math.round(state.ball.x/28)}:${Math.round(state.ball.y/28)}:${state.popWalls.map(x=>x.active?1:0).join("")}:${state.popBumpers.map(x=>x.active?1:0).join("")}:${state.popVoids.map(x=>x.active?1:0).join("")}`;}
function canSolveFrom(level:LevelDefinition,start:GolfSimulationState):boolean{
  if(start.sunk)return true;if(start.voided||start.moving)return false;
  let beam:GolfSimulationState[]=[start];const depthMax=FULL?3:2,width=FULL?24:12;
  for(let depth=0;depth<depthMax;depth++){
    const next=new Map<string,{state:GolfSimulationState;score:number}>();
    for(const state of beam)for(let d=0;d<360;d+=(FULL?24:36))for(const power of[.42,.62,.80,.96]){
      const result=simulateShotToRest(level,state,{angle:rad(d),power},FULL?9:7);
      if(result.sunk)return true;if(result.voided||result.state.moving)continue;
      const score=dist(result.state.ball,level.hole),key=stateKey(result.state),old=next.get(key);if(!old||score<old.score)next.set(key,{state:result.state,score});
    }
    beam=[...next.values()].sort((a,b)=>a.score-b.score).slice(0,width).map(x=>x.state);if(!beam.length)break;
  }
  return false;
}
function agentProbe(level:LevelDefinition,agent:BeliefAgent):AgentProbe{
  const control=withoutHiddenTraps(level),shots=probeShots(level,agent);let triggers=0,punishes=0,terminals=0,terminalChecks=0;
  for(const shot of shots){
    const actual=simulateShotToRest(level,createGolfSimulationState(level),shot,FULL?9:7);
    const clean=simulateShotToRest(control,createGolfSimulationState(control),shot,FULL?9:7);
    const triggered=actual.state.triggeredTraps.length>0;if(!triggered)continue;triggers++;
    const delta=dist(actual.state.ball,clean.state.ball),penalty=dist(actual.state.ball,level.hole)-dist(clean.state.ball,level.hole);
    const punished=actual.voided||(clean.sunk&&!actual.sunk)||delta>55||penalty>65;if(punished)punishes++;
    if(terminalChecks<(FULL?12:6)&&!actual.voided&&!actual.sunk&&!actual.state.moving){terminalChecks++;if(!canSolveFrom(level,actual.state))terminals++;}
  }
  return{agent,samples:shots.length,triggerRate:shots.length?triggers/shots.length:0,punishRate:shots.length?punishes/shots.length:0,terminalRate:terminalChecks?terminals/terminalChecks:0};
}
function hioBypassResistance(level:LevelDefinition):number{
  let sunk=0,bypass=0;for(let d=0;d<360;d+=(FULL?6:12))for(const power of(FULL?[.55,.65,.75,.85,.95,1]:[.65,.80,.95,1])){
    const result=simulateShotToRest(level,createGolfSimulationState(level),{angle:rad(d),power},FULL?9:7);if(result.sunk){sunk++;if(result.state.triggeredTraps.length===0)bypass++;}
  }
  if(!sunk)return 1;return clamp(1-bypass/sunk,0,1);
}
function trapSignature(level:LevelDefinition,intent:TrollAuditIntent|null):number[]{
  return[level.popWalls?.length??0,level.popBumpers?.length??0,level.popVoids?.length??0,level.movingWalls?.length??0,level.trampolines?.length??0,level.boosters?.length??0,intent?.delayed?1:0,intent?.consequence==="terminal"?1:0];
}
function signatureDistance(a:number[],b:number[]):number{
  let sum=0;for(let i=0;i<a.length;i++)sum+=Math.abs((a[i]??0)-(b[i]??0));return clamp(sum/8,0,1);
}
function trollMetrics(level:LevelDefinition,row:Audit2Row):TrollMetrics{
  const intent=TROLL_AUDIT_INTENT[level.id]??null;
  const agents=(["blind","curious","suspicious"] as const).map(agent=>agentProbe(level,agent));
  const blind=agents[0]!,curious=agents[1]!,bait=clamp(Math.max(blind.triggerRate,curious.triggerRate)*.65+(row.naiveTrap?.triggerRate??0)*.35,0,1);
  const punish=clamp(Math.max(blind.punishRate,curious.punishRate)*.55+(row.naiveTrap?.punishRate??0)*.45,0,1);
  const terminalObserved=agents.some(x=>x.terminalRate>.45);
  const causal=intent?.causalCue==="ambiguous"?.45:intent?.causalCue==="delayed-clear"?.78:.92;
  const touch=profile(row,"touch").successRate,tolerance=row.minShotTolerance??touch;
  const learned=clamp(touch*.70+tolerance*.30,0,1),bypass=hioBypassResistance(level);
  const sig=trapSignature(level,intent),peers=levels.filter(x=>x.mode==="troll"&&x.id!==level.id);
  const nearest=peers.length?Math.min(...peers.map(other=>signatureDistance(sig,trapSignature(other,TROLL_AUDIT_INTENT[other.id]??null)))):1;
  const originality=clamp(.45+nearest*.55,0,1);
  const consequence=clamp(punish+(terminalObserved?.15:0),0,1);
  const knowledge=clamp(bait*causal*learned,0,1);
  const score=clamp((bait*.20+consequence*.19+causal*.13+learned*.22+bypass*.14+originality*.12)*100,0,100);
  return{intent,agents,baitStrength:bait,consequence,causalClarity:causal,learnedFairness:learned,bypassResistance:bypass,trapOriginality:originality,trollScore:score,terminalObserved,terminalIntentional:intent?.consequence==="terminal",knowledgeGainPotential:knowledge};
}

function artificialDifficulty(row:Audit2Row):number{
  const touch=profile(row,"touch").successRate,tol=row.minShotTolerance??touch,extra=Math.max(0,(row.humanStrokes??row.learnedStrokes??row.target)-row.target);
  return clamp(1+(1-touch)*2.1+(1-tol)*1.1+extra*.35,1,5);
}
function fuseStats(row:Audit2Row,h:HumanRow|undefined):StatsFusion{
  const artificial=profile(row,"touch").successRate,diff=artificialDifficulty(row);
  if(!h)return{available:false,confidence:"NONE",players:0,attempts:0,completedAttempts:0,artificialCompletion:artificial,humanCompletion:null,posteriorCompletion:artificial,artificialDifficulty:diff,humanDifficulty:null,fusedDifficulty:diff,avgFun:null,avgOriginality:null,avgSurprise:null,abandonmentRate:null,deviceMix:{mobile:0,desktop:0,other:0},disagreement:0,notes:["Sin snapshot humano; diagnóstico basado en modelo artificial."]};
  const players=n(h,"players")??0,attempts=n(h,"attempts")??0,completed=n(h,"completed_attempts","completedAttempts")??0;
  const completion=n(h,"attempt_completion_rate","attemptCompletionRate")??(attempts?completed/attempts:null);
  const feedbackN=n(h,"feedback_n","feedbackN")??0,humanDiff=n(h,"avg_difficulty","avgDifficulty"),prior=8;
  const posterior=(artificial*prior+completed)/(prior+attempts||1),humanWeight=humanDiff===null?0:Math.min(.85,feedbackN/16);
  const fused=diff*(1-humanWeight)+(humanDiff??diff)*humanWeight;
  const abandons=(n(h,"explicit_abandons","explicitAbandons")??0)+(n(h,"stale_attempts","staleAttempts")??0);
  const mobile=n(h,"mobile_players","mobilePlayers")??0,desktop=n(h,"desktop_players","desktopPlayers")??0;
  const confidence:Confidence=players>=20||attempts>=50?"HIGH":players>=6||attempts>=15?"MEDIUM":players>0?"LOW":"NONE";
  const completionGap=completion===null?0:Math.abs(completion-artificial),difficultyGap=humanDiff===null?0:Math.abs(humanDiff-diff),disagreement=clamp(Math.max(completionGap/.5,difficultyGap/2),0,1);
  const notes:string[]=[];
  if(confidence==="LOW")notes.push("Muestra humana pequeña: usar como señal, no como veredicto.");
  if(attempts>=10&&completionGap>.25)notes.push(`Modelo artificial/humano divergen en completion (${pct(artificial)} vs ${pct(completion??0)}).`);
  if(feedbackN>=5&&difficultyGap>=1.25)notes.push(`Dificultad artificial/humana diverge ${difficultyGap.toFixed(1)} puntos.`);
  const totalDevices=Math.max(players,mobile+desktop),other=Math.max(0,totalDevices-mobile-desktop);
  return{available:true,confidence,players,attempts,completedAttempts:completed,artificialCompletion:artificial,humanCompletion:completion,posteriorCompletion:posterior,artificialDifficulty:diff,humanDifficulty:humanDiff,fusedDifficulty:fused,avgFun:n(h,"avg_fun","avgFun"),avgOriginality:n(h,"avg_originality","avgOriginality"),avgSurprise:n(h,"avg_surprise","avgSurprise"),abandonmentRate:attempts?abandons/attempts:null,deviceMix:{mobile,desktop,other},disagreement,notes};
}
function stronger(a:Status,b:Status):Status{const rank:Record<Status,number>={PASS:0,REVIEW:1,BLOCKER:2};return rank[b]>rank[a]?b:a;}
function auditRow(level:LevelDefinition,row:Audit2Row):Audit3Row{
  const map=mapById.get(level.id)!,troll=level.mode==="troll"?trollMetrics(level,row):null,stats=fuseStats(row,humanByLevel.get(level.id)),advisories:string[]=[];
  if(map.nearestSimilarity>.72)advisories.push(`MAP_SIMILARITY:${map.nearestMap}:${Math.round(map.nearestSimilarity*100)}%`);
  if(map.spatialEntropy<.28&&level.group>=3)advisories.push("LOW_SPATIAL_ENTROPY");
  if(map.reachableOpenRatio<.45)advisories.push(`TOPOLOGY_TIGHT:${Math.round(map.reachableOpenRatio*100)}%`);
  if(stats.disagreement>.65&&stats.confidence!=="LOW"&&stats.confidence!=="NONE")advisories.push("HUMAN_MODEL_DISAGREEMENT");
  if(troll){
    const blind=troll.agents.find(x=>x.agent==="blind")!,curious=troll.agents.find(x=>x.agent==="curious")!;
    if(troll.baitStrength<.18)advisories.push(`WEAK_BAIT:${Math.round(troll.baitStrength*100)}%`);
    if(troll.consequence<.18)advisories.push(`WEAK_CONSEQUENCE:${Math.round(troll.consequence*100)}%`);
    if(troll.learnedFairness<.45)advisories.push(`LOW_LEARNED_FAIRNESS:${Math.round(troll.learnedFairness*100)}%`);
    if(troll.bypassResistance<.75)advisories.push(`TRAP_BYPASS_RISK:${Math.round(troll.bypassResistance*100)}%`);
    if(troll.terminalObserved&&!troll.terminalIntentional)advisories.push("POSSIBLE_ACCIDENTAL_TERMINAL");
    if(troll.intent?.expectedFirstTimeTrapRate){
      const observed=Math.max(blind.triggerRate,curious.triggerRate),{min,max}=troll.intent.expectedFirstTimeTrapRate;
      if(observed<min*.65)advisories.push(`BAIT_BELOW_INTENT:${Math.round(observed*100)}%`);
      if(observed>Math.min(1,max*1.2))advisories.push(`BAIT_ABOVE_INTENT:${Math.round(observed*100)}%`);
    }
  }
  let status=row.status;
  if(STRICT){
    if(advisories.includes("POSSIBLE_ACCIDENTAL_TERMINAL"))status=stronger(status,"BLOCKER");
    if(advisories.includes("HUMAN_MODEL_DISAGREEMENT"))status=stronger(status,"REVIEW");
    if(troll&&troll.learnedFairness<.30)status=stronger(status,"REVIEW");
  }
  return{id:level.id,mode:level.mode,baseStatus:row.status,status,baseFlags:row.flags,map,troll,stats,advisories};
}

const rows:Audit3Row[]=[];
for(const level of levels){const row=baseById.get(level.id);if(!row)throw new Error(`Audit V3 missing Audit 2 row for ${level.id}`);rows.push(auditRow(level,row));}
const summary={levels:rows.length,pass:rows.filter(x=>x.status==="PASS").length,review:rows.filter(x=>x.status==="REVIEW").length,blocker:rows.filter(x=>x.status==="BLOCKER").length,humanLevels:rows.filter(x=>x.stats.available).length,trollLevels:rows.filter(x=>x.troll).length};
const report:Audit3Report={version:"3.0-shadow",generatedAt:new Date().toISOString(),mode:STRICT?"strict":"shadow",humanSnapshot:human?.generatedAt??null,summary,rows};
mkdirSync("artifacts",{recursive:true});writeFileSync(OUT_JSON,JSON.stringify(report,null,2));

const md:string[]=[
  "# Hole in What? · Audit V3",
  "",
  `Mode: **${report.mode.toUpperCase()}** · ${summary.pass} PASS · ${summary.review} REVIEW · ${summary.blocker} BLOCKER · human data on ${summary.humanLevels}/${summary.levels} levels`,
  "",
  "V3 preserves Audit 2 status and adds belief-agent troll analysis, terminal-state probes, human/artificial metric fusion and map-structure diagnostics.",
  "",
  "| Level | V3 | Map | Human fusion | Troll | Advisories |",
  "|---|---:|---|---|---|---|"
];
for(const r of rows){
  const humanText=r.stats.available?`${r.stats.confidence} · post ${pct(r.stats.posteriorCompletion)} · diff ${r.stats.fusedDifficulty.toFixed(1)}/5`:"artificial only";
  const trollText=r.troll?`score ${Math.round(r.troll.trollScore)} · bait ${pct(r.troll.baitStrength)} · learned ${pct(r.troll.learnedFairness)}${r.troll.terminalObserved?" · terminal?":""}`:"—";
  md.push(`| ${r.id} | ${r.status} | ${r.map.layoutType} · near ${r.map.nearestMap??"—"} ${(r.map.nearestSimilarity*100).toFixed(0)}% | ${humanText} | ${trollText} | ${r.advisories.join(", ")||"—"} |`);
}
md.push("","## Troll agent detail","");
for(const r of rows.filter(x=>x.troll)){
  const t=r.troll!;md.push(`### ${r.id}`,`- Troll score: **${Math.round(t.trollScore)}** · consequence ${pct(t.consequence)} · causal clarity ${pct(t.causalClarity)} · bypass resistance ${pct(t.bypassResistance)} · trap originality ${pct(t.trapOriginality)}.`);
  md.push(`- Learned fairness: ${pct(t.learnedFairness)} · knowledge-gain potential ${pct(t.knowledgeGainPotential)} · terminal observed ${t.terminalObserved?"yes":"no"} · terminal intended ${t.terminalIntentional?"yes":"no"}.`);
  md.push(`- Agents: ${t.agents.map(a=>`${a.agent} trigger ${pct(a.triggerRate)} / punish ${pct(a.punishRate)} / terminal ${pct(a.terminalRate)}`).join(" · ")}.`);
  if(t.intent?.note)md.push(`- Intent: ${t.intent.note}`);
  if(r.advisories.length)md.push(`- Advisories: ${r.advisories.join(", ")}`);
  md.push("");
}
writeFileSync(OUT_MD,md.join("\n"));

console.log(`Audit V3 ${report.mode}: ${summary.pass}/${summary.levels} PASS · ${summary.review} REVIEW · ${summary.blocker} BLOCKER · human ${summary.humanLevels}/${summary.levels}`);
for(const r of rows){
  const troll=r.troll?` · troll ${Math.round(r.troll.trollScore)} bait ${pct(r.troll.baitStrength)} learned ${pct(r.troll.learnedFairness)}`:"";
  const humanText=r.stats.available?` · human ${r.stats.confidence} post ${pct(r.stats.posteriorCompletion)}`:"";
  console.log(`${r.id.padEnd(10)} ${r.status.padEnd(7)} map ${r.map.layoutType.padEnd(8)} near ${(r.map.nearestSimilarity*100).toFixed(0).padStart(2)}%${troll}${humanText}${r.advisories.length?` · ${r.advisories.join("|")}`:""}`);
}
if(STRICT&&summary.blocker>0)process.exitCode=1;
