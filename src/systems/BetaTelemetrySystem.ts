import type { GameMode } from "../types";

const ENDPOINT="https://xtekdrkqgfjnnwawyoim.supabase.co/functions/v1/beta-feedback";
export const BETA_BUILD_ID="hole-in-what-beta-rc6";
// Keep legacy storage keys so the rename never resets anonymous identity, survey state or attempts.
const TESTER_KEY="troll-golf-beta-tester-id-v1";
const ALIAS_KEY="troll-golf-beta-tester-alias-v1";
const LEVEL_SENT_KEY="troll-golf-beta-level-surveys-v1";
const GAME_SENT_KEY="troll-golf-beta-game-surveys-v1";
const ATTEMPTS_KEY="troll-golf-beta-attempts-v1";

export interface LeaderboardEntry{rank:number;name:string;strokes:number;timeMs:number;isYou:boolean;}
export type BetaReportCategory="bug"|"too-easy"|"too-hard"|"repetitive"|"object"|"other";
export type BetaSupportCategory="comment"|"bug"|"suggestion"|"other";
export type BetaInputKind="touch"|"mouse"|"pen"|"unknown";
export type BetaShotOutcome="rest"|"void"|"hole";

function safeGet(key:string):string|null{try{return localStorage.getItem(key);}catch{return null;}}
function safeSet(key:string,value:string):void{try{localStorage.setItem(key,value);}catch{/* beta telemetry must never break gameplay */}}
function newUuid():string{try{return crypto.randomUUID();}catch{return`00000000-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12,"0").slice(0,12)}`;}}
function testerId():string{let id=safeGet(TESTER_KEY);if(id)return id;id=newUuid();safeSet(TESTER_KEY,id);return id;}
function alias():string|null{return safeGet(ALIAS_KEY);}
function loadSet(key:string):Set<string>{try{const raw=safeGet(key);const parsed=raw?JSON.parse(raw):[];return new Set(Array.isArray(parsed)?parsed:[]);}catch{return new Set();}}
function saveSet(key:string,set:Set<string>):void{safeSet(key,JSON.stringify([...set]));}
async function post<T extends {ok?:boolean;duplicate?:boolean}>(payload:Record<string,unknown>):Promise<T|null>{
  try{
    const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true});
    if(!res.ok){try{return await res.json() as T;}catch{return null;}}
    return await res.json() as T;
  }catch{return null;}
}
function attemptMap():Record<string,number>{try{const raw=safeGet(ATTEMPTS_KEY);const parsed=raw?JSON.parse(raw):{};return parsed&&typeof parsed==="object"?parsed:{};}catch{return{};}}
function coarsePointer():boolean{try{return matchMedia("(pointer: coarse)").matches;}catch{return false;}}
function deviceClass():"mobile"|"tablet"|"desktop"|"unknown"{
  try{const coarse=coarsePointer(),short=Math.min(window.innerWidth,window.innerHeight);if(coarse&&short<600)return"mobile";if(coarse)return"tablet";return"desktop";}catch{return"unknown";}
}
function bucket(value:number):number{return Math.max(0,Math.round(value/100)*100);}
async function registerTester():Promise<boolean>{
  // Deliberately avoid sending a full user-agent string. Coarse device/input information is enough
  // for control calibration and is materially less fingerprintable than UA + exact screen size.
  const result=await post({type:"tester",testerId:testerId(),alias:alias(),userAgent:null,screenW:bucket(window.innerWidth),screenH:bucket(window.innerHeight),deviceClass:deviceClass(),pointerCoarse:coarsePointer()});
  return result?.ok===true;
}
let testerReady:Promise<boolean>|null=null;
const attemptStarts=new Map<string,Promise<unknown>>();
const activeAttemptByLevel=new Map<string,string>();
async function ensureRegistered():Promise<void>{
  testerReady??=registerTester();
  const ok=await testerReady;
  if(!ok)testerReady=null;
}
async function waitForAttempt(attemptId:string):Promise<void>{
  const pending=attemptStarts.get(attemptId);
  if(pending)await pending;
  else await ensureRegistered();
}

