import type {
  CurveDef,
  FanDef,
  GameMode,
  LevelDefinition,
  MovingBumperDef,
  MovingWallDef,
  PortalPairDef,
  TriangleDef,
  Vec2
} from "../../types";
import { blank, goal, mirrorX, r, seeded, setDesignPath, WALL, type Rng } from "./courseUtils";
import { buildGateCourse } from "./gateGrammar";

type LayoutKind =
  | "straight"
  | "bank"
  | "corner"
  | "island"
  | "dogleg"
  | "split"
  | "stagger"
  | "channel"
  | "offset"
  | "portal"
  | "moving"
  | "void"
  | "ramp"
  | "trampoline";

type MechanicKind = "bumper" | "sand" | "ice" | "booster" | "fan" | "curve" | "portal" | "moving" | "void" | null;

interface PlanEntry { layout: LayoutKind; mechanic: MechanicKind; }

const CLASSIC_PLAN: PlanEntry[] = [
  {layout:"straight",mechanic:null},
  {layout:"bank",mechanic:null},
  {layout:"corner",mechanic:null},
  {layout:"island",mechanic:null},
  {layout:"dogleg",mechanic:null},
  {layout:"split",mechanic:null},
  {layout:"stagger",mechanic:"bumper"},
  {layout:"channel",mechanic:null},
  {layout:"bank",mechanic:"bumper"},
  {layout:"offset",mechanic:null},

  {layout:"dogleg",mechanic:"sand"},
  {layout:"corner",mechanic:null},
  {layout:"island",mechanic:"bumper"},
  {layout:"stagger",mechanic:"sand"},
  {layout:"channel",mechanic:"ice"},
  {layout:"split",mechanic:null},
  {layout:"bank",mechanic:"ice"},
  {layout:"offset",mechanic:"sand"},
  {layout:"dogleg",mechanic:"booster"},
  {layout:"corner",mechanic:"bumper"},

  {layout:"stagger",mechanic:"booster"},
  {layout:"island",mechanic:"ice"},
  {layout:"split",mechanic:"fan"},
  {layout:"channel",mechanic:"bumper"},
  {layout:"bank",mechanic:"fan"},
  {layout:"offset",mechanic:"booster"},
  {layout:"corner",mechanic:"curve"},
  {layout:"dogleg",mechanic:"fan"},
  {layout:"stagger",mechanic:"curve"},
  {layout:"island",mechanic:"ice"},

  {layout:"portal",mechanic:"portal"},
  {layout:"channel",mechanic:"fan"},
  {layout:"split",mechanic:"curve"},
  {layout:"moving",mechanic:"moving"},
  {layout:"offset",mechanic:"bumper"},
  {layout:"void",mechanic:"void"},
  {layout:"island",mechanic:"moving"},
  {layout:"ramp",mechanic:null},
  {layout:"portal",mechanic:"curve"},
  {layout:"trampoline",mechanic:null}
];

const HARD_LAYOUTS: LayoutKind[] = [
  "stagger","dogleg","channel","island","offset","split","corner","bank",
  "moving","stagger","portal","dogleg","channel","island","offset","split",
  "corner","moving","bank","stagger","void","channel","portal","dogleg",
  "island","offset","moving","split","corner","stagger","bank","portal",
  "channel","dogleg","moving","void","island","ramp","stagger","trampoline"
];

const HARD_MECHANICS: MechanicKind[] = [
  "bumper","fan","curve","bumper","sand","moving","ice","fan","moving","curve",
  "portal","bumper","fan","ice","booster","moving","curve","fan","bumper","moving",
  "void","fan","portal","curve","ice","booster","moving","fan","curve","bumper",
  "ice","portal","fan","moving","curve","void","bumper",null,"moving",null
];

