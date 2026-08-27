import type { GameMode } from "../types";

const ENDPOINT="https://xtekdrkqgfjnnwawyoim.supabase.co/functions/v1/beta-feedback";
export const BETA_BUILD_ID="beta-block-1-friends-rc5-1";
const TESTER_KEY="troll-golf-beta-tester-id-v1";
const ALIAS_KEY="troll-golf-beta-tester-alias-v1";
const LEVEL_SENT_KEY="troll-golf-beta-level-surveys-v1";
const GAME_SENT_KEY="troll-golf-beta-game-surveys-v1";
const ATTEMPTS_KEY="troll-golf-beta-attempts-v1";

export interface LeaderboardEntry{rank:number;name:string;strokes:number;timeMs:number;isYou:boolean;}
export type BetaReportCategory="bug"|"too-easy"|"too-hard"|"repetitive"|"object"|"other";
export type BetaSupportCategory="comment"|"bug"|"suggestion"|"other";

function safeGet(key:string):string|null{try{return localStorage.getItem(key);}catch{return null;}}
function safeSet(key:string,value:string):void{try{localStorage.setItem(key,value);}catch{/* beta telemetry must never break gameplay */}}
function testerId():string{
  let id=safeGet(TESTER_KEY);
  if(id)return id;
  try{id=crypto.randomUUID();}catch{id=`00000000-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12,"0").slice(0,12)}`;}
  safeSet(TESTER_KEY,id);return id;
}
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
async function registerTester():Promise<boolean>{
  const result=await post({type:"tester",testerId:testerId(),alias:alias(),userAgent:navigator.userAgent,screenW:window.screen.width,screenH:window.screen.height});
  return result?.ok===true;
}

export const BetaTelemetry={
  testerId,
  alias,
  async ensureTester(_askAlias=false):Promise<void>{await registerTester();},
  async setAlias(value:string):Promise<boolean>{
    const name=value.trim().replace(/\s+/g," ").slice(0,40);
    if(!name)return false;
    // Profile editing must remain usable even if the beta backend is temporarily unavailable.
    // Persist locally first; every later ensureTester/run submission will retry syncing this alias.
    safeSet(ALIAS_KEY,name);
    void registerTester();
    return alias()===name;
  },
  beginAttempt(levelId:string):number{
    const map=attemptMap(),key=`${BETA_BUILD_ID}:${levelId}`;map[key]=(map[key]??0)+1;safeSet(ATTEMPTS_KEY,JSON.stringify(map));return map[key]!;
  },
  attempts(levelId:string):number{return attemptMap()[`${BETA_BUILD_ID}:${levelId}`]??1;},
  async submitRun(input:{levelId:string;mode:GameMode;strokes:number;timeMs:number;stars:number;trapsTriggered?:string[];mechanicsUsed?:string[];voids?:number;}):Promise<void>{
    await this.ensureTester(false);
    await post({type:"run",testerId:testerId(),buildId:BETA_BUILD_ID,levelId:input.levelId,mode:input.mode,attempts:this.attempts(input.levelId),strokes:input.strokes,timeMs:input.timeMs,stars:input.stars,trapsTriggered:input.trapsTriggered??[],mechanicsUsed:input.mechanicsUsed??[],voids:input.voids??0,completed:true});
  },
  async submitReport(input:{levelId:string;mode:GameMode;category:BetaReportCategory;note?:string;strokes?:number|null;timeMs?:number|null;}):Promise<boolean>{
    await this.ensureTester(false);
    const result=await post({type:"report",testerId:testerId(),buildId:BETA_BUILD_ID,...input});
    return result?.ok===true;
  },
  async submitSupport(input:{category:BetaSupportCategory;message:string;}):Promise<boolean>{
    await this.ensureTester(false);
    const result=await post({type:"support",testerId:testerId(),buildId:BETA_BUILD_ID,category:input.category,message:input.message});
    return result?.ok===true;
  },
  async leaderboard(levelId:string):Promise<LeaderboardEntry[]>{
    await this.ensureTester(false);
    const data=await post<{ok?:boolean;entries?:LeaderboardEntry[]}>({type:"leaderboard",testerId:testerId(),buildId:BETA_BUILD_ID,levelId});
    return data?.ok&&Array.isArray(data.entries)?data.entries:[];
  },
  levelSurveyDone(levelId:string):boolean{return loadSet(LEVEL_SENT_KEY).has(`${BETA_BUILD_ID}:${levelId}`);},
  async submitLevelFeedback(input:{levelId:string;mode:GameMode;fun:number;originality:number;difficulty:number;surprise?:number|null;tags?:string[];comment?:string;}):Promise<boolean>{
    await this.ensureTester(false);
    const result=await post({type:"level_feedback",testerId:testerId(),buildId:BETA_BUILD_ID,...input});
    if(result?.ok){const set=loadSet(LEVEL_SENT_KEY);set.add(`${BETA_BUILD_ID}:${input.levelId}`);saveSet(LEVEL_SENT_KEY,set);}
    return result?.ok===true;
  },
  gameSurveyDone():boolean{return loadSet(GAME_SENT_KEY).has(BETA_BUILD_ID);},
  async submitGameFeedback(input:{overallFun:number;controls:number;variety:number;difficultyCurve:number;hardMode?:number|null;wouldKeepPlaying:boolean;favouriteLevel?:string;worstLevel?:string;ideas?:string;}):Promise<boolean>{
    await this.ensureTester(false);
    const result=await post({type:"game_feedback",testerId:testerId(),buildId:BETA_BUILD_ID,...input});
    if(result?.ok){const set=loadSet(GAME_SENT_KEY);set.add(BETA_BUILD_ID);saveSet(GAME_SENT_KEY,set);}
    return result?.ok===true;
  }
};
