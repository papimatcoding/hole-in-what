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
  | "straight" | "bank" | "corner" | "island" | "dogleg" | "split" | "stagger"
  | "channel" | "offset" | "portal" | "moving" | "void" | "ramp" | "trampoline";
type MechanicKind = "bumper" | "sand" | "ice" | "booster" | "fan" | "curve" | "portal" | "moving" | "void" | null;
interface PlanEntry { layout: LayoutKind; mechanic: MechanicKind; }

// Difficulty is a curriculum, not a mechanic checklist. New mechanics are separated by practice holes,
// and layout families do not repeat back-to-back.
const CLASSIC_PLAN: PlanEntry[] = [
  {layout:"straight",mechanic:null},
  {layout:"bank",mechanic:null},
  {layout:"dogleg",mechanic:null},
  {layout:"corner",mechanic:null},
  {layout:"split",mechanic:null},
  {layout:"island",mechanic:null},
  {layout:"bank",mechanic:"bumper"},
  {layout:"channel",mechanic:null},
  {layout:"dogleg",mechanic:"bumper"},
  {layout:"stagger",mechanic:null},

  {layout:"corner",mechanic:"sand"},
  {layout:"split",mechanic:null},
  {layout:"island",mechanic:"bumper"},
  {layout:"dogleg",mechanic:"sand"},
  {layout:"channel",mechanic:"ice"},
  {layout:"offset",mechanic:null},
  {layout:"bank",mechanic:"ice"},
  {layout:"stagger",mechanic:"sand"},
  {layout:"offset",mechanic:"booster"},
  {layout:"island",mechanic:"bumper"},

  {layout:"stagger",mechanic:"booster"},
  {layout:"channel",mechanic:"ice"},
  {layout:"split",mechanic:"fan"},
  {layout:"offset",mechanic:"bumper"},
  {layout:"dogleg",mechanic:"fan"},
  {layout:"stagger",mechanic:"booster"},
  {layout:"corner",mechanic:"curve"},
  {layout:"channel",mechanic:"fan"},
  {layout:"offset",mechanic:"curve"},
  {layout:"island",mechanic:"ice"},

  {layout:"portal",mechanic:"portal"},
  {layout:"stagger",mechanic:"fan"},
  {layout:"split",mechanic:"curve"},
  {layout:"moving",mechanic:"moving"},
  {layout:"offset",mechanic:"bumper"},
  {layout:"void",mechanic:"void"},
  {layout:"moving",mechanic:"ice"},
  {layout:"ramp",mechanic:null},
  {layout:"portal",mechanic:"curve"},
  {layout:"trampoline",mechanic:null}
];

const HARD_LAYOUTS: LayoutKind[] = [
  "stagger","dogleg","channel","island","offset","split","corner","stagger","moving","offset",
  "portal","dogleg","channel","island","stagger","split","corner","moving","offset","stagger",
  "void","channel","portal","dogleg","island","offset","moving","split","corner","stagger",
  "channel","portal","moving","dogleg","stagger","void","island","ramp","moving","trampoline"
];
const HARD_MECHANICS: MechanicKind[] = [
  "bumper","fan","curve","bumper","sand","moving","ice","fan","moving","curve",
  "portal","bumper","fan","ice","booster","moving","curve","fan","bumper","moving",
  "void","fan","portal","curve","ice","booster","moving","fan","curve","bumper",
  "ice","portal","fan","moving","curve","void","bumper",null,"moving",null
];

