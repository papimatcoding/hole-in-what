import type { CurveDef, FanDef, LevelDefinition, MovingBumperDef, MovingWallDef, PortalPairDef, Vec2 } from "../../types";
import { blank, goal, mirrorX, r, seeded, setDesignPath, WALL, type Rng } from "./courseUtils";
import { buildGateCourse, gateApproach, gateExit, type GateSpec } from "./gateGrammar";

const fan=(x:number,y:number,w:number,h:number,dx:number,dy:number,strength=270):FanDef=>({x,y,w,h,dx,dy,strength});
const portal=(ax:number,ay:number,bx:number,by:number,rad=29):PortalPairDef=>({a:{x:ax,y:ay,r:rad},b:{x:bx,y:by,r:rad}});
const movingWall=(x:number,y:number,w:number,h:number,axis:"x"|"y",amplitude:number,speed=1.05,phase=0):MovingWallDef=>({x,y,w,h,axis,amplitude,speed,phase});
const movingBumper=(x:number,y:number,rad:number,axis:"x"|"y",amplitude:number,speed=1.12,phase=0):MovingBumperDef=>({x,y,r:rad,axis,amplitude,speed,phase});
const curve=(x:number,y:number,rad:number,startDeg:number,endDeg:number,thickness=22):CurveDef=>({x,y,r:rad,startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180,thickness});
const mcenters=(values:number[],mirror:boolean):number[]=>values.map(x=>mirrorX(x,mirror));

function straight(index:number):LevelDefinition {
  return blank("classic",index,270,270);
}

function fundamentals(index:number,rng:Rng):LevelDefinition {
  const difficulty=(index-1)/19;
  const mirror=rng.bool();
  const count=index===2?1:index===3?2:2;
  const centers=index===2?[mirrorX(165,mirror)]:index===3?mcenters([155,390],mirror):mcenters([390,145],mirror);
  const {level}=buildGateCourse("classic",index,rng,{gateCount:count,difficulty,forceCenters:centers,minGap:150,maxGap:180});
  if(index===4){
    const p=level.designPath?.[1] ?? {x:270,y:600};
    level.walls!.push(r(p.x+(mirror?-95:70),470,WALL,125));
  }
  return level;
}

function bumperDecision(index:number,rng:Rng):LevelDefinition {
  const mirror=rng.bool();
  const centers=mcenters([150,395],mirror);
  const {level,gates}=buildGateCourse("classic",index,rng,{
    gateCount:2,difficulty:0.24,forceCenters:centers,minGap:146,maxGap:154,
    ballX:mirrorX(420,mirror),holeX:mirrorX(110,mirror)
  });
  const lower=gates[0]!;
  const bumperX=lower.x + (mirror?18:-18);
  const bumperY=lower.y-54;
  level.bumpers=[{x:bumperX,y:bumperY,r:34}];
  // Safe line can squeeze around it; the aggressive line uses the kick to attack the second gate.
  level.designPath=[level.ball,gateApproach(lower,70),{x:bumperX,y:bumperY},gateExit(lower,75),gateApproach(gates[1]!,70),level.hole];
  level.threeStar=goal(2,16);
  level.twoStar=goal(4);
  return level;
}

function surfaceDecision(index:number,rng:Rng,kind:"sand"|"ice"):LevelDefinition {
  const mirror=rng.bool();
  const {level,gates}=buildGateCourse("classic",index,rng,{
    gateCount:2,difficulty:0.30+(index-6)*0.03,forceCenters:mcenters([155,390],mirror),minGap:138,maxGap:150
  });
  const gate=gates[0]!;
  const zone={x:gate.x-gate.width/2+8,y:gate.y-122,w:gate.width-16,h:92};
  if(kind==="sand") level.sand=[zone]; else level.ice=[zone];
  return level;
}

function boosterDecision(index:number,rng:Rng):LevelDefinition {
  const mirror=rng.bool();
  const {level,gates}=buildGateCourse("classic",index,rng,{gateCount:2,difficulty:0.38,forceCenters:mcenters([390,145],mirror),minGap:134,maxGap:146});
  const gate=gates[0]!;
  const dir=level.designPath?.[2] ?? level.hole;
  const dx=dir.x-gate.x;
  level.boosters=[{x:gate.x-gate.width/2+12,y:gate.y-112,w:gate.width-24,h:72,dx,dy:-1,power:0.95}];
  return level;
}

function fanDecision(index:number,rng:Rng):LevelDefinition {
  const mirror=rng.bool();
  const {level,gates}=buildGateCourse("classic",index,rng,{gateCount:2,difficulty:0.44,forceCenters:mcenters([155,390],mirror),minGap:128,maxGap:140});
  const gate=gates[0]!;
  level.fans=[fan(gate.x-gate.width/2+4,gate.y-132,gate.width-8,98,mirror?0.82:-0.82,-0.20,265)];
  return level;
}

function curveDecision(index:number,rng:Rng):LevelDefinition {
  const mirror=rng.bool();
  const {level,gates}=buildGateCourse("classic",index,rng,{gateCount:2,difficulty:0.48,forceCenters:mcenters([390,150],mirror),minGap:126,maxGap:138});
  const lower=gates[0]!;
  const cx=lower.x+(mirror?-58:58);
  level.curves=[mirror?curve(cx,lower.y-105,76,5,105,22):curve(cx,lower.y-105,76,75,175,22)];
  return level;
}

