import { BetaTelemetry } from "./BetaTelemetrySystem";
import type { LevelDefinition } from "../types";

const ENDPOINT="https://xtekdrkqgfjnnwawyoim.supabase.co/functions/v1/community-maps";
const EDITOR_DRAFT_KEY="troll-golf-editor-draft-v2";

export interface CommunityMapCard{
  id:string;
  title:string;
  description:string;
  creator:string;
  createdAt:string;
  ratingCount:number;
  fun:number|null;
  originality:number|null;
  difficulty:number|null;
  bugs:number;
  score:number;
  isMine:boolean;
  featured:boolean;
}

export interface CommunityMapDetail extends CommunityMapCard{
  level:LevelDefinition;
  canRate:boolean;
}

async function post<T>(payload:Record<string,unknown>):Promise<T|null>{
  try{
    const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!response.ok)return null;
    return await response.json() as T;
  }catch{return null;}
}

function currentDraft():LevelDefinition|null{
  try{
    const raw=localStorage.getItem(EDITOR_DRAFT_KEY);if(!raw)return null;
    const parsed=JSON.parse(raw) as LevelDefinition;
    if(!parsed?.ball||!parsed?.hole)return null;
    return parsed;
  }catch{return null;}
}

export const CommunityMaps={
  currentDraft,
  async publishDraft(title:string,description=""):Promise<{ok:boolean;mapId?:string;error?:string}>{
    const level=currentDraft();if(!level)return{ok:false,error:"no_draft"};
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;mapId?:string;error?:string}>({type:"publish",testerId:BetaTelemetry.testerId(),title,description,level});
    return result?.ok?{ok:true,mapId:result.mapId}:{ok:false,error:result?.error??"network"};
  },
  async list(sort:"top"|"new"="top"):Promise<CommunityMapCard[]>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;maps?:CommunityMapCard[]}>({type:"list",testerId:BetaTelemetry.testerId(),sort});
    return result?.ok&&Array.isArray(result.maps)?result.maps:[];
  },
  async get(mapId:string):Promise<CommunityMapDetail|null>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;map?:CommunityMapDetail}>({type:"get",testerId:BetaTelemetry.testerId(),mapId});
    return result?.ok&&result.map?result.map:null;
  },
  async rate(mapId:string,input:{fun:number;originality:number;difficulty:number;bug?:boolean;comment?:string}):Promise<{ok:boolean;duplicate?:boolean;error?:string}>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;duplicate?:boolean;error?:string}>({type:"rate",testerId:BetaTelemetry.testerId(),mapId,...input});
    return result?.ok?{ok:true,duplicate:result.duplicate}:{ok:false,error:result?.error??"network"};
  },
  async submitRun(mapId:string,strokes:number,timeMs:number,completed=true):Promise<void>{
    await BetaTelemetry.ensureTester(false);
    await post({type:"run",testerId:BetaTelemetry.testerId(),mapId,strokes,timeMs,completed});
  }
};