const fan=(x:number,y:number,w:number,h:number,dx:number,dy:number,strength=270):FanDef=>({x,y,w,h,dx,dy,strength});
const portal=(ax:number,ay:number,bx:number,by:number,rad=28):PortalPairDef=>({a:{x:ax,y:ay,r:rad},b:{x:bx,y:by,r:rad}});
const movingWall=(x:number,y:number,w:number,h:number,axis:"x"|"y",amplitude:number,speed=1,phase=0):MovingWallDef=>({x,y,w,h,axis,amplitude,speed,phase});
const movingBumper=(x:number,y:number,rad:number,axis:"x"|"y",amplitude:number,speed=1.05,phase=0):MovingBumperDef=>({x,y,r:rad,axis,amplitude,speed,phase});
const curve=(x:number,y:number,rad:number,startDeg:number,endDeg:number,thickness=20):CurveDef=>({x,y,r:rad,startAngle:startDeg*Math.PI/180,endAngle:endDeg*Math.PI/180,thickness});
const tri=(a:Vec2,b:Vec2,c:Vec2):TriangleDef=>({a,b,c});
const mx=(x:number,mirror:boolean):number=>mirrorX(x,mirror);
const clamp=(v:number,min:number,max:number):number=>Math.max(min,Math.min(max,v));

function sampleRoute(level:LevelDefinition,fraction:number):Vec2 {
  const pts=level.designPath?.length ? level.designPath : [level.ball,level.hole];
  const lengths:number[]=[]; let total=0;
  for(let i=0;i<pts.length-1;i+=1){const len=Math.hypot(pts[i+1]!.x-pts[i]!.x,pts[i+1]!.y-pts[i]!.y);lengths.push(len);total+=len;}
  let remaining=total*clamp(fraction,0,1);
  for(let i=0;i<lengths.length;i+=1){const len=lengths[i]!;if(remaining<=len){const q=len?remaining/len:0;return{x:pts[i]!.x+(pts[i+1]!.x-pts[i]!.x)*q,y:pts[i]!.y+(pts[i+1]!.y-pts[i]!.y)*q};}remaining-=len;}
  return {...pts[pts.length-1]!};
}
function tangent(level:LevelDefinition,fraction:number):Vec2 {
  const a=sampleRoute(level,Math.max(0,fraction-0.035)),b=sampleRoute(level,Math.min(1,fraction+0.035));
  const len=Math.hypot(b.x-a.x,b.y-a.y)||1;return{x:(b.x-a.x)/len,y:(b.y-a.y)/len};
}