const fan=(x:number,y:number,w:number,h:number,dx:number,dy:number,strength=270):FanDef=>({x,y,w,h,dx,dy,strength});
const portal=(ax:number,ay:number,bx:number,by:number,rad=28):PortalPairDef=>({a:{x:ax,y:ay,r:rad},b:{x:bx,y:by,r:rad}});
const movingWall=(x:number,y:number,w:number,h:number,axis:"x"|"y",amplitude:number,speed=1.0,phase=0):MovingWallDef=>({x,y,w,h,axis,amplitude,speed,phase});
const movingBumper=(x:number,y:number,rad:number,axis:"x"|"y",amplitude:number,speed=1.05,phase=0):MovingBumperDef=>({x,y,r:rad,axis,amplitude,speed,phase});
const curve=(x:number,y:number,rad:number,startDeg:number,endDeg:number,thickness=20):CurveDef=>({x,y,r:rad,startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180,thickness});
const tri=(a:Vec2,b:Vec2,c:Vec2):TriangleDef=>({a,b,c});
const mx=(x:number,mirror:boolean):number=>mirrorX(x,mirror);
const clamp=(v:number,min:number,max:number):number=>Math.max(min,Math.min(max,v));

function sampleRoute(level:LevelDefinition,fraction:number):Vec2 {
  const pts=level.designPath?.length ? level.designPath : [level.ball,level.hole];
  const lengths:number[]=[];
  let total=0;
  for(let i=0;i<pts.length-1;i+=1){
    const len=Math.hypot(pts[i+1]!.x-pts[i]!.x,pts[i+1]!.y-pts[i]!.y);
    lengths.push(len); total+=len;
  }
  let remaining=total*clamp(fraction,0,1);
  for(let i=0;i<lengths.length;i+=1){
    const len=lengths[i]!;
    if(remaining<=len){
      const q=len?remaining/len:0;
      return {x:pts[i]!.x+(pts[i+1]!.x-pts[i]!.x)*q,y:pts[i]!.y+(pts[i+1]!.y-pts[i]!.y)*q};
    }
    remaining-=len;
  }
  return {...pts[pts.length-1]!};
}

function tangent(level:LevelDefinition,fraction:number):Vec2 {
  const a=sampleRoute(level,Math.max(0,fraction-0.035));
  const b=sampleRoute(level,Math.min(1,fraction+0.035));
  const len=Math.hypot(b.x-a.x,b.y-a.y)||1;
  return {x:(b.x-a.x)/len,y:(b.y-a.y)/len};
}

function baseStraight(mode:GameMode,index:number):LevelDefinition {
  const level=blank(mode,index,270,270);
  setDesignPath(level,[]);
  return level;
}

function baseBank(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool();
  const level=blank(mode,index,mx(115,mirror),mx(420,mirror));
  const y=470+rng.int(-35,35);
  const gap=mode==="classic"?190-difficulty*42:145-difficulty*28;
  if(!mirror) level.walls=[r(28,y,484-gap,WALL)];
  else level.walls=[r(28+gap,y,484-gap,WALL)];
  const passX=mirror?28+gap/2:512-gap/2;
  setDesignPath(level,[{x:passX,y:y+55}]);
  return level;
}

function baseCorner(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool();
  const level=blank(mode,index,mx(105,mirror),mx(420,mirror));
  const vx=mx(255,mirror);
  if(!mirror){
    level.walls=[r(vx,385,WALL,325),r(vx,385,145,WALL)];
    level.triangles=[tri({x:255,y:385},{x:310,y:385},{x:255,y:440})];
    setDesignPath(level,[{x:420,y:725},{x:420,y:335}]);
  }else{
    level.walls=[r(vx-WALL,385,WALL,325),r(vx-145,385,145,WALL)];
    level.triangles=[tri({x:285,y:385},{x:230,y:385},{x:285,y:440})];
    setDesignPath(level,[{x:120,y:725},{x:120,y:335}]);
  }
  if(difficulty>0.72) level.walls.push(r(mirror?315:80,270,145,WALL));
  return level;
}

