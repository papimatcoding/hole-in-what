import type Phaser from "phaser";
import { BETA_BUILD_ID, BetaTelemetry } from "./BetaTelemetrySystem";

const ENDPOINT="https://xtekdrkqgfjnnwawyoim.supabase.co/functions/v1/beta-feedback";
const HEARTBEAT_MS=30_000;

export interface LiveStatus{
  maintenance:boolean;
  patchLabel:string;
  etaText:string;
  message:string;
  updatedAt:string|null;
}

const DEFAULT_STATUS:LiveStatus={maintenance:false,patchLabel:"BETA",etaText:"",message:"Estamos aplicando una actualización.",updatedAt:null};
let cachedStatus:LiveStatus={...DEFAULT_STATUS};
let cachedOnline:number|null=null;
let timer:number|null=null;
let visibilityBound=false;
const listeners=new Set<(count:number|null)=>void>();

async function post<T>(payload:Record<string,unknown>):Promise<T|null>{
  try{
    const res=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true});
    if(!res.ok)return null;
    return await res.json() as T;
  }catch{return null;}
}

function readStatus(data:Partial<LiveStatus>|null|undefined):LiveStatus{
  return {
    maintenance:Boolean(data?.maintenance),
    patchLabel:typeof data?.patchLabel==="string"&&data.patchLabel?data.patchLabel:DEFAULT_STATUS.patchLabel,
    etaText:typeof data?.etaText==="string"?data.etaText:"",
    message:typeof data?.message==="string"&&data.message?data.message:DEFAULT_STATUS.message,
    updatedAt:typeof data?.updatedAt==="string"?data.updatedAt:null
  };
}

function notifyOnline():void{for(const fn of listeners)fn(cachedOnline);}

export const LiveOps={
  status():LiveStatus{return{...cachedStatus};},
  online():number|null{return cachedOnline;},
  onOnline(fn:(count:number|null)=>void):()=>void{listeners.add(fn);fn(cachedOnline);return()=>listeners.delete(fn);},
  async fetchStatus():Promise<LiveStatus>{
    const data=await post<{ok?:boolean}&Partial<LiveStatus>>({type:"status"});
    if(data?.ok)cachedStatus=readStatus(data);
    return this.status();
  },
  async heartbeat(scene="game"):Promise<{online:number|null;status:LiveStatus}>{
    await BetaTelemetry.ensureTester(false);
    const data=await post<{ok?:boolean;online?:number}&Partial<LiveStatus>>({type:"presence",testerId:BetaTelemetry.testerId(),buildId:BETA_BUILD_ID,scene});
    if(data?.ok){
      if(Number.isInteger(data.online)){cachedOnline=Math.max(0,Number(data.online));notifyOnline();}
      cachedStatus=readStatus(data);
    }
    return{online:cachedOnline,status:this.status()};
  },
  start(game:Phaser.Game):void{
    if(timer!==null)return;
    const tick=async():Promise<void>=>{
      if(document.visibilityState==="hidden")return;
      const active=game.scene.getScenes(true)[0]?.scene.key??"game";
      const result=await this.heartbeat(active);
      const now=game.scene.getScenes(true)[0]?.scene.key;
      if(result.status.maintenance&&now!=="maintenance")game.scene.start("maintenance",{status:result.status});
      else if(!result.status.maintenance&&now==="maintenance")game.scene.start("menu");
    };
    void tick();
    timer=window.setInterval(()=>{void tick();},HEARTBEAT_MS);
    if(!visibilityBound){
      visibilityBound=true;
      document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")void tick();});
    }
  }
};
