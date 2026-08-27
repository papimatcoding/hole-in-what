import type { GameMode } from "../types";

const ENDPOINT="https://xtekdrkqgfjnnwawyoim.supabase.co/functions/v1/beta-feedback";
export const BETA_BUILD_ID="beta-step-2-5-v1";
const TESTER_KEY="troll-golf-beta-tester-id-v1";
const ALIAS_KEY="troll-golf-beta-tester-alias-v1";
const ASKED_ALIAS_KEY="troll-golf-beta-tester-alias-asked-v1";
const LEVEL_SENT_KEY="troll-golf-beta-level-surveys-v1";
const GAME_SENT_KEY="troll-golf-beta-game-surveys-v1";
const ATTEMPTS_KEY="troll-golf-beta-attempts-v1";

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
async function post(payload:Record<string,unknown>):Promise<{ok:boolean;duplicate?:boolean}>{
  try{
    const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true});
    if(!res.ok)return{ok:false};
    const data=await res.json() as {ok?:boolean;duplicate?:boolean};return{ok:data.ok===true,duplicate:data.duplicate};
  }catch{return{ok:false};}
}
function attemptMap():Record<string,number>{try{const raw=safeGet(ATTEMPTS_KEY);const parsed=raw?JSON.parse(raw):{};return parsed&&typeof parsed==="object"?parsed:{};}catch{return{};}}

export const BetaTelemetry={
  testerId,
  alias,
  async ensureTester(askAlias=false):Promise<void>{
    const id=testerId();
    if(askAlias&&safeGet(ASKED_ALIAS_KEY)!=="1"){
      safeSet(ASKED_ALIAS_KEY,"1");
      const name=window.prompt("Beta de Troll Golf · nombre/apodo opcional","")?.trim().slice(0,40)??"";
      if(name)safeSet(ALIAS_KEY,name);
    }
    await post({type:"tester",testerId:id,alias:alias(),userAgent:navigator.userAgent,screenW:window.screen.width,screenH:window.screen.height});
  },
  beginAttempt(levelId:string):number{
    const map=attemptMap(),key=`${BETA_BUILD_ID}:${levelId}`;map[key]=(map[key]??0)+1;safeSet(ATTEMPTS_KEY,JSON.stringify(map));return map[key]!;
  },
  attempts(levelId:string):number{return attemptMap()[`${BETA_BUILD_ID}:${levelId}`]??1;},
  async submitRun(input:{levelId:string;mode:GameMode;strokes:number;timeMs:number;stars:number;trapsTriggered?:string[];mechanicsUsed?:string[];voids?:number;}):Promise<void>{
    await this.ensureTester(false);
    await post({type:"run",testerId:testerId(),buildId:BETA_BUILD_ID,levelId:input.levelId,mode:input.mode,attempts:this.attempts(input.levelId),strokes:input.strokes,timeMs:input.timeMs,stars:input.stars,trapsTriggered:input.trapsTriggered??[],mechanicsUsed:input.mechanicsUsed??[],voids:input.voids??0,completed:true});
  },
  levelSurveyDone(levelId:string):boolean{return loadSet(LEVEL_SENT_KEY).has(`${BETA_BUILD_ID}:${levelId}`);},
  async submitLevelFeedback(input:{levelId:string;mode:GameMode;fun:number;originality:number;difficulty:number;surprise?:number|null;tags?:string[];comment?:string;}):Promise<boolean>{
    await this.ensureTester(false);
    const result=await post({type:"level_feedback",testerId:testerId(),buildId:BETA_BUILD_ID,...input});
    if(result.ok){const set=loadSet(LEVEL_SENT_KEY);set.add(`${BETA_BUILD_ID}:${input.levelId}`);saveSet(LEVEL_SENT_KEY,set);}
    return result.ok;
  },
  gameSurveyDone():boolean{return loadSet(GAME_SENT_KEY).has(BETA_BUILD_ID);},
  async submitGameFeedback(input:{overallFun:number;controls:number;variety:number;difficultyCurve:number;hardMode?:number|null;wouldKeepPlaying:boolean;favouriteLevel?:string;worstLevel?:string;ideas?:string;}):Promise<boolean>{
    await this.ensureTester(false);
    const result=await post({type:"game_feedback",testerId:testerId(),buildId:BETA_BUILD_ID,...input});
    if(result.ok){const set=loadSet(GAME_SENT_KEY);set.add(BETA_BUILD_ID);saveSet(GAME_SENT_KEY,set);}
    return result.ok;
  }
};