function baseIsland(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool();
  const level=blank(mode,index,mx(115,mirror),mx(425,mirror));
  const w=150+Math.round(difficulty*30);
  const h=120+Math.round(difficulty*25);
  const x=270-w/2+rng.int(-22,22);
  const y=485-h/2+rng.int(-25,25);
  level.walls=[r(x,y,w,WALL),r(x,y+h-WALL,w,WALL),r(x,y,WALL,h),r(x+w-WALL,y,WALL,h)];
  const goRight=!mirror;
  const px=goRight?x+w+56:x-56;
  setDesignPath(level,[{x:px,y:y+h+80},{x:px,y:y-75}]);
  return level;
}

function baseDogleg(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool();
  const level=blank(mode,index,mx(110,mirror),mx(425,mirror));
  const x=mx(255,mirror);
  if(!mirror){
    level.walls=[r(x,395,WALL,360),r(x,395,125+Math.round(difficulty*35),WALL)];
    setDesignPath(level,[{x:415,y:735},{x:415,y:345}]);
  }else{
    level.walls=[r(x-WALL,395,WALL,360),r(x-125-Math.round(difficulty*35),395,125+Math.round(difficulty*35),WALL)];
    setDesignPath(level,[{x:125,y:735},{x:125,y:345}]);
  }
  return level;
}

function baseSplit(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool();
  const level=blank(mode,index,mx(130,mirror),mx(390,mirror));
  const x=270+rng.int(-16,16);
  const top=300+rng.int(-20,20);
  const h=330+Math.round(difficulty*80);
  level.walls=[r(x-WALL/2,top,WALL,h)];
  const preferRight=!mirror;
  const px=preferRight?x+90:x-90;
  setDesignPath(level,[{x:px,y:top+h+65},{x:px,y:top-55}]);
  if(difficulty>0.55){
    const capY=top+Math.round(h*0.55);
    level.walls.push(preferRight?r(28,capY,x-92-28,WALL):r(x+92,capY,512-(x+92),WALL));
  }
  return level;
}

function baseStagger(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const count=difficulty<0.58?2:3;
  const minGap=mode==="classic"?Math.round(170-difficulty*48):Math.round(130-difficulty*35);
  const maxGap=minGap+18;
  return buildGateCourse(mode,index,rng,{gateCount:count,difficulty,minGap,maxGap}).level;
}

function baseChannel(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool();
  const level=blank(mode,index,mx(110,mirror),mx(420,mirror));
  const center=mx(365,mirror);
  const width=145-Math.round(difficulty*28);
  const left=center-width/2;
  const right=center+width/2;
  level.walls=[r(left-WALL,430,WALL,300),r(right,430,WALL,300)];
  setDesignPath(level,[{x:center,y:760},{x:center,y:385},{x:mx(400,mirror),y:290}]);
  if(difficulty>0.6) level.walls.push(r(mirror?300:85,300,155,WALL));
  return level;
}

function baseOffset(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool();
  const level=blank(mode,index,mx(105,mirror),mx(425,mirror));
  const y1=610+rng.int(-18,18);
  const y2=345+rng.int(-18,18);
  const lowerGap=mode==="classic"?180-difficulty*38:135-difficulty*24;
  const upperGap=lowerGap-10;
  if(!mirror){
    level.walls=[r(28,y1,484-lowerGap,WALL),r(28+upperGap,y2,484-upperGap,WALL)];
    setDesignPath(level,[{x:512-lowerGap/2,y:y1+48},{x:28+upperGap/2,y:y2+48}]);
  }else{
    level.walls=[r(28+lowerGap,y1,484-lowerGap,WALL),r(28,y2,484-upperGap,WALL)];
    setDesignPath(level,[{x:28+lowerGap/2,y:y1+48},{x:512-upperGap/2,y:y2+48}]);
  }
  return level;
}

