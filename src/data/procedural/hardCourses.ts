import type { CurveDef, FanDef, LevelDefinition, MovingBumperDef, MovingWallDef, PortalPairDef, Vec2 } from "../../types";
import { WALL, blank, mirrorRect, mirrorX, r, seeded, setDesignPath, type Rng } from "./courseUtils";

interface Ctx { index:number; difficulty:number; mirror:boolean; rng:Rng; }

const fan=(x:number,y:number,w:number,h:number,dx:number,dy:number,strength=285):FanDef=>({x,y,w,h,dx,dy,strength});
const portal=(ax:number,ay:number,bx:number,by:number,rad=28):PortalPairDef=>({a:{x:ax,y:ay,r:rad},b:{x:bx,y:by,r:rad}});
const movingWall=(x:number,y:number,w:number,h:number,axis:"x"|"y",amplitude:number,speed=1.1,phase=0):MovingWallDef=>({x,y,w,h,axis,amplitude,speed,phase});
const movingBumper=(x:number,y:number,rad:number,axis:"x"|"y",amplitude:number,speed=1.15,phase=0):MovingBumperDef=>({x,y,r:rad,axis,amplitude,speed,phase});
const curve=(x:number,y:number,rad:number,startDeg:number,endDeg:number,thickness=22):CurveDef=>({x,y,r:rad,startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180,thickness});

function slalom(ctx:Ctx):LevelDefinition{
  const level=blank("troll",ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  const ys=[650,475,300];
  const route:Vec2[]=[];
  ys.forEach((y,i)=>{
    const left=(i+(ctx.mirror?1:0))%2===0;
    const gapW=Math.round(118-ctx.difficulty*18);
    if(left){
      const wallX=95+gapW;
      level.walls!.push(r(wallX,y,512-wallX,WALL));
      route.push({x:(28+wallX)/2,y:y+34});
    }else{
      level.walls!.push(r(28,y,350-28,WALL));
      route.push({x:431,y:y+34});
    }
  });
  return setDesignPath(level,route);
}

function fanCurve(ctx:Ctx):LevelDefinition{
  const level=blank("troll",ctx.index,mirrorX(420,ctx.mirror),mirrorX(105,ctx.mirror));
  level.walls=[mirrorRect(r(270,570,WALL,230),ctx.mirror),mirrorRect(r(95,285,245,WALL),ctx.mirror)];
  level.curves=ctx.mirror?[curve(300,365,125,80,175,22)]:[curve(240,365,125,5,100,22)];
  const p1={x:mirrorX(175,ctx.mirror),y:620};
  const p2={x:mirrorX(160,ctx.mirror),y:415};
  const p3={x:mirrorX(170,ctx.mirror),y:300};
  setDesignPath(level,[p1,p2,p3]);
  const z=r(p1.x-68,p1.y-105,136,112);
  level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.82:0.82,-0.38,285+ctx.difficulty*35)];
  return level;
}

function portalSlalom(ctx:Ctx):LevelDefinition{
  const level=slalom(ctx);
  const a={x:mirrorX(390,ctx.mirror),y:590};
  const b={x:mirrorX(145,ctx.mirror),y:335};
  level.portals=[portal(a.x,a.y,b.x,b.y,27)];
  const route=level.designPath!;
  level.designPath=[level.ball,route[1] ?? a,a,b,route[route.length-2] ?? b,level.hole];
  return level;
}

function moverCurve(ctx:Ctx):LevelDefinition{
  const level=fanCurve(ctx);
  level.fans=[];
  const route=level.designPath!;
  const p=route[1] ?? {x:270,y:520};
  level.movingBumpers=[movingBumper(p.x,p.y-40,31,"y",60+ctx.difficulty*16,1.08+ctx.difficulty*0.12,ctx.rng.next()*Math.PI)];
  const q=route[2] ?? {x:270,y:430};
  level.movingWalls=[movingWall(q.x-12,q.y-25,WALL,105,"x",56+ctx.difficulty*14,1.02+ctx.difficulty*0.15,ctx.rng.next()*Math.PI)];
  return level;
}

