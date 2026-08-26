import type { LevelDefinition, Vec2 } from "../../types";
import { goal, r, WALL } from "./courseUtils";

const FIELD_LEFT=28;
const FIELD_RIGHT=512;
const clamp=(v:number,min:number,max:number):number=>Math.max(min,Math.min(max,v));

function sampleRoute(level:LevelDefinition,fraction:number):Vec2 {
  const pts=level.designPath?.length?level.designPath:[level.ball,level.hole];
  const lengths:number[]=[];let total=0;
  for(let i=0;i<pts.length-1;i+=1){const len=Math.hypot(pts[i+1]!.x-pts[i]!.x,pts[i+1]!.y-pts[i]!.y);lengths.push(len);total+=len;}
  let remaining=total*clamp(fraction,0,1);
  for(let i=0;i<lengths.length;i+=1){const len=lengths[i]!;if(remaining<=len){const q=len?remaining/len:0;return{x:pts[i]!.x+(pts[i+1]!.x-pts[i]!.x)*q,y:pts[i]!.y+(pts[i+1]!.y-pts[i]!.y)*q};}remaining-=len;}
  return {...pts[pts.length-1]!};
}

function addCheckpoint(level:LevelDefinition,fraction:number,gap:number,offset:number):void {
  const p=sampleRoute(level,fraction),y=clamp(p.y,250,730),half=gap/2,center=clamp(p.x+offset,FIELD_LEFT+half+16,FIELD_RIGHT-half-16);
  const left=center-half,right=center+half;
  if((level.walls??[]).some(w=>w.w>w.h*2&&Math.abs(w.y-y)<38))return;
  if(left>FIELD_LEFT+16)level.walls=[...(level.walls??[]),r(FIELD_LEFT,y,left-FIELD_LEFT,WALL)];
  if(right<FIELD_RIGHT-16)level.walls=[...(level.walls??[]),r(right,y,FIELD_RIGHT-right,WALL)];
}

function protectPortals(level:LevelDefinition):void {
  if(!(level.portals?.length))return;
  const endpoints=level.portals.flatMap(pair=>[pair.a,pair.b]);
  level.walls=(level.walls??[]).filter(w=>{
    if(w.w<=w.h*2)return true;
    // Generated checkpoint bars close to an endpoint can cause sanitizeCourse to delete
    // the portal and leave an impossible full-width barrier. The intentional portal wall
    // sits between the endpoints and is retained.
    return !endpoints.some(p=>Math.abs((w.y+w.h/2)-p.y)<62);
  });
}

function classicGoals(level:LevelDefinition,index:number):void {
  let strokes=index<=3?1:index<=20?2:3;
  // A new traversal mechanic gets a forgiving mastery target on its introduction hole.
  if(index===31||index===38||index===40)strokes=2;
  const timed=index>=20&&index%4===0&&index!==40;
  const seconds=timed?Math.round(12+strokes*4+index*.22):undefined;
  level.threeStar=goal(strokes,seconds);
  level.twoStar=goal(strokes+2);
  level.group=Math.ceil(index/10);
}

function hardGoals(level:LevelDefinition,index:number):void {
  const strokes=index<=10?3:4;
  const timed=index>=12&&(index%4===0||index>=36);
  const seconds=timed?Math.round(14+strokes*4+index*.28):undefined;
  level.threeStar=goal(strokes,seconds);
  level.twoStar=goal(strokes+3);
  level.group=Math.ceil(index/10);
}

export function applyPostAuditBalance(level:LevelDefinition,index:number):LevelDefinition {
  protectPortals(level);
  if(level.mode==="classic"){
    // The first physics audit found these otherwise good layouts had a very cheap
    // one-shot line. One route-aligned checkpoint makes the existing mechanic matter
    // without changing the visual identity of the hole.
    if([23,25,27,30].includes(index))addCheckpoint(level,.34,index<27?166:156,index%2===0?30:-30);
    classicGoals(level,index);
  }else{
    // HARD keeps its denser procedural geometry; the audit showed the star schedule,
    // not raw object count, was the biggest mismatch. Four strokes is already a strict
    // mastery target once the surprise layer is involved.
    hardGoals(level,index);
  }
  return level;
}
