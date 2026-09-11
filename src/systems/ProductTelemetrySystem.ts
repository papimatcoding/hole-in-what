import { BETA_TESTING } from "../config/beta";
import type { GameMode } from "../types";
import { BETA_BUILD_ID, BetaTelemetry } from "./BetaTelemetrySystem";

const ENDPOINT="https://xtekdrkqgfjnnwawyoim.supabase.co/functions/v1/product-telemetry";
const ONCE_KEY="troll-golf-product-events-once-v1";
const PULSE_KEY="troll-golf-product-pulse-v1";
const PULSE_SNOOZE_KEY="troll-golf-product-pulse-snooze-v1";
const SESSION_ID=makeUuid();
const SESSION_STARTED_AT=performance.now();
const PULSE_SNOOZE_MS=24*60*60*1000;

export type ProductEventName=
  |"session_start"|"session_end"|"menu_view"|"mode_open"
  |"level_start"|"level_complete"|"level_retry"|"level_exit"
  |"tutorial_start"|"tutorial_complete"|"hard_discovered"|"hard_started"
  |"pulse_view"|"pulse_skip";
export type PurchaseIntent="yes"|"maybe"|"no";

interface EventInput{
  eventName:ProductEventName;
  scene?:string;
  levelId?:string;
  mode?:GameMode;
  valueText?:string;
  valueBool?:boolean;
  metadata?:Record<string,unknown>;
}

function makeUuid():string{try{return crypto.randomUUID();}catch{return`00000000-0000-4000-8000-${Math.random().toString(16).slice(2).padEnd(12,"0").slice(0,12)}`;}}
function safeGet(key:string):string|null{try{return localStorage.getItem(key);}catch{return null;}}
function safeSet(key:string,value:string):void{try{localStorage.setItem(key,value);}catch{/* analytics must never block play */}}
function onceSet():Set<string>{try{const parsed=JSON.parse(safeGet(ONCE_KEY)??"[]");return new Set(Array.isArray(parsed)?parsed:[]);}catch{return new Set();}}
function saveOnce(set:Set<string>):void{safeSet(ONCE_KEY,JSON.stringify([...set]));}
async function post(payload:Record<string,unknown>):Promise<boolean>{
  if(!BETA_TESTING)return false;
  try{
    const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true});
    if(!res.ok)return false;
    const data=await res.json() as {ok?:boolean};return data.ok===true;
  }catch{return false;}
}

let sessionStarted=false;
let sessionStartPromise:Promise<void>|null=null;
async function ensureSession():Promise<void>{
  if(!BETA_TESTING||sessionStarted)return;
  if(sessionStartPromise)return sessionStartPromise;
  sessionStartPromise=(async()=>{
    await BetaTelemetry.ensureTester(false);
    const ok=await post({type:"product_event",testerId:BetaTelemetry.testerId(),buildId:BETA_BUILD_ID,sessionId:SESSION_ID,eventName:"session_start",scene:"app",metadata:{language:navigator.language??null}});
    if(ok)sessionStarted=true;
  })().finally(()=>{sessionStartPromise=null;});
  return sessionStartPromise;
}

async function track(input:EventInput):Promise<boolean>{
  if(!BETA_TESTING)return false;
  await ensureSession();
  return post({type:"product_event",testerId:BetaTelemetry.testerId(),buildId:BETA_BUILD_ID,sessionId:SESSION_ID,...input});
}

function trackOnce(input:EventInput):void{
  const key=`${BETA_BUILD_ID}:${input.eventName}:${input.levelId??input.mode??"global"}`;
  const set=onceSet();if(set.has(key))return;
  void track(input).then(ok=>{if(!ok)return;const next=onceSet();next.add(key);saveOnce(next);});
}

function endSession():void{
  if(!BETA_TESTING||!sessionStarted)return;
  void post({type:"product_event",testerId:BetaTelemetry.testerId(),buildId:BETA_BUILD_ID,sessionId:SESSION_ID,eventName:"session_end",scene:"app",metadata:{durationMs:Math.round(performance.now()-SESSION_STARTED_AT)}});
}

if(typeof window!=="undefined"){
  window.addEventListener("pagehide",endSession,{capture:true});
}

export const ProductTelemetry={
  sessionId():string{return SESSION_ID;},
  ensureSession,
  track(input:EventInput):void{void track(input);},
  trackOnce,
  pulseDone():boolean{return safeGet(PULSE_KEY)===BETA_BUILD_ID;},
  pulseSnoozed():boolean{const value=Number(safeGet(PULSE_SNOOZE_KEY)??0);return Number.isFinite(value)&&Date.now()-value<PULSE_SNOOZE_MS;},
  snoozePulse():void{safeSet(PULSE_SNOOZE_KEY,String(Date.now()));this.track({eventName:"pulse_skip",scene:"menu"});},
  async submitPulse(input:{wouldKeepPlaying:boolean;purchaseIntent:PurchaseIntent;contextLevelId?:string;mode?:GameMode;}):Promise<boolean>{
    if(!BETA_TESTING)return false;
    await ensureSession();
    const ok=await post({type:"product_pulse",testerId:BetaTelemetry.testerId(),buildId:BETA_BUILD_ID,sessionId:SESSION_ID,contextLevelId:input.contextLevelId??null,mode:input.mode??null,wouldKeepPlaying:input.wouldKeepPlaying,purchaseIntent:input.purchaseIntent});
    if(ok)safeSet(PULSE_KEY,BETA_BUILD_ID);
    return ok;
  }
};
