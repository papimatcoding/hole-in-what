import { BetaTelemetry } from "./BetaTelemetrySystem";
import { CommunityDrafts } from "./CommunityDraftSystem";
import type { LevelDefinition } from "../types";

const ENDPOINT="https://xtekdrkqgfjnnwawyoim.supabase.co/functions/v1/community-maps";
export type CommunitySort="trending"|"top"|"new";
export type CommunityReportCategory="bug"|"impossible"|"inappropriate"|"spam"|"other";

export interface CommunityMapCard{
  id:string;
  title:string;
  description:string;
  creator:string;
  createdAt:string;
  ratingCount:number;
  stars:number|null;
  plays:number;
  uniquePlayers:number;
  recentRuns:number;
  recentPlayers:number;
  playingNow:number;
  trendScore:number;
  isMine:boolean;
  featured:boolean;
  mapKind:"single"|"course";
  holeCount:number;
}

export interface CommunityMapDetail extends CommunityMapCard{
  level:LevelDefinition;
  canRate:boolean;
}

export interface CommunityComment{
  id:number;
  name:string;
  body:string;
  createdAt:string;
  updatedAt:string;
  isMine:boolean;
}

async function post<T>(payload:Record<string,unknown>):Promise<T|null>{
  try{
    const response=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!response.ok){try{return await response.json() as T;}catch{return null;}}
    return await response.json() as T;
  }catch{return null;}
}

export const CommunityMaps={
  async publishSavedDraft(draftId:string,title:string,description=""):Promise<{ok:boolean;mapId?:string;error?:string}>{
    const draft=CommunityDrafts.get(draftId);if(!draft)return{ok:false,error:"no_draft"};
    if(!draft.playtestedAt)return{ok:false,error:"playtest_required"};
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;mapId?:string;error?:string}>({type:"publish",testerId:BetaTelemetry.testerId(),title,description,level:draft.level,playtested:true});
    return result?.ok?{ok:true,mapId:result.mapId}:{ok:false,error:result?.error??"network"};
  },
  async list(sort:CommunitySort="trending"):Promise<CommunityMapCard[]>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;maps?:CommunityMapCard[]}>({type:"list",testerId:BetaTelemetry.testerId(),sort});
    return result?.ok&&Array.isArray(result.maps)?result.maps:[];
  },
  async get(mapId:string):Promise<CommunityMapDetail|null>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;map?:CommunityMapDetail}>({type:"get",testerId:BetaTelemetry.testerId(),mapId});
    return result?.ok&&result.map?result.map:null;
  },
  async delete(mapId:string):Promise<{ok:boolean;error?:string}>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;error?:string}>({type:"delete",testerId:BetaTelemetry.testerId(),mapId});
    return result?.ok?{ok:true}:{ok:false,error:result?.error??"network"};
  },
  async rate(mapId:string,stars:number,difficulty=3):Promise<{ok:boolean;duplicate?:boolean;error?:string}>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;duplicate?:boolean;error?:string}>({type:"rate",testerId:BetaTelemetry.testerId(),mapId,stars,difficulty});
    return result?.ok?{ok:true,duplicate:result.duplicate}:{ok:false,error:result?.error??"network"};
  },
  async comments(mapId:string):Promise<CommunityComment[]>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;comments?:CommunityComment[]}>({type:"comments",testerId:BetaTelemetry.testerId(),mapId});
    return result?.ok&&Array.isArray(result.comments)?result.comments:[];
  },
  async comment(mapId:string,comment:string):Promise<{ok:boolean;error?:string}>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;error?:string}>({type:"comment",testerId:BetaTelemetry.testerId(),mapId,comment});
    return result?.ok?{ok:true}:{ok:false,error:result?.error??"network"};
  },
  async report(mapId:string,category:CommunityReportCategory,note=""):Promise<{ok:boolean;error?:string}>{
    await BetaTelemetry.ensureTester(false);
    const result=await post<{ok?:boolean;error?:string}>({type:"report",testerId:BetaTelemetry.testerId(),mapId,category,note});
    return result?.ok?{ok:true}:{ok:false,error:result?.error??"network"};
  },
  async submitRun(mapId:string,strokes:number,timeMs:number,completed=true):Promise<void>{
    await BetaTelemetry.ensureTester(false);
    await post({type:"run",testerId:BetaTelemetry.testerId(),mapId,strokes,timeMs,completed});
  }
};
