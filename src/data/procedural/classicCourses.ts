import type { CurveDef, FanDef, GameMode, LevelDefinition, MovingBumperDef, MovingWallDef, PortalPairDef } from "../../types";
import { WALL, blank, mirrorRect, mirrorX, r, seeded, type Rng } from "./courseUtils";

interface Ctx { index:number; difficulty:number; mirror:boolean; rng:Rng; }
type Builder = (ctx:Ctx,mode:GameMode)=>LevelDefinition;

const bump=(x:number,y:number,rad=31)=>({x,y,r:rad});
const fan=(x:number,y:number,w:number,h:number,dx:number,dy:number,strength=250):FanDef=>({x,y,w,h,dx,dy,strength});
const portal=(ax:number,ay:number,bx:number,by:number,rad=29):PortalPairDef=>({a:{x:ax,y:ay,r:rad},b:{x:bx,y:by,r:rad}});
const movingWall=(x:number,y:number,w:number,h:number,axis:"x"|"y",amplitude:number,speed=1.05,phase=0):MovingWallDef=>({x,y,w,h,axis,amplitude,speed,phase});
const movingBumper=(x:number,y:number,rad:number,axis:"x"|"y",amplitude:number,speed=1.15,phase=0):MovingBumperDef=>({x,y,r:rad,axis,amplitude,speed,phase});
const curve=(x:number,y:number,rad:number,startDeg:number,endDeg:number,thickness=22):CurveDef=>({x,y,r:rad,startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180,thickness});

function dogleg(ctx:Ctx,mode:GameMode):LevelDefinition{
  const left=!ctx.mirror;
  const level=blank(mode,ctx.index,left?105:435,left?420:120);
  const vx=left?245:271;
  level.walls=[r(vx,390,WALL,385)];
  if(ctx.difficulty>0.15) level.walls.push(r(left?269:120,390,145,WALL));
  return level;
}

function gates(ctx:Ctx,mode:GameMode,count:number):LevelDefinition{
  const level=blank(mode,ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  const ys=count===1?[475]:count===2?[590,365]:[650,475,300];
  ys.forEach((y,i)=>{
    const gapLeft=(i+(ctx.mirror?1:0))%2===0;
    const gapW=Math.round(142-ctx.difficulty*38);
    if(gapLeft) level.walls!.push(r(95+gapW,y,512-(95+gapW),WALL));
    else level.walls!.push(r(28,y,350-28,WALL));
  });
  return level;
}

function bumperCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=dogleg(ctx,mode);
  level.bumpers=[bump(mirrorX(390,ctx.mirror),520,32)];
  level.walls!.push(mirrorRect(r(90,295,245,WALL),ctx.mirror));
  return level;
}

function surfaceCourse(ctx:Ctx,mode:GameMode,surface:"sand"|"ice"):LevelDefinition{
  const level=gates(ctx,mode,2);
  const zone=mirrorRect(r(315,420,145,130),ctx.mirror);
  if(surface==="sand") level.sand=[zone]; else level.ice=[zone];
  return level;
}

function fanCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=dogleg(ctx,mode);
  const z=mirrorRect(r(285,520,165,165),ctx.mirror);
  level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.82:0.82,-0.34,225+ctx.difficulty*55)];
  return level;
}

function curveCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=blank(mode,ctx.index,mirrorX(420,ctx.mirror),mirrorX(105,ctx.mirror));
  level.walls=[mirrorRect(r(270,565,WALL,230),ctx.mirror)];
  level.curves=ctx.mirror?[curve(300,365,130,80,175,22)]:[curve(240,365,130,5,100,22)];
  return level;
}

function portalCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=blank(mode,ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  level.walls=[r(28,470,484,WALL)];
  level.portals=[portal(mirrorX(150,ctx.mirror),610,mirrorX(385,ctx.mirror),350,30)];
  return level;
}

function movingGate(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=gates(ctx,mode,2);
  level.movingWalls=[movingWall(ctx.mirror?335:180,430,WALL,125,"x",62+ctx.difficulty*18,0.88+ctx.difficulty*0.22,ctx.rng.next()*Math.PI)];
  return level;
}

function movingBumperCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=gates(ctx,mode,2);
  level.movingBumpers=[movingBumper(270,480,30,"x",78+ctx.difficulty*18,0.98+ctx.difficulty*0.24,ctx.rng.next()*Math.PI)];
  return level;
}

function bridge(ctx:Ctx,mode:GameMode,trampoline:boolean):LevelDefinition{
  const level=blank(mode,ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  level.voids=[r(55,430,430,72)];
  level.walls=[mirrorRect(r(220,600,WALL,165),ctx.mirror),mirrorRect(r(310,245,WALL,145),ctx.mirror)];
  if(trampoline){
    level.trampolines=[{x:mirrorX(165,ctx.mirror),y:550,r:36,power:425+ctx.difficulty*18}];
  }else{
    const rx=ctx.mirror?318:110;
    level.ramps=[{x:rx,y:515,w:112,h:72,dx:0,dy:-1,lift:335+ctx.difficulty*22,boost:35+ctx.difficulty*10}];
  }
  return level;
}

function fanCurve(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=curveCourse(ctx,mode);
  const z=mirrorRect(r(310,470,145,82),ctx.mirror);
  level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.78:0.78,-0.42,235+ctx.difficulty*45)];
  return level;
}

function portalSlalom(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=gates(ctx,mode,3);
  level.portals=[portal(mirrorX(390,ctx.mirror),570,mirrorX(145,ctx.mirror),390,28)];
  return level;
}

function moverCurve(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=curveCourse(ctx,mode);
  level.movingBumpers=[movingBumper(ctx.mirror?350:190,505,30,"y",58+ctx.difficulty*18,1.05,ctx.rng.next()*Math.PI)];
  level.walls!.push(mirrorRect(r(95,275,245,WALL),ctx.mirror));
  return level;
}

function mastery(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=gates(ctx,mode,3);
  const z=mirrorRect(r(315,510,135,120),ctx.mirror);
  level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.68:0.68,-0.34,245+ctx.difficulty*35)];
  level.curves=[ctx.mirror?curve(380,370,88,350,85,20):curve(160,370,88,95,190,20)];
  return level;
}

function finalCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=mastery(ctx,mode);
  level.movingWalls=[movingWall(ctx.mirror?330:185,350,WALL,90,"y",48,1.08,ctx.rng.next()*Math.PI)];
  level.portals=[portal(mirrorX(395,ctx.mirror),715,mirrorX(135,ctx.mirror),235,26)];
  return level;
}

const BUILDERS:Builder[]=[
  dogleg,(c,m)=>gates(c,m,1),(c,m)=>gates(c,m,2),bumperCourse,
  (c,m)=>surfaceCourse(c,m,"sand"),(c,m)=>surfaceCourse(c,m,"ice"),fanCourse,curveCourse,portalCourse,
  movingGate,movingBumperCourse,(c,m)=>bridge(c,m,false),(c,m)=>bridge(c,m,true),fanCurve,portalSlalom,moverCurve,
  (c,m)=>gates(c,m,3),mastery,finalCourse
];

export function buildClassicCourse(index:number):LevelDefinition{
  if(index===1) return blank("classic",1,270,270);
  const rng=seeded(0x51f15e+index*7919);
  const ctx:Ctx={index,difficulty:(index-1)/19,mirror:rng.bool(),rng};
  return BUILDERS[index-2]!(ctx,"classic");
}