function basePortal(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool();
  const level=blank(mode,index,mx(110,mirror),mx(420,mirror));
  const wallY=475;
  level.walls=[r(28,wallY,484,WALL)];
  const a={x:mx(150,mirror),y:610};
  const b={x:mx(390,mirror),y:355};
  level.portals=[portal(a.x,a.y,b.x,b.y,30)];
  setDesignPath(level,[a,b,{x:b.x,y:285}]);
  if(difficulty>0.7) level.walls.push(r(mx(250,mirror),265,WALL,105));
  return level;
}

function baseMoving(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const level=baseStagger(mode,index,rng,Math.max(0.45,difficulty));
  const p=sampleRoute(level,0.53);
  level.movingWalls=[movingWall(p.x-12,p.y-55,WALL,90,"x",40+Math.round(difficulty*18),0.9+difficulty*0.2,rng.next()*Math.PI)];
  return level;
}

function baseVoid(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool();
  const level=blank(mode,index,mx(115,mirror),mx(420,mirror));
  const hazardX=mirror?55:185;
  level.voids=[r(hazardX,445,300,78)];
  const safeX=mirror?430:110;
  level.walls=[r(mirror?300:28,610,185,WALL),r(mirror?28:327,300,185,WALL)];
  setDesignPath(level,[{x:safeX,y:565},{x:safeX,y:390},{x:mx(400,mirror),y:285}]);
  return level;
}

function baseJump(mode:GameMode,index:number,rng:Rng,trampoline:boolean):LevelDefinition {
  const mirror=rng.bool();
  const launchX=mx(165,mirror);
  const level=blank(mode,index,mx(110,mirror),mx(420,mirror));
  level.voids=[r(55,430,430,78)];
  level.walls=[r(28,640,mirror?300:105,WALL),r(mirror?405:245,640,mirror?107:267,WALL),r(mx(285,mirror),250,WALL,130)];
  if(trampoline) level.trampolines=[{x:launchX,y:555,r:37,power:430}];
  else level.ramps=[{x:launchX-55,y:520,w:110,h:78,dx:0,dy:-1,lift:345,boost:38}];
  setDesignPath(level,[{x:launchX,y:595},{x:launchX,y:390},{x:mx(400,mirror),y:295}]);
  return level;
}

function buildBase(mode:GameMode,index:number,rng:Rng,layout:LayoutKind,difficulty:number):LevelDefinition {
  if(layout==="straight") return baseStraight(mode,index);
  if(layout==="bank") return baseBank(mode,index,rng,difficulty);
  if(layout==="corner") return baseCorner(mode,index,rng,difficulty);
  if(layout==="island") return baseIsland(mode,index,rng,difficulty);
  if(layout==="dogleg") return baseDogleg(mode,index,rng,difficulty);
  if(layout==="split") return baseSplit(mode,index,rng,difficulty);
  if(layout==="stagger") return baseStagger(mode,index,rng,difficulty);
  if(layout==="channel") return baseChannel(mode,index,rng,difficulty);
  if(layout==="offset") return baseOffset(mode,index,rng,difficulty);
  if(layout==="portal") return basePortal(mode,index,rng,difficulty);
  if(layout==="moving") return baseMoving(mode,index,rng,difficulty);
  if(layout==="void") return baseVoid(mode,index,rng,difficulty);
  if(layout==="ramp") return baseJump(mode,index,rng,false);
  return baseJump(mode,index,rng,true);
}