function portalDecision(index:number,rng:Rng):LevelDefinition {
  const mirror=rng.bool();
  const level=blank("classic",index,mirrorX(110,mirror),mirrorX(420,mirror));
  const a={x:mirrorX(155,mirror),y:610};
  const b={x:mirrorX(390,mirror),y:365};
  level.walls=[r(28,470,484,WALL),r(mirrorX(255,mirror),265,WALL,115)];
  level.portals=[portal(a.x,a.y,b.x,b.y,30)];
  setDesignPath(level,[a,b,{x:b.x,y:285}]);
  level.threeStar=goal(3,18);
  level.twoStar=goal(5);
  return level;
}

function movingDecision(index:number,rng:Rng,bumper:boolean):LevelDefinition {
  const mirror=rng.bool();
  const {level,gates}=buildGateCourse("classic",index,rng,{gateCount:3,difficulty:0.56+(index-12)*0.04,forceCenters:mcenters([150,390,155],mirror),minGap:118,maxGap:132});
  const gate=gates[1]!;
  if(bumper){
    level.movingBumpers=[movingBumper(gate.x,gate.y-46,30,"x",Math.max(42,gate.width/2-30),1.02,rng.next()*Math.PI)];
  }else{
    level.movingWalls=[movingWall(gate.x-12,gate.y-92,WALL,86,"x",Math.max(40,gate.width/2-26),0.96,rng.next()*Math.PI)];
  }
  return level;
}

function jumpDecision(index:number,rng:Rng,trampoline:boolean):LevelDefinition {
  const mirror=rng.bool();
  const launchX=mirrorX(165,mirror);
  const level=blank("classic",index,mirrorX(110,mirror),mirrorX(420,mirror));
  level.voids=[r(55,430,430,76)];
  level.walls=[r(28,650,mirror?300:110,WALL),r(mirror?405:245,650,mirror?107:267,WALL),r(mirrorX(285,mirror),255,WALL,135)];
  if(trampoline) level.trampolines=[{x:launchX,y:560,r:37,power:435}];
  else level.ramps=[{x:launchX-55,y:525,w:110,h:76,dx:0,dy:-1,lift:350,boost:40}];
  setDesignPath(level,[{x:launchX,y:600},{x:launchX,y:390},{x:mirrorX(400,mirror),y:300}]);
  level.threeStar=goal(4,21);
  level.twoStar=goal(6);
  return level;
}

function advanced(index:number,rng:Rng):LevelDefinition {
  const mirror=rng.bool();
  const difficulty=(index-1)/19;
  const patterns=[[145,395,150],[390,150,395],[150,390,150,390]];
  const centers=mcenters(patterns[(index-16)%patterns.length]!,mirror);
  const {level,gates}=buildGateCourse("classic",index,rng,{gateCount:centers.length,difficulty,forceCenters:centers,minGap:104,maxGap:122});
  const mid=gates[Math.floor(gates.length/2)]!;

  if(index===16){
    level.fans=[fan(mid.x-mid.width/2+5,mid.y-125,mid.width-10,92,mirror?0.75:-0.75,-0.22,285)];
    level.curves=[mirror?curve(mid.x-55,mid.y-160,70,350,95,20):curve(mid.x+55,mid.y-160,70,85,190,20)];
  }else if(index===17){
    const a={x:gates[0]!.x,y:gates[0]!.y-70};
    const b={x:gates[2]!.x,y:gates[2]!.y+65};
    level.portals=[portal(a.x,a.y,b.x,b.y,27)];
    level.movingWalls=[movingWall(gates[1]!.x-12,gates[1]!.y-88,WALL,82,"x",48,1.04,rng.next()*Math.PI)];
  }else if(index===18){
    const g=gates[1]!;
    level.ice=[{x:g.x-g.width/2+8,y:g.y-120,w:g.width-16,h:90}];
    level.movingBumpers=[movingBumper(g.x,g.y-45,29,"x",45,1.12,rng.next()*Math.PI)];
  }else if(index===19){
    const g=gates[0]!;
    level.fans=[fan(g.x-g.width/2+6,g.y-120,g.width-12,88,mirror?0.72:-0.72,-0.25,295)];
    level.bumpers=[{x:g.x+(mirror?-18:18),y:g.y-54,r:32}];
  }else{
    const g=gates[1]!;
    level.fans=[fan(g.x-g.width/2+4,g.y-120,g.width-8,88,mirror?0.70:-0.70,-0.25,300)];
    level.movingBumpers=[movingBumper(g.x,g.y-45,30,"x",44,1.15,rng.next()*Math.PI)];
    const q=gates[gates.length-1]!;
    level.curves=[mirror?curve(q.x-50,q.y-145,68,350,95,20):curve(q.x+50,q.y-145,68,85,190,20)];
  }
  level.threeStar=goal(index<19?4:5,18+index*0.32);
  level.twoStar=goal(index<19?6:7);
  return level;
}

export function buildClassicCourse(index:number):LevelDefinition {
  const rng=seeded(0x51f15e+index*7919);
  if(index===1) return straight(index);
  if(index<=4) return fundamentals(index,rng);
  if(index===5) return bumperDecision(index,rng);
  if(index===6) return surfaceDecision(index,rng,"sand");
  if(index===7) return surfaceDecision(index,rng,"ice");
  if(index===8) return boosterDecision(index,rng);
  if(index===9) return fanDecision(index,rng);
  if(index===10) return curveDecision(index,rng);
  if(index===11) return portalDecision(index,rng);
  if(index===12) return movingDecision(index,rng,false);
  if(index===13) return movingDecision(index,rng,true);
  if(index===14) return jumpDecision(index,rng,false);
  if(index===15) return jumpDecision(index,rng,true);
  return advanced(index,rng);
}