function baseStraight(mode:GameMode,index:number):LevelDefinition {const level=blank(mode,index,270,270);setDesignPath(level,[]);return level;}
function baseBank(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(115,mirror),mx(420,mirror)),y=475+rng.int(-28,28);
  const gap=mode==="classic"?205-difficulty*52:150-difficulty*30;
  if(!mirror)level.walls=[r(28,y,484-gap,WALL)];else level.walls=[r(28+gap,y,484-gap,WALL)];
  setDesignPath(level,[{x:mirror?28+gap/2:512-gap/2,y:y+54}]);return level;
}
function baseCorner(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(105,mirror),mx(420,mirror));
  const vertical=mode==="classic"&&index<=12?275:320;
  if(!mirror){level.walls=[r(255,410,WALL,vertical),r(255,410,125+Math.round(difficulty*22),WALL)];level.triangles=[tri({x:255,y:410},{x:312,y:410},{x:255,y:467})];setDesignPath(level,[{x:418,y:720},{x:418,y:352}]);}
  else{level.walls=[r(261,410,WALL,vertical),r(155-Math.round(difficulty*22),410,130+Math.round(difficulty*22),WALL)];level.triangles=[tri({x:285,y:410},{x:228,y:410},{x:285,y:467})];setDesignPath(level,[{x:122,y:720},{x:122,y:352}]);}
  return level;
}
function baseIsland(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(115,mirror),mx(425,mirror));
  const w=145+Math.round(difficulty*28),h=112+Math.round(difficulty*24),x=270-w/2+rng.int(-18,18),y=490-h/2+rng.int(-22,22);
  level.walls=[r(x,y,w,WALL),r(x,y+h-WALL,w,WALL),r(x,y,WALL,h),r(x+w-WALL,y,WALL,h)];
  const px=!mirror?x+w+62:x-62;setDesignPath(level,[{x:px,y:y+h+78},{x:px,y:y-72}]);return level;
}
function baseDogleg(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(110,mirror),mx(425,mirror));
  const early=mode==="classic"&&index<=5,vertical=early?245:330+Math.round(difficulty*30),cap=early?90:118+Math.round(difficulty*30);
  if(!mirror){level.walls=[r(255,430,WALL,vertical),r(255,430,cap,WALL)];setDesignPath(level,[{x:405,y:725},{x:405,y:375}]);}
  else{level.walls=[r(261,430,WALL,vertical),r(285-cap,430,cap,WALL)];setDesignPath(level,[{x:135,y:725},{x:135,y:375}]);}
  return level;
}
function baseSplit(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(130,mirror),mx(390,mirror)),x=270+rng.int(-14,14),top=320+rng.int(-18,18),h=300+Math.round(difficulty*85);
  level.walls=[r(x-WALL/2,top,WALL,h)];const px=!mirror?x+96:x-96;setDesignPath(level,[{x:px,y:top+h+62},{x:px,y:top-52}]);
  if(difficulty>0.62)level.walls.push(!mirror?r(28,top+Math.round(h*.55),x-105-28,WALL):r(x+105,top+Math.round(h*.55),512-(x+105),WALL));return level;
}
function baseStagger(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const count=difficulty<.55?2:3,minGap=mode==="classic"?Math.round(184-difficulty*50):Math.round(142-difficulty*36),maxGap=minGap+18;
  return buildGateCourse(mode,index,rng,{gateCount:count,difficulty,minGap,maxGap}).level;
}
function baseChannel(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(110,mirror),mx(420,mirror)),center=mx(365,mirror),width=mode==="classic"?155-Math.round(difficulty*28):132-Math.round(difficulty*24);
  const left=center-width/2,right=center+width/2;level.walls=[r(left-WALL,445,WALL,280),r(right,445,WALL,280)];setDesignPath(level,[{x:center,y:750},{x:center,y:400},{x:mx(402,mirror),y:295}]);
  if(difficulty>.72)level.walls.push(r(mirror?300:85,300,145,WALL));return level;
}
function baseOffset(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(105,mirror),mx(425,mirror)),y1=620+rng.int(-15,15),y2=350+rng.int(-15,15);
  const gap=mode==="classic"?195-difficulty*45:145-difficulty*28,upper=gap-10;
  if(!mirror){level.walls=[r(28,y1,484-gap,WALL),r(28+upper,y2,484-upper,WALL)];setDesignPath(level,[{x:512-gap/2,y:y1+45},{x:28+upper/2,y:y2+45}]);}
  else{level.walls=[r(28+gap,y1,484-gap,WALL),r(28,y2,484-upper,WALL)];setDesignPath(level,[{x:28+gap/2,y:y1+45},{x:512-upper/2,y:y2+45}]);}return level;
}
function basePortal(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(110,mirror),mx(420,mirror)),a={x:mx(150,mirror),y:610},b={x:mx(390,mirror),y:355};
  level.walls=[r(28,475,484,WALL)];level.portals=[portal(a.x,a.y,b.x,b.y,30)];setDesignPath(level,[a,b,{x:b.x,y:285}]);if(difficulty>.76)level.walls.push(r(mx(250,mirror),265,WALL,105));return level;
}
function baseMoving(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const level=baseStagger(mode,index,rng,Math.max(.52,difficulty)),p=sampleRoute(level,.53);level.movingWalls=[movingWall(p.x-12,p.y-55,WALL,90,"x",40+Math.round(difficulty*16),.9+difficulty*.18,rng.next()*Math.PI)];return level;
}
function baseVoid(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(115,mirror),mx(420,mirror)),hazardX=mirror?55:185,safeX=mirror?430:110;
  level.voids=[r(hazardX,445,300,78)];level.walls=[r(mirror?300:28,610,185,WALL),r(mirror?28:327,300,185,WALL)];setDesignPath(level,[{x:safeX,y:565},{x:safeX,y:390},{x:mx(400,mirror),y:285}]);return level;
}
function baseJump(mode:GameMode,index:number,rng:Rng,trampoline:boolean):LevelDefinition {
  const mirror=rng.bool(),launchX=mx(165,mirror),level=blank(mode,index,mx(110,mirror),mx(420,mirror));
  level.voids=[r(55,430,430,78)];level.walls=[r(28,640,mirror?300:105,WALL),r(mirror?405:245,640,mirror?107:267,WALL),r(mx(285,mirror),250,WALL,130)];
  if(trampoline)level.trampolines=[{x:launchX,y:555,r:37,power:430}];else level.ramps=[{x:launchX-55,y:520,w:110,h:78,dx:0,dy:-1,lift:345,boost:38}];
  setDesignPath(level,[{x:launchX,y:595},{x:launchX,y:390},{x:mx(400,mirror),y:295}]);return level;
}
function buildBase(mode:GameMode,index:number,rng:Rng,layout:LayoutKind,difficulty:number):LevelDefinition {
  if(layout==="straight")return baseStraight(mode,index);if(layout==="bank")return baseBank(mode,index,rng,difficulty);if(layout==="corner")return baseCorner(mode,index,rng,difficulty);
  if(layout==="island")return baseIsland(mode,index,rng,difficulty);if(layout==="dogleg")return baseDogleg(mode,index,rng,difficulty);if(layout==="split")return baseSplit(mode,index,rng,difficulty);
  if(layout==="stagger")return baseStagger(mode,index,rng,difficulty);if(layout==="channel")return baseChannel(mode,index,rng,difficulty);if(layout==="offset")return baseOffset(mode,index,rng,difficulty);
  if(layout==="portal")return basePortal(mode,index,rng,difficulty);if(layout==="moving")return baseMoving(mode,index,rng,difficulty);if(layout==="void")return baseVoid(mode,index,rng,difficulty);
  return baseJump(mode,index,rng,layout==="trampoline");
}

