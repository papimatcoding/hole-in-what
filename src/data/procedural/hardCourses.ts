import type { CurveDef, FanDef, LevelDefinition, MovingBumperDef, MovingWallDef, PortalPairDef } from "../../types";
import { WALL, blank, mirrorRect, mirrorX, r, seeded, type Rng } from "./courseUtils";

interface Ctx { index:number; difficulty:number; mirror:boolean; rng:Rng; }

const fan=(x:number,y:number,w:number,h:number,dx:number,dy:number,strength=285):FanDef=>({x,y,w,h,dx,dy,strength});
const portal=(ax:number,ay:number,bx:number,by:number,rad=28):PortalPairDef=>({a:{x:ax,y:ay,r:rad},b:{x:bx,y:by,r:rad}});
const movingWall=(x:number,y:number,w:number,h:number,axis:"x"|"y",amplitude:number,speed=1.1,phase=0):MovingWallDef=>({x,y,w,h,axis,amplitude,speed,phase});
const movingBumper=(x:number,y:number,rad:number,axis:"x"|"y",amplitude:number,speed=1.15,phase=0):MovingBumperDef=>({x,y,r:rad,axis,amplitude,speed,phase});
const curve=(x:number,y:number,rad:number,startDeg:number,endDeg:number,thickness=22):CurveDef=>({x,y,r:rad,startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180,thickness});

function slalom(ctx:Ctx):LevelDefinition{
  const level=blank("troll",ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  const ys=[650,475,300];
  ys.forEach((y,i)=>{
    const left=(i+(ctx.mirror?1:0))%2===0;
    const gapW=Math.round(118-ctx.difficulty*18);
    if(left) level.walls!.push(r(95+gapW,y,512-(95+gapW),WALL));
    else level.walls!.push(r(28,y,350-28,WALL));
  });
  return level;
}

function fanCurve(ctx:Ctx):LevelDefinition{
  const level=blank("troll",ctx.index,mirrorX(420,ctx.mirror),mirrorX(105,ctx.mirror));
  level.walls=[mirrorRect(r(270,570,WALL,230),ctx.mirror),mirrorRect(r(95,285,245,WALL),ctx.mirror)];
  level.curves=ctx.mirror?[curve(300,365,125,80,175,22)]:[curve(240,365,125,5,100,22)];
  const z=mirrorRect(r(310,470,145,82),ctx.mirror);
  level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.82:0.82,-0.38,285+ctx.difficulty*35)];
  return level;
}

function portalSlalom(ctx:Ctx):LevelDefinition{
  const level=slalom(ctx);
  level.portals=[portal(mirrorX(390,ctx.mirror),570,mirrorX(145,ctx.mirror),390,27)];
  return level;
}

function moverCurve(ctx:Ctx):LevelDefinition{
  const level=fanCurve(ctx);
  level.fans=[];
  level.movingBumpers=[movingBumper(ctx.mirror?350:190,505,31,"y",66+ctx.difficulty*16,1.08+ctx.difficulty*0.12,ctx.rng.next()*Math.PI)];
  level.movingWalls=[movingWall(ctx.mirror?335:180,555,WALL,110,"x",62+ctx.difficulty*14,1.02+ctx.difficulty*0.15,ctx.rng.next()*Math.PI)];
  return level;
}

function bridge(ctx:Ctx,trampoline:boolean):LevelDefinition{
  const level=blank("troll",ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  level.voids=[r(55,430,430,74)];
  level.walls=[mirrorRect(r(220,600,WALL,165),ctx.mirror),mirrorRect(r(310,245,WALL,145),ctx.mirror),mirrorRect(r(90,285,245,WALL),ctx.mirror)];
  if(trampoline){
    level.trampolines=[{x:mirrorX(165,ctx.mirror),y:550,r:36,power:445+ctx.difficulty*12}];
  }else{
    const rx=ctx.mirror?318:110;
    level.ramps=[{x:rx,y:515,w:112,h:72,dx:0,dy:-1,lift:350+ctx.difficulty*18,boost:38+ctx.difficulty*8}];
  }
  return level;
}

function mastery(ctx:Ctx):LevelDefinition{
  const level=slalom(ctx);
  const z=mirrorRect(r(315,510,135,120),ctx.mirror);
  level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.72:0.72,-0.32,295+ctx.difficulty*30)];
  level.curves=[ctx.mirror?curve(380,370,88,350,85,20):curve(160,370,88,95,190,20)];
  level.movingBumpers=[movingBumper(ctx.mirror?355:185,425,31,"x",65,1.15,ctx.rng.next()*Math.PI)];
  return level;
}

function addTrap(level:LevelDefinition,ctx:Ctx):void{
  const kind=(ctx.index-1)%3;
  const anchorX=270+(ctx.mirror?-1:1)*ctx.rng.int(-55,55);
  const anchorY=ctx.rng.int(350,555);
  const triggerY=Math.min(750,anchorY+125);
  if(kind===0) level.popWalls=[{x:anchorX-68,y:anchorY,w:136,h:22,triggerX:anchorX,triggerY,triggerRadius:92}];
  else if(kind===1) level.popBumpers=[{x:anchorX,y:anchorY,r:34,triggerX:anchorX,triggerY,triggerRadius:96}];
  else level.popVoids=[{x:anchorX-52,y:anchorY-26,w:104,h:52,triggerX:anchorX,triggerY,triggerRadius:98}];
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
    const z=mirrorRect(r(315,515,130,105),ctx.mirror);
    level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.72:0.72,-0.25,300+ctx.difficulty*25)];
  }
  if(index>=11 && family!==2 && index%4===0){
    level.portals=[portal(mirrorX(395,ctx.mirror),610,mirrorX(130,ctx.mirror),390,27)];
  }
  if(index>=16 && family!==3){
    level.movingWalls=[movingWall(ctx.mirror?335:180,390,WALL,105,"y",55,1.15,ctx.rng.next()*Math.PI)];
  }
  addTrap(level,ctx);
  return level;
}
