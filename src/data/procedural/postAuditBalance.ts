import type { LevelDefinition, TrollTrapArchetype, Vec2 } from "../../types";
import { goal } from "./courseUtils";

const clamp=(v:number,min:number,max:number):number=>Math.max(min,Math.min(max,v));

function directPoint(level:LevelDefinition,fraction:number):Vec2 {
  const q=clamp(fraction,0,1);
  return {
    x:level.ball.x+(level.hole.x-level.ball.x)*q,
    y:level.ball.y+(level.hole.y-level.ball.y)*q
  };
}

function directFrame(level:LevelDefinition):{dir:Vec2;normal:Vec2} {
  const dx=level.hole.x-level.ball.x,dy=level.hole.y-level.ball.y,len=Math.hypot(dx,dy)||1;
  const dir={x:dx/len,y:dy/len};
  return {dir,normal:{x:-dir.y,y:dir.x}};
}

function protectPortals(level:LevelDefinition):void {
  if(!(level.portals?.length))return;
  const endpoints=level.portals.flatMap(pair=>[pair.a,pair.b]);
  level.walls=(level.walls??[]).filter(w=>{
    if(w.w<=w.h*2)return true;
    return !endpoints.some(p=>Math.abs((w.y+w.h/2)-p.y)<62);
  });
}

/**
 * The generated designPath describes the learned route. A troll trap should instead
 * react to the tempting first-attempt line. Reframing only the surprise layer around
 * ball→hole keeps each base silhouette intact while making the joke readable.
 */
function calibrateHardTrap(level:LevelDefinition,index:number):void {
  const archetype: TrollTrapArchetype = level.trollArchetype ?? "gate-pop";
  const trigger=directPoint(level,.43),anchor=directPoint(level,.64),late=directPoint(level,.77);
  const {dir,normal}=directFrame(level);
  const side=index%2===0?1:-1;
  const triggerBase={triggerX:trigger.x,triggerY:trigger.y,triggerRadius:108};

  level.popWalls=[];
  level.popBumpers=[];
  level.popVoids=[];

  const routeMostlyVertical=Math.abs(dir.y)>=Math.abs(dir.x);
  if(archetype==="gate-pop"){
    level.popWalls=[routeMostlyVertical
      ? {x:anchor.x-66,y:anchor.y-11,w:132,h:22,...triggerBase}
      : {x:anchor.x-11,y:anchor.y-66,w:22,h:132,...triggerBase}];
    return;
  }

  if(archetype==="bumper-ambush"){
    level.popBumpers=[{
      x:anchor.x+normal.x*24*side,
      y:anchor.y+normal.y*24*side,
      r:33,
      ...triggerBase,
      triggerRadius:112
    }];
    return;
  }

  if(archetype==="floor-drop"){
    level.popVoids=[{x:anchor.x-52,y:anchor.y-27,w:104,h:54,...triggerBase,triggerRadius:112}];
    return;
  }

  if(archetype==="cross-gate"){
    // A half-gate steals the obvious lane without sealing the board into a corridor.
    level.popWalls=[routeMostlyVertical
      ? {x:anchor.x-12+normal.x*34*side,y:anchor.y-60,w:24,h:120,...triggerBase}
      : {x:anchor.x-60,y:anchor.y-12+normal.y*34*side,w:120,h:24,...triggerBase}];
    return;
  }

  if(archetype==="safe-lane-collapse"){
    // Offset hazard: after the reveal there are still two readable choices around it.
    level.popVoids=[{
      x:anchor.x-53+normal.x*22*side,
      y:anchor.y-27+normal.y*22*side,
      w:106,
      h:54,
      ...triggerBase,
      triggerRadius:116
    }];
    return;
  }

  if(archetype==="rebound-punish"){
    level.popBumpers=[{
      x:late.x+normal.x*30*side,
      y:late.y+normal.y*30*side,
      r:35,
      ...triggerBase,
      triggerRadius:114
    }];
    return;
  }

  // The late combo uses two familiar beats, separated enough to remain readable.
  const first=directPoint(level,.59);
  level.popWalls=[routeMostlyVertical
    ? {x:first.x-55,y:first.y-10,w:110,h:20,...triggerBase,triggerRadius:108}
    : {x:first.x-10,y:first.y-55,w:20,h:110,...triggerBase,triggerRadius:108}];
  if(index>=15){
    level.popBumpers=[{
      x:late.x+normal.x*28*side,
      y:late.y+normal.y*28*side,
      r:31,
      triggerX:first.x,
      triggerY:first.y,
      triggerRadius:88
    }];
  }
}

function classicGoals(level:LevelDefinition,index:number):void {
  let strokes=index<=3?1:index<=20?2:3;
  if(index===31||index===38||index===40)strokes=2;
  level.threeStar=goal(strokes);
  level.twoStar=goal(strokes+1);
  level.group=Math.ceil(index/10);
}

function hardGoals(level:LevelDefinition,index:number):void {
  const strokes=index<=10?3:4;
  level.threeStar=goal(strokes);
  level.twoStar=goal(strokes+1);
  level.group=Math.ceil(index/10);
}

function cleanMeaninglessLateModifier(level:LevelDefinition,index:number):void {
  // Classic 39's audited HIO used the portal and completely ignored its decorative
  // curve. A late modifier that contributes nothing is worse than a clear advanced
  // portal hole, so remove the noise instead of pretending it is extra difficulty.
  if(level.mode==="classic"&&index===39&&level.portals?.length){
    level.curves=[];
    level.primaryMechanic="portal";
  }
}

export function applyPostAuditBalance(level:LevelDefinition,index:number):LevelDefinition {
  protectPortals(level);
  cleanMeaninglessLateModifier(level,index);
  if(level.mode==="classic")classicGoals(level,index);
  else{
    calibrateHardTrap(level,index);
    hardGoals(level,index);
  }
  return level;
}