function addRouteGate(level:LevelDefinition,fraction:number,gapWidth:number,offset:number):void {
  const p=sampleRoute(level,fraction),y=clamp(p.y,245,735),half=gapWidth/2,center=clamp(p.x+offset,28+half+18,512-half-18),left=center-half,right=center+half;
  // Existing horizontal structures already act as a checkpoint; don't stack another line on top.
  if((level.walls??[]).some(w=>w.w>w.h*2&&Math.abs((w.y+w.h/2)-y)<42))return;
  if(left>42)level.walls=[...(level.walls??[]),r(28,y,left-28,WALL)];if(right<498)level.walls=[...(level.walls??[]),r(right,y,512-right,WALL)];
}
function augmentProgression(level:LevelDefinition,mode:GameMode,index:number,layout:LayoutKind,rng:Rng):void {
  if(layout==="stagger"||layout==="moving"||layout==="ramp"||layout==="trampoline")return;
  if(mode==="classic"){
    if(index>=21&&index<=30)addRouteGate(level,.66,172-Math.round((index-21)*1.8),rng.bool()?28:-28);
    if(index>=31){addRouteGate(level,.35,154-Math.round((index-31)*1.6),rng.bool()?34:-34);if(index>=35)addRouteGate(level,.70,146-Math.round((index-35)*2),rng.bool()?42:-42);}
  }else{
    addRouteGate(level,.32,index<=10?142:index<=25?128:114,rng.bool()?34:-34);
    if(index>=11)addRouteGate(level,.68,index<=25?124:108,rng.bool()?42:-42);
    if(index>=29)addRouteGate(level,.50,102,rng.bool()?48:-48);
  }
}

