import type { LevelDefinition, TrollTrapArchetype, Vec2 } from "../../types";
import { goal } from "./courseUtils";

const clamp=(v:number,min:number,max:number):number=>Math.max(min,Math.min(max,v));

function directPoint(level:LevelDefinition,fraction:number):Vec2 {
  const q=clamp(fraction,0,1);
  return {x:level.ball.x+(level.hole.x-level.ball.x)*q,y:level.ball.y+(level.hole.y-level.ball.y)*q};
}

function directFrame(level:LevelDefinition):{dir:Vec2;normal:Vec2} {
  const dx=level.hole.x-level.ball.x,dy=level.hole.y-level.ball.y,len=Math.hypot(dx,dy)||1;
  const dir={x:dx/len,y:dy/len};
  return {dir,normal:{x:-dir.y,y:dir.x}};
}

function sampleDesignRoute(level:LevelDefinition,fraction:number):Vec2 {
  const pts=level.designPath?.length?[level.ball,...level.designPath,level.hole]:[level.ball,level.hole];
  const lengths:number[]=[];let total=0;
  for(let i=0;i<pts.length-1;i+=1){const len=Math.hypot(pts[i+1]!.x-pts[i]!.x,pts[i+1]!.y-pts[i]!.y);lengths.push(len);total+=len;}
  let remaining=total*clamp(fraction,0,1);
  for(let i=0;i<lengths.length;i+=1){const len=lengths[i]!;if(remaining<=len){const q=len?remaining/len:0;return{x:pts[i]!.x+(pts[i+1]!.x-pts[i]!.x)*q,y:pts[i]!.y+(pts[i+1]!.y-pts[i]!.y)*q};}remaining-=len;}
  return {...pts[pts.length-1]!};
}

function protectPortals(level:LevelDefinition):void {
  if(!(level.portals?.length))return;
  const endpoints=level.portals.flatMap(pair=>[pair.a,pair.b]);
  level.walls=(level.walls??[]).filter(w=>{
    if(w.w<=w.h*2)return true;
    return !endpoints.some(p=>Math.abs((w.y+w.h/2)-p.y)<62);
  });
}

function tuneClassicMeaning(level:LevelDefinition,index:number):void {
  if(index===7){
    const p=sampleDesignRoute(level,.56);
    level.bumpers=[{x:p.x,y:p.y,r:34}];
    level.primaryMechanic="bumper";
  }

  if(index===9||index===20){
    level.bumpers=[];
    level.primaryMechanic="wall";
  }

  if(index===25){
    const p=directPoint(level,.54),{normal}=directFrame(level);
    level.fans=[{x:p.x-88,y:p.y-58,w:176,h:116,dx:normal.x,dy:normal.y,strength:315}];
    level.primaryMechanic="fan";
  }

  if(index===39&&level.portals?.length){level.curves=[];level.primaryMechanic="portal";}
}

function trapTriggerFraction(archetype:TrollTrapArchetype):number {
  switch(archetype){
    case "floor-drop":case "safe-lane-collapse":return .30;
    case "gate-pop":case "cross-gate":case "late-combo":return .33;
    case "bumper-ambush":return .36;
    case "rebound-punish":return .46;
  }
}

/** Six late layouts deflect the ball before the generic direct-line trigger. Their troll beat
 * is intentionally pulled into the first clean segment instead of enlarging the trigger to
 * half the board, which would make the reveal feel arbitrary. */
const EARLY_TROLL_BEAT=new Set([15,18,27,30,35,39]);

function calibrateHardTrap(level:LevelDefinition,index:number):void {
  const archetype:TrollTrapArchetype=level.trollArchetype??"gate-pop",early=EARLY_TROLL_BEAT.has(index);
  const trigger=directPoint(level,early?.22:trapTriggerFraction(archetype));
  const anchor=directPoint(level,early?.46:.64),late=directPoint(level,early?.58:.77);
  const {dir,normal}=directFrame(level),side=index%2===0?1:-1;
  const triggerBase={triggerX:trigger.x,triggerY:trigger.y,triggerRadius:early?104:112};

  level.popWalls=[];level.popBumpers=[];level.popVoids=[];
  const routeMostlyVertical=Math.abs(dir.y)>=Math.abs(dir.x);

  if(archetype==="gate-pop"){
    level.popWalls=[routeMostlyVertical?{x:anchor.x-66,y:anchor.y-11,w:132,h:22,...triggerBase}:{x:anchor.x-11,y:anchor.y-66,w:22,h:132,...triggerBase}];
    return;
  }
  if(archetype==="bumper-ambush"){
    level.popBumpers=[{x:anchor.x+normal.x*24*side,y:anchor.y+normal.y*24*side,r:33,...triggerBase,triggerRadius:early?108:114}];
    return;
  }
  if(archetype==="floor-drop"){
    level.popVoids=[{x:anchor.x-54,y:anchor.y-28,w:108,h:56,...triggerBase,triggerRadius:116}];
    return;
  }
  if(archetype==="cross-gate"){
    level.popWalls=[routeMostlyVertical?{x:anchor.x-12+normal.x*34*side,y:anchor.y-60,w:24,h:120,...triggerBase}:{x:anchor.x-60,y:anchor.y-12+normal.y*34*side,w:120,h:24,...triggerBase}];
    return;
  }
  if(archetype==="safe-lane-collapse"){
    level.popVoids=[{x:anchor.x-54+normal.x*22*side,y:anchor.y-28+normal.y*22*side,w:108,h:56,...triggerBase,triggerRadius:118}];
    return;
  }
  if(archetype==="rebound-punish"){
    level.popBumpers=[{x:late.x+normal.x*30*side,y:late.y+normal.y*30*side,r:35,...triggerBase,triggerRadius:early?108:116}];
    return;
  }

  const first=directPoint(level,early?.44:.59);
  level.popWalls=[routeMostlyVertical?{x:first.x-55,y:first.y-10,w:110,h:20,...triggerBase,triggerRadius:early?108:114}:{x:first.x-10,y:first.y-55,w:20,h:110,...triggerBase,triggerRadius:early?108:114}];
  if(index>=15){level.popBumpers=[{x:late.x+normal.x*28*side,y:late.y+normal.y*28*side,r:31,triggerX:first.x,triggerY:first.y,triggerRadius:88}];}
}

function classicGoals(level:LevelDefinition,index:number):void {
  let strokes=index<=3?1:index<=20?2:3;if(index===31||index===38||index===40)strokes=2;
  level.threeStar=goal(strokes);level.twoStar=goal(strokes+1);level.group=Math.ceil(index/10);
}
function hardGoals(level:LevelDefinition,index:number):void {
  const strokes=index<=10?3:4;level.threeStar=goal(strokes);level.twoStar=goal(strokes+1);level.group=Math.ceil(index/10);
}

export function applyPostAuditBalance(level:LevelDefinition,index:number):LevelDefinition {
  protectPortals(level);
  if(level.mode==="classic"){tuneClassicMeaning(level,index);classicGoals(level,index);}
  else{calibrateHardTrap(level,index);hardGoals(level,index);}
  return level;
}