function applyMechanic(level:LevelDefinition,mechanic:MechanicKind,rng:Rng,difficulty:number):void {
  if(!mechanic || mechanic==="portal" || mechanic==="moving" || mechanic==="void") return;
  const p=sampleRoute(level,0.52);
  const dir=tangent(level,0.52);
  const normal={x:-dir.y,y:dir.x};

  if(mechanic==="bumper"){
    level.bumpers=[...(level.bumpers??[]),{x:p.x+normal.x*13,y:p.y+normal.y*13,r:27+Math.round(difficulty*4)}];
    return;
  }
  if(mechanic==="sand" || mechanic==="ice"){
    const zone={x:p.x-62,y:p.y-46,w:124,h:92};
    if(mechanic==="sand") level.sand=[...(level.sand??[]),zone]; else level.ice=[...(level.ice??[]),zone];
    return;
  }
  if(mechanic==="booster"){
    level.boosters=[...(level.boosters??[]),{x:p.x-50,y:p.y-34,w:100,h:68,dx:dir.x,dy:dir.y,power:0.94+difficulty*0.08}];
    return;
  }
  if(mechanic==="fan"){
    const push=normal.x===0&&normal.y===0?{x:1,y:0}:normal;
    level.fans=[...(level.fans??[]),fan(p.x-62,p.y-52,124,104,push.x,push.y,245+difficulty*55)];
    return;
  }
  if(mechanic==="curve"){
    const side=rng.bool()?1:-1;
    const cx=p.x+normal.x*60*side;
    const cy=p.y+normal.y*60*side;
    level.curves=[...(level.curves??[]),curve(cx,cy,72,side>0?70:250,side>0?185:365,20)];
  }
}

function addHardTrap(level:LevelDefinition,index:number):void {
  const kind=(index-1)%3;
  const anchor=sampleRoute(level,0.60);
  const trigger=sampleRoute(level,0.46);
  if(kind===0) level.popWalls=[{x:anchor.x-58,y:anchor.y-11,w:116,h:22,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:88}];
  else if(kind===1) level.popBumpers=[{x:anchor.x,y:anchor.y,r:32,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:92}];
  else level.popVoids=[{x:anchor.x-44,y:anchor.y-23,w:88,h:46,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:94}];
}

function setClassicGoals(level:LevelDefinition,index:number):void {
  const strokes=index<=4?1:index<=10?2:index<=18?3:index<=28?4:index<=36?5:6;
  const timed=index>=12 && (index%3===0 || index>=35);
  const seconds=timed?Math.round(15+index*0.48):undefined;
  level.threeStar=goal(strokes,seconds);
  level.twoStar=goal(strokes+2);
  level.group=Math.ceil(index/10);
}

function setHardGoals(level:LevelDefinition,index:number):void {
  const strokes=index<=6?4:index<=15?5:index<=25?6:index<=34?7:8;
  const timed=index%2===0 || index>=30;
  level.threeStar=goal(strokes,timed?Math.round(18+index*0.62):undefined);
  level.twoStar=goal(strokes+3);
  level.group=Math.ceil(index/10);
}

export function buildCampaignCourse(mode:GameMode,index:number):LevelDefinition {
  const clamped=Math.max(1,Math.min(40,index));
  const rng=seeded((mode==="classic"?0x51f15e:0xa11ce)+clamped*(mode==="classic"?7919:104729));
  const difficulty=mode==="classic"?(clamped-1)/39:0.48+(clamped-1)/39*0.52;
  const plan=mode==="classic"?CLASSIC_PLAN[clamped-1]!:{layout:HARD_LAYOUTS[clamped-1]!,mechanic:HARD_MECHANICS[clamped-1]!};
  const level=buildBase(mode,clamped,rng,plan.layout,difficulty);
  applyMechanic(level,plan.mechanic,rng,difficulty);

  if(mode==="troll"){
    // Later HARD holes may combine one additional, already-known visible mechanic.
    if(clamped>=14 && plan.layout!=="ramp" && plan.layout!=="trampoline"){
      const secondary:[MechanicKind,MechanicKind,MechanicKind,MechanicKind]=["bumper","fan","ice","moving"];
      const extra=secondary[(clamped+2)%secondary.length]!;
      if(extra==="moving"){
        const p=sampleRoute(level,0.32);
        level.movingBumpers=[...(level.movingBumpers??[]),movingBumper(p.x,p.y,29,"x",38+Math.round(difficulty*14),1.0+difficulty*0.15,rng.next()*Math.PI)];
      }else applyMechanic(level,extra,rng,difficulty*0.9);
    }
    addHardTrap(level,clamped);
    setHardGoals(level,clamped);
  }else setClassicGoals(level,clamped);

  return level;
}