function bridge(ctx:Ctx,trampoline:boolean):LevelDefinition{
  const level=blank("troll",ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  const launchX=mirrorX(165,ctx.mirror);
  level.voids=[r(55,430,430,74)];
  level.walls=[mirrorRect(r(220,600,WALL,165),ctx.mirror),mirrorRect(r(310,245,WALL,145),ctx.mirror),mirrorRect(r(90,285,245,WALL),ctx.mirror)];
  if(trampoline){
    level.trampolines=[{x:launchX,y:555,r:36,power:445+ctx.difficulty*12}];
  }else{
    level.ramps=[{x:launchX-56,y:530,w:112,h:72,dx:0,dy:-1,lift:350+ctx.difficulty*18,boost:38+ctx.difficulty*8}];
  }
  return setDesignPath(level,[{x:launchX,y:565},{x:launchX,y:390},{x:mirrorX(405,ctx.mirror),y:300}]);
}

function mastery(ctx:Ctx):LevelDefinition{
  const level=slalom(ctx);
  const route=level.designPath!;
  const p=route[1] ?? {x:350,y:620};
  const z=r(p.x-60,p.y-95,120,110);
  level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.72:0.72,-0.32,295+ctx.difficulty*30)];
  const q=route[2] ?? {x:190,y:475};
  level.curves=[curve(q.x,q.y-70,88,ctx.mirror?350:95,ctx.mirror?85:190,20)];
  level.movingBumpers=[movingBumper(q.x,q.y-20,31,"x",58,1.15,ctx.rng.next()*Math.PI)];
  return level;
}

function pointOnRoute(level:LevelDefinition,fraction:number):Vec2{
  const pts=level.designPath ?? [level.ball,level.hole];
  const lengths:number[]=[];
  let total=0;
  for(let i=0;i<pts.length-1;i+=1){
    const len=Math.hypot(pts[i+1]!.x-pts[i]!.x,pts[i+1]!.y-pts[i]!.y);
    lengths.push(len); total+=len;
  }
  let remaining=total*Math.max(0,Math.min(1,fraction));
  for(let i=0;i<lengths.length;i+=1){
    const len=lengths[i]!;
    if(remaining<=len){
      const q=len>0?remaining/len:0;
      return {x:pts[i]!.x+(pts[i+1]!.x-pts[i]!.x)*q,y:pts[i]!.y+(pts[i+1]!.y-pts[i]!.y)*q};
    }
    remaining-=len;
  }
  return {...pts[pts.length-1]!};
}

function addTrap(level:LevelDefinition,ctx:Ctx):void{
  const kind=(ctx.index-1)%3;
  const anchor=pointOnRoute(level,0.57);
  const trigger=pointOnRoute(level,0.44);
  if(kind===0){
    level.popWalls=[{x:anchor.x-66,y:anchor.y-11,w:132,h:22,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:92}];
  }else if(kind===1){
    level.popBumpers=[{x:anchor.x,y:anchor.y,r:34,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:96}];
  }else{
    level.popVoids=[{x:anchor.x-50,y:anchor.y-25,w:100,h:50,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:98}];
  }
}

export function buildHardCourse(index:number):LevelDefinition{
  const rng=seeded(0xa11ce+index*104729);
  const ctx:Ctx={index,difficulty:0.55+(index-1)/19*0.45,mirror:rng.bool(),rng};
  const family=(index-1)%6;
  let level:LevelDefinition;
  if(family===0) level=slalom(ctx);
  else if(family===1) level=fanCurve(ctx);
  else if(family===2) level=portalSlalom(ctx);
  else if(family===3) level=moverCurve(ctx);
  else if(family===4) level=bridge(ctx,index%2===0);
  else level=mastery(ctx);

  if(index>=6 && family!==1 && family!==5){
    const p=pointOnRoute(level,0.32);
    const z=r(p.x-58,p.y-70,116,105);
    level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.72:0.72,-0.25,300+ctx.difficulty*25)];
  }
  if(index>=11 && family!==2 && index%4===0){
    const a=pointOnRoute(level,0.30);
    const b=pointOnRoute(level,0.70);
    level.portals=[portal(a.x,a.y,b.x,b.y,27)];
  }
  if(index>=16 && family!==3){
    const p=pointOnRoute(level,0.68);
    level.movingWalls=[movingWall(p.x-12,p.y-50,WALL,100,"y",52,1.15,ctx.rng.next()*Math.PI)];
  }
  addTrap(level,ctx);
  return level;
}