function applyMechanic(level:LevelDefinition,mechanic:MechanicKind,rng:Rng,difficulty:number,index:number):void {
  if(!mechanic||mechanic==="portal"||mechanic==="moving"||mechanic==="void")return;
  const fraction=.43+(index%3)*.075,p=sampleRoute(level,fraction),dir=tangent(level,fraction),normal={x:-dir.y,y:dir.x};
  if(mechanic==="bumper"){level.bumpers=[...(level.bumpers??[]),{x:p.x+normal.x*14,y:p.y+normal.y*14,r:27+Math.round(difficulty*4)}];return;}
  if(mechanic==="sand"||mechanic==="ice"){const zone={x:p.x-62,y:p.y-46,w:124,h:92};if(mechanic==="sand")level.sand=[...(level.sand??[]),zone];else level.ice=[...(level.ice??[]),zone];return;}
  if(mechanic==="booster"){level.boosters=[...(level.boosters??[]),{x:p.x-50,y:p.y-34,w:100,h:68,dx:dir.x,dy:dir.y,power:.94+difficulty*.08}];return;}
  if(mechanic==="fan"){level.fans=[...(level.fans??[]),fan(p.x-62,p.y-52,124,104,normal.x,normal.y,245+difficulty*55)];return;}
  if(mechanic==="curve"){const side=rng.bool()?1:-1;level.curves=[...(level.curves??[]),curve(p.x+normal.x*60*side,p.y+normal.y*60*side,72,side>0?70:250,side>0?185:365,20)];}
}
function addHardTrap(level:LevelDefinition,index:number):void {
  const kind=(index-1)%3,anchor=sampleRoute(level,.60),trigger=sampleRoute(level,.46);
  if(kind===0)level.popWalls=[{x:anchor.x-58,y:anchor.y-11,w:116,h:22,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:88}];
  else if(kind===1)level.popBumpers=[{x:anchor.x,y:anchor.y,r:32,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:92}];
  else level.popVoids=[{x:anchor.x-44,y:anchor.y-23,w:88,h:46,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:94}];
}
function setClassicGoals(level:LevelDefinition,index:number):void {
  const strokes=index<=3?1:index<=20?2:index<=30?3:4;
  const timed=index>=18&&(index%4===0||index>=36),seconds=timed?Math.round(13+strokes*5+index*.28):undefined;
  level.threeStar=goal(strokes,seconds);level.twoStar=goal(strokes+2);level.group=Math.ceil(index/10);
}
function setHardGoals(level:LevelDefinition,index:number):void {
  const strokes=index<=10?3:index<=20?4:index<=30?5:6;
  const timed=index>=10&&(index%3===0||index>=34),seconds=timed?Math.round(14+strokes*5+index*.30):undefined;
  level.threeStar=goal(strokes,seconds);level.twoStar=goal(strokes+3);level.group=Math.ceil(index/10);
}

export function buildCampaignCourse(mode:GameMode,index:number):LevelDefinition {
  const clamped=Math.max(1,Math.min(40,index)),rng=seeded((mode==="classic"?0x51f15e:0xa11ce)+clamped*(mode==="classic"?7919:104729));
  const difficulty=mode==="classic"?(clamped-1)/39:.52+(clamped-1)/39*.48;
  const plan:PlanEntry=mode==="classic"?CLASSIC_PLAN[clamped-1]!:{layout:HARD_LAYOUTS[clamped-1]!,mechanic:HARD_MECHANICS[clamped-1]!};
  const level=buildBase(mode,clamped,rng,plan.layout,difficulty);
  augmentProgression(level,mode,clamped,plan.layout,rng);
  applyMechanic(level,plan.mechanic,rng,difficulty,clamped);
  if(mode==="troll"){
    if(clamped>=15&&plan.layout!=="ramp"&&plan.layout!=="trampoline"){
      const extras:[MechanicKind,MechanicKind,MechanicKind,MechanicKind]=["bumper","fan","ice","moving"],extra=extras[(clamped+2)%4]!;
      if(extra==="moving"){const p=sampleRoute(level,.38);level.movingBumpers=[...(level.movingBumpers??[]),movingBumper(p.x,p.y,29,"x",38+Math.round(difficulty*14),1+difficulty*.15,rng.next()*Math.PI)];}
      else applyMechanic(level,extra,rng,difficulty*.9,clamped+1);
    }
    addHardTrap(level,clamped);setHardGoals(level,clamped);
  }else setClassicGoals(level,clamped);
  return level;
}
