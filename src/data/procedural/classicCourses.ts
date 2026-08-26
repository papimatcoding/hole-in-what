import type { CurveDef, FanDef, GameMode, LevelDefinition, MovingBumperDef, MovingWallDef, PortalPairDef, Vec2 } from "../../types";
import { WALL, blank, mirrorRect, mirrorX, r, seeded, setDesignPath, type Rng } from "./courseUtils";

interface Ctx { index:number; difficulty:number; mirror:boolean; rng:Rng; }
type Builder = (ctx:Ctx,mode:GameMode)=>LevelDefinition;

const fan=(x:number,y:number,w:number,h:number,dx:number,dy:number,strength=250):FanDef=>({x,y,w,h,dx,dy,strength});
const portal=(ax:number,ay:number,bx:number,by:number,rad=29):PortalPairDef=>({a:{x:ax,y:ay,r:rad},b:{x:bx,y:by,r:rad}});
const movingWall=(x:number,y:number,w:number,h:number,axis:"x"|"y",amplitude:number,speed=1.05,phase=0):MovingWallDef=>({x,y,w,h,axis,amplitude,speed,phase});
const movingBumper=(x:number,y:number,rad:number,axis:"x"|"y",amplitude:number,speed=1.15,phase=0):MovingBumperDef=>({x,y,r:rad,axis,amplitude,speed,phase});
const curve=(x:number,y:number,rad:number,startDeg:number,endDeg:number,thickness=22):CurveDef=>({x,y,r:rad,startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180,thickness});
const mx=(p:Vec2,mirror:boolean):Vec2=>({x:mirrorX(p.x,mirror),y:p.y});

function dogleg(ctx:Ctx,mode:GameMode):LevelDefinition{
  const left=!ctx.mirror;
  const mirror=!left;
  const level=blank(mode,ctx.index,left?105:435,left?420:120);
  level.walls=[mirrorRect(r(245,390,WALL,385),mirror)];
  if(ctx.difficulty>0.15) level.walls.push(mirrorRect(r(269,390,145,WALL),mirror));
  return setDesignPath(level,[mx({x:390,y:795},mirror),mx({x:405,y:330},mirror)]);
}

function gates(ctx:Ctx,mode:GameMode,count:number):LevelDefinition{
  const level=blank(mode,ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  const ys=count===1?[475]:count===2?[590,365]:[650,475,300];
  const pathPoints:Vec2[]=[];
  ys.forEach((y,i)=>{
    const gapLeft=(i+(ctx.mirror?1:0))%2===0;
    const gapW=Math.round(142-ctx.difficulty*38);
    if(gapLeft){
      const wallX=95+gapW;
      level.walls!.push(r(wallX,y,512-wallX,WALL));
      pathPoints.push({x:(28+wallX)/2,y:y+38});
    }else{
      level.walls!.push(r(28,y,350-28,WALL));
      pathPoints.push({x:(350+512)/2,y:y+38});
    }
  });
  return setDesignPath(level,pathPoints);
}

function bumperCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const mirror=ctx.mirror;
  const level=blank(mode,ctx.index,mirrorX(105,mirror),mirrorX(420,mirror));
  const bumper={x:mirrorX(414,mirror),y:610,r:34};
  level.walls=[
    mirrorRect(r(155,650,235,WALL),mirror),
    mirrorRect(r(245,385,WALL,265),mirror),
    mirrorRect(r(245,385,155,WALL),mirror)
  ];
  level.bumpers=[bumper];
  return setDesignPath(level,[
    mx({x:405,y:720},mirror),
    {x:bumper.x,y:bumper.y},
    mx({x:420,y:330},mirror)
  ]);
}

function surfaceCourse(ctx:Ctx,mode:GameMode,surface:"sand"|"ice"):LevelDefinition{
  const level=gates(ctx,mode,2);
  const route=level.designPath!;
  const target=route[1] ?? {x:270,y:610};
  const zone=r(target.x-58,target.y-112,116,98);
  if(surface==="sand") level.sand=[zone]; else level.ice=[zone];
  return level;
}

function fanCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=dogleg(ctx,mode);
  const route=level.designPath!;
  const p=route[1] ?? {x:390,y:795};
  const z=r(p.x-68,p.y-118,136,112);
  const towardHoleX=Math.sign(level.hole.x-p.x) || 1;
  level.fans=[fan(z.x,z.y,z.w,z.h,towardHoleX*0.82,-0.34,235+ctx.difficulty*55)];
  return level;
}

function curveCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=blank(mode,ctx.index,mirrorX(420,ctx.mirror),mirrorX(105,ctx.mirror));
  level.walls=[mirrorRect(r(270,565,WALL,230),ctx.mirror)];
  level.curves=ctx.mirror?[curve(300,365,130,80,175,22)]:[curve(240,365,130,5,100,22)];
  return setDesignPath(level,[mx({x:175,y:610},ctx.mirror),mx({x:160,y:410},ctx.mirror),mx({x:170,y:300},ctx.mirror)]);
}

function portalCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=blank(mode,ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  const a={x:mirrorX(155,ctx.mirror),y:610};
  const b={x:mirrorX(385,ctx.mirror),y:350};
  level.walls=[r(28,470,484,WALL)];
  level.portals=[portal(a.x,a.y,b.x,b.y,30)];
  return setDesignPath(level,[a,b]);
}

function movingGate(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=gates(ctx,mode,2);
  const route=level.designPath!;
  const p=route[2] ?? {x:270,y:500};
  level.movingWalls=[movingWall(p.x-12,p.y-80,WALL,120,"x",56+ctx.difficulty*18,0.88+ctx.difficulty*0.22,ctx.rng.next()*Math.PI)];
  return level;
}

function movingBumperCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=gates(ctx,mode,2);
  const route=level.designPath!;
  const p=route[2] ?? {x:270,y:480};
  level.movingBumpers=[movingBumper(270,p.y-20,30,"x",72+ctx.difficulty*18,0.98+ctx.difficulty*0.24,ctx.rng.next()*Math.PI)];
  return level;
}

function bridge(ctx:Ctx,mode:GameMode,trampoline:boolean):LevelDefinition{
  const level=blank(mode,ctx.index,mirrorX(105,ctx.mirror),mirrorX(420,ctx.mirror));
  const launchX=mirrorX(165,ctx.mirror);
  level.voids=[r(55,430,430,72)];
  level.walls=[mirrorRect(r(220,600,WALL,165),ctx.mirror),mirrorRect(r(310,245,WALL,145),ctx.mirror)];
  if(trampoline){
    level.trampolines=[{x:launchX,y:555,r:36,power:425+ctx.difficulty*18}];
  }else{
    level.ramps=[{x:launchX-55,y:530,w:110,h:72,dx:0,dy:-1,lift:335+ctx.difficulty*22,boost:35+ctx.difficulty*10}];
  }
  return setDesignPath(level,[{x:launchX,y:565},{x:launchX,y:390},mx({x:405,y:300},ctx.mirror)]);
}

function fanCurve(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=curveCourse(ctx,mode);
  const p=level.designPath![1] ?? {x:175,y:610};
  const z=r(p.x-62,p.y-82,124,108);
  level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.72:0.72,-0.42,235+ctx.difficulty*45)];
  return level;
}

function portalSlalom(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=gates(ctx,mode,3);
  const a={x:mirrorX(390,ctx.mirror),y:590};
  const b={x:mirrorX(145,ctx.mirror),y:335};
  level.portals=[portal(a.x,a.y,b.x,b.y,28)];
  const base=level.designPath!;
  level.designPath=[level.ball,base[1] ?? a,a,b,base[base.length-2] ?? b,level.hole];
  return level;
}

function moverCurve(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=curveCourse(ctx,mode);
  const p=level.designPath![1] ?? {x:190,y:505};
  level.movingBumpers=[movingBumper(p.x,p.y-40,30,"y",52+ctx.difficulty*18,1.05,ctx.rng.next()*Math.PI)];
  level.walls!.push(mirrorRect(r(95,275,245,WALL),ctx.mirror));
  return level;
}

function mastery(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=gates(ctx,mode,3);
  const route=level.designPath!;
  const p=route[2] ?? {x:350,y:560};
  const z=r(p.x-58,p.y-90,116,104);
  level.fans=[fan(z.x,z.y,z.w,z.h,ctx.mirror?-0.65:0.65,-0.34,245+ctx.difficulty*35)];
  const q=route[3] ?? {x:180,y:420};
  level.curves=[curve(q.x,q.y-70,82,ctx.mirror?350:95,ctx.mirror?85:190,20)];
  return level;
}

function finalCourse(ctx:Ctx,mode:GameMode):LevelDefinition{
  const level=mastery(ctx,mode);
  const route=level.designPath!;
  const p=route[route.length-2] ?? {x:270,y:300};
  level.movingWalls=[movingWall(p.x-12,p.y-55,WALL,90,"y",48,1.08,ctx.rng.next()*Math.PI)];
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