export const BetaTelemetry={
  testerId,
  alias,
  async ensureTester(_askAlias=false):Promise<void>{await ensureRegistered();},
  async setAlias(value:string):Promise<boolean>{
    const name=value.trim().replace(/\s+/g," ").slice(0,40);
    if(!name)return false;
    safeSet(ALIAS_KEY,name);testerReady=null;void ensureRegistered();return alias()===name;
  },
  beginAttempt(levelId:string,mode?:GameMode):string{
    const resolvedMode=mode??(levelId.startsWith("troll-")?"troll":"classic");
    const map=attemptMap(),key=`${BETA_BUILD_ID}:${levelId}`;map[key]=(map[key]??0)+1;safeSet(ATTEMPTS_KEY,JSON.stringify(map));
    const attemptId=newUuid(),attemptNumber=map[key]!;
    activeAttemptByLevel.set(levelId,attemptId);
    const start=ensureRegistered().then(()=>post({type:"attempt_start",testerId:testerId(),buildId:BETA_BUILD_ID,attemptId,attemptNumber,levelId,mode:resolvedMode}));
    attemptStarts.set(attemptId,start);void start.finally(()=>attemptStarts.delete(attemptId));
    return attemptId;
  },
  attempts(levelId:string):number{return attemptMap()[`${BETA_BUILD_ID}:${levelId}`]??1;},
  async submitShot(input:{attemptId:string;levelId:string;mode:GameMode;shotIndex:number;inputKind:BetaInputKind;startX:number;startY:number;angleDeg:number;power:number;endX:number;endY:number;durationMs:number;outcome:BetaShotOutcome;eventKinds?:string[]}):Promise<void>{
    await waitForAttempt(input.attemptId);
    await post({type:"shot",testerId:testerId(),buildId:BETA_BUILD_ID,...input});
  },
  async endAttempt(input:{attemptId:string;levelId:string;mode:GameMode;completed:boolean;exitReason:string;strokes:number;timeMs:number;voids:number;}):Promise<void>{
    await waitForAttempt(input.attemptId);
    await post({type:"attempt_end",testerId:testerId(),buildId:BETA_BUILD_ID,...input});
    // Completed attempts stay available until Results submits beta_runs, so all three layers can be joined.
    // Abandoned/retried attempts are removed immediately and can never be attached to a later run.
    if(!input.completed&&activeAttemptByLevel.get(input.levelId)===input.attemptId)activeAttemptByLevel.delete(input.levelId);
  },
  async submitRun(input:{attemptId?:string;levelId:string;mode:GameMode;strokes:number;timeMs:number;stars:number;trapsTriggered?:string[];mechanicsUsed?:string[];voids?:number;}):Promise<void>{
    // Resolve synchronously before the first await. A very fast RETRY can start the next attempt while
    // this network request is pending, but it must never steal the completed run's attempt link.
    const attemptId=input.attemptId??activeAttemptByLevel.get(input.levelId)??null;
    await ensureRegistered();
    if(attemptId)await waitForAttempt(attemptId);
    await post({type:"run",testerId:testerId(),buildId:BETA_BUILD_ID,levelId:input.levelId,mode:input.mode,attemptId,attempts:this.attempts(input.levelId),strokes:input.strokes,timeMs:input.timeMs,stars:input.stars,trapsTriggered:input.trapsTriggered??[],mechanicsUsed:input.mechanicsUsed??[],voids:input.voids??0,completed:true});
    if(attemptId&&activeAttemptByLevel.get(input.levelId)===attemptId)activeAttemptByLevel.delete(input.levelId);
  },
  async submitReport(input:{levelId:string;mode:GameMode;category:BetaReportCategory;note?:string;strokes?:number|null;timeMs?:number|null;}):Promise<boolean>{
    await ensureRegistered();
    const result=await post({type:"report",testerId:testerId(),buildId:BETA_BUILD_ID,...input});return result?.ok===true;
  },
  async submitSupport(input:{category:BetaSupportCategory;message:string;}):Promise<boolean>{
    await ensureRegistered();
    const result=await post({type:"support",testerId:testerId(),buildId:BETA_BUILD_ID,category:input.category,message:input.message});return result?.ok===true;
  },
  async leaderboard(levelId:string):Promise<LeaderboardEntry[]>{
    await ensureRegistered();
    const data=await post<{ok?:boolean;entries?:LeaderboardEntry[]}>({type:"leaderboard",testerId:testerId(),buildId:BETA_BUILD_ID,levelId});return data?.ok&&Array.isArray(data.entries)?data.entries:[];
  },
  levelSurveyDone(levelId:string):boolean{return loadSet(LEVEL_SENT_KEY).has(`${BETA_BUILD_ID}:${levelId}`);},
  async submitLevelFeedback(input:{levelId:string;mode:GameMode;fun:number;originality:number;difficulty:number;surprise?:number|null;tags?:string[];comment?:string;}):Promise<boolean>{
    await ensureRegistered();
    const result=await post({type:"level_feedback",testerId:testerId(),buildId:BETA_BUILD_ID,...input});
    if(result?.ok){const set=loadSet(LEVEL_SENT_KEY);set.add(`${BETA_BUILD_ID}:${input.levelId}`);saveSet(LEVEL_SENT_KEY,set);}return result?.ok===true;
  },
  gameSurveyDone():boolean{return loadSet(GAME_SENT_KEY).has(BETA_BUILD_ID);},
  async submitGameFeedback(input:{overallFun:number;controls:number;variety:number;difficultyCurve:number;hardMode?:number|null;wouldKeepPlaying:boolean;favouriteLevel?:string;worstLevel?:string;ideas?:string;}):Promise<boolean>{
    await ensureRegistered();
    const result=await post({type:"game_feedback",testerId:testerId(),buildId:BETA_BUILD_ID,...input});
    if(result?.ok){const set=loadSet(GAME_SENT_KEY);set.add(BETA_BUILD_ID);saveSet(GAME_SENT_KEY,set);}return result?.ok===true;
  }
};
