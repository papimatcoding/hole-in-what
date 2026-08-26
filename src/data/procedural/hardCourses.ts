import type { CurveDef, FanDef, LevelDefinition, MovingBumperDef, MovingWallDef, PortalPairDef, Vec2 } from "../../types";
import { blank, goal, mirrorX, r, seeded, setDesignPath, WALL, type Rng } from "./courseUtils";
import { buildGateCourse, type GateSpec } from "./gateGrammar";

const fan=(x:number,y:number,w:number,h:number,dx:number,dy:number,strength=300):FanDef=>({x,y,w,h,dx,dy,strength});
const portal=(ax:number,ay:number,bx:number,by:number,rad=27):PortalPairDef=>({a:{x:ax,y:ay,r:rad},b:{x:bx,y:by,r:rad}});
const movingWall=(x:number,y:number,w:number,h:number,axis:"x"|"y",amplitude:number,speed=1.08,phase=0):MovingWallDef=>({x,y,w,h,axis,amplitude,speed,phase});
const movingBumper=(x:number,y:number,rad:number,axis:"x"|"y",amplitude:number,speed=1.14,phase=0):MovingBumperDef=>({x,y,r:rad,axis,amplitude,speed,phase});
const curve=(x:number,y:number,rad:number,startDeg:number,endDeg:number,thickness=21):CurveDef=>({x,y,r:rad,startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180,thickness});

function routePoint(level:LevelDefinition,fraction:number):Vec2 {
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

function addFanAtGate(level:LevelDefinition,gate:GateSpec,mirror:boolean,strength:number):void {
  level.fans=[...(level.fans ?? []),fan(gate.x-gate.width/2+4,gate.y-126,gate.width-8,92,mirror?0.82:-0.82,-0.22,strength)];
}

function addBumperAtGate(level:LevelDefinition,gate:GateSpec,mirror:boolean):void {
  level.bumpers=[...(level.bumpers ?? []),{x:gate.x+(mirror?-16:16),y:gate.y-52,r:33}];
}

function addMovingGate(level:LevelDefinition,gate:GateSpec,rng:Rng,bumper:boolean):void {
  const amplitude=Math.max(38,gate.width/2-28);
  if(bumper){
    level.movingBumpers=[...(level.movingBumpers ?? []),movingBumper(gate.x,gate.y-48,30,"x",amplitude,1.12,rng.next()*Math.PI)];
  }else{
    level.movingWalls=[...(level.movingWalls ?? []),movingWall(gate.x-12,gate.y-92,WALL,86,"x",amplitude,1.02,rng.next()*Math.PI)];
  }
}

function addCurveAtGate(level:LevelDefinition,gate:GateSpec,mirror:boolean):void {
  const cx=gate.x+(mirror?-54:54);
  level.curves=[...(level.curves ?? []),mirror?curve(cx,gate.y-130,70,350,100):curve(cx,gate.y-130,70,80,190)];
}

function addPortalShortcut(level:LevelDefinition,from:GateSpec,to:GateSpec):void {
  const a={x:from.x,y:from.y-66};
  const b={x:to.x,y:to.y+62};
  level.portals=[...(level.portals ?? []),portal(a.x,a.y,b.x,b.y,27)];
  const route=level.designPath ?? [level.ball,level.hole];
  level.designPath=[level.ball,a,b,...route.filter(p=>p.y<to.y),level.hole];
}

function addTrap(level:LevelDefinition,index:number):void {
  const kind=(index-1)%3;
  const anchor=routePoint(level,0.58);
  const trigger=routePoint(level,0.45);
  if(kind===0){
    level.popWalls=[{x:anchor.x-62,y:anchor.y-11,w:124,h:22,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:90}];
  }else if(kind===1){
    level.popBumpers=[{x:anchor.x,y:anchor.y,r:34,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:94}];
  }else{
    level.popVoids=[{x:anchor.x-48,y:anchor.y-24,w:96,h:48,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:96}];
  }
}

function hardJump(index:number,rng:Rng,mirror:boolean,difficulty:number):LevelDefinition {
  const launchX=mirrorX(index%2===0?165:385,mirror);
  const level=blank("troll",index,mirrorX(110,mirror),mirrorX(420,mirror));
  level.voids=[r(55,445,430,72)];
  level.walls=[r(28,665,135,WALL),r(255,665,257,WALL),r(28,305,230,WALL),r(360,305,152,WALL)];
  const trampoline=index%10===0;
  if(trampoline) level.trampolines=[{x:launchX,y:558,r:36,power:445}];
  else level.ramps=[{x:launchX-54,y:530,w:108,h:72,dx:0,dy:-1,lift:360,boost:42}];
  const upperX=mirrorX(index%2===0?390:150,mirror);
  setDesignPath(level,[{x:launchX,y:590},{x:launchX,y:405},{x:upperX,y:350}]);
  if(index>=10){
    level.movingBumpers=[movingBumper(upperX,365,30,"x",52,1.15,rng.next()*Math.PI)];
  }
  level.threeStar=goal(index<10?5:index<16?6:7,21+index*0.45);
  level.twoStar=goal(index<10?8:index<16?9:10);
  addTrap(level,index);
  return level;
}

export function buildHardCourse(index:number):LevelDefinition {
  const rng=seeded(0xa11ce+index*104729);
  const difficulty=0.62+(index-1)/19*0.38;
  const mirror=rng.bool();

  if(index%5===0) return hardJump(index,rng,mirror,difficulty);

  const gateCount=index<=5?3:index<=12?4:5;
  const {level,gates}=buildGateCourse("troll",index,rng,{
    gateCount,difficulty,
    minGap:index<=5?108:index<=12?98:90,
    maxGap:index<=5?122:index<=12?112:104
  });

  // One visible decision from the start; later HARD holes combine two, never five random objects.
  const first=gates[Math.min(1,gates.length-1)]!;
  const second=gates[Math.min(2,gates.length-1)]!;
  const family=(index-1)%4;
  if(family===0) addBumperAtGate(level,first,mirror);
  else if(family===1) addFanAtGate(level,first,mirror,295+difficulty*25);
  else if(family===2) addCurveAtGate(level,first,mirror);
  else addMovingGate(level,first,rng,index%2===0);

  if(index>=6){
    const secondary=(family+2)%4;
    if(secondary===0) addBumperAtGate(level,second,!mirror);
    else if(secondary===1) addFanAtGate(level,second,!mirror,305+difficulty*20);
    else if(secondary===2) addCurveAtGate(level,second,!mirror);
    else addMovingGate(level,second,rng,index%2!==0);
  }

  if(index>=13 && gates.length>=4 && index%3===0){
    addPortalShortcut(level,gates[0]!,gates[gates.length-2]!);
  }

  // The trap is always attached to the route the visible geometry teaches the player to take.
  addTrap(level,index);
  level.threeStar=goal(index<=5?4:index<=12?6:7,18+index*0.72);
  level.twoStar=goal(index<=5?7:index<=12?9:10);
  return level;
}
