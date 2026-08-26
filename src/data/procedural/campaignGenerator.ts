import type {
  CourseMechanic,
  CurveDef,
  FanDef,
  GameMode,
  LevelDefinition,
  MovingBumperDef,
  MovingWallDef,
  PortalPairDef,
  TriangleDef,
  TrollTrapArchetype,
  Vec2
} from "../../types";
import { blank, goal, mirrorX, r, seeded, setDesignPath, WALL, type Rng } from "./courseUtils";
import { buildGateCourse } from "./gateGrammar";

type LayoutKind =
  | "straight" | "bank" | "corner" | "island" | "dogleg" | "split" | "stagger"
  | "channel" | "offset" | "slalom" | "portal" | "moving" | "void" | "ramp" | "trampoline";
type MechanicKind = "bumper" | "sand" | "ice" | "booster" | "fan" | "curve" | "portal" | "moving" | "void" | null;
interface PlanEntry { layout: LayoutKind; mechanic: MechanicKind; }

// Each ten-hole chapter should feel like a curriculum rather than the same board with a modifier.
// In particular, the first ten deliberately use ten different silhouettes.
const CLASSIC_PLAN: PlanEntry[] = [
  {layout:"straight",mechanic:null},
  {layout:"bank",mechanic:null},
  {layout:"dogleg",mechanic:null},
  {layout:"island",mechanic:null},
  {layout:"split",mechanic:null},
  {layout:"corner",mechanic:null},
  {layout:"stagger",mechanic:"bumper"},
  {layout:"channel",mechanic:null},
  {layout:"offset",mechanic:"bumper"},
  {layout:"slalom",mechanic:null},

  {layout:"corner",mechanic:"sand"},
  {layout:"split",mechanic:null},
  {layout:"island",mechanic:"bumper"},
  {layout:"dogleg",mechanic:"sand"},
  {layout:"channel",mechanic:"ice"},
  {layout:"offset",mechanic:null},
  {layout:"slalom",mechanic:"ice"},
  {layout:"stagger",mechanic:"sand"},
  {layout:"bank",mechanic:"booster"},
  {layout:"island",mechanic:"bumper"},

  {layout:"slalom",mechanic:"booster"},
  {layout:"channel",mechanic:"ice"},
  {layout:"split",mechanic:"fan"},
  {layout:"offset",mechanic:"bumper"},
  {layout:"dogleg",mechanic:"fan"},
  {layout:"stagger",mechanic:"booster"},
  {layout:"corner",mechanic:"curve"},
  {layout:"slalom",mechanic:"fan"},
  {layout:"offset",mechanic:"curve"},
  {layout:"island",mechanic:"ice"},

  {layout:"portal",mechanic:"portal"},
  {layout:"stagger",mechanic:"fan"},
  {layout:"split",mechanic:"curve"},
  {layout:"moving",mechanic:"moving"},
  {layout:"slalom",mechanic:"bumper"},
  {layout:"void",mechanic:"void"},
  {layout:"moving",mechanic:"ice"},
  {layout:"ramp",mechanic:null},
  {layout:"portal",mechanic:"curve"},
  {layout:"trampoline",mechanic:null}
];

const HARD_LAYOUTS: LayoutKind[] = [
  "stagger","dogleg","channel","island","offset","split","corner","slalom","moving","bank",
  "portal","dogleg","channel","island","stagger","split","corner","moving","offset","slalom",
  "void","channel","portal","dogleg","island","offset","moving","split","corner","stagger",
  "slalom","portal","moving","dogleg","stagger","void","island","ramp","moving","trampoline"
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
function baseSlalom(mode:GameMode,index:number,rng:Rng,difficulty:number):LevelDefinition {
  const mirror=rng.bool(),level=blank(mode,index,mx(120,mirror),mx(405,mirror));
  const bite=mode==="classic"?205+Math.round(difficulty*34):235+Math.round(difficulty*34);
  const y1=650+rng.int(-12,12),y2=470+rng.int(-12,12),y3=300+rng.int(-10,10);
  const leftFirst=!mirror;
  const fromLeft=(y:number,w:number)=>r(28,y,w,WALL);
  const fromRight=(y:number,w:number)=>r(512-w,y,w,WALL);
  level.walls=[leftFirst?fromLeft(y1,bite):fromRight(y1,bite),leftFirst?fromRight(y2,bite-12):fromLeft(y2,bite-12),leftFirst?fromLeft(y3,bite-25):fromRight(y3,bite-25)];
  const pad=62;
  setDesignPath(level,[
    {x:leftFirst?512-bite-pad:28+bite+pad,y:y1+48},
    {x:leftFirst?28+bite+pad:512-bite-pad,y:y2+48},
    {x:leftFirst?512-(bite-25)-pad:28+(bite-25)+pad,y:y3+44}
  ]);
  return level;
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
  if(layout==="slalom")return baseSlalom(mode,index,rng,difficulty);if(layout==="portal")return basePortal(mode,index,rng,difficulty);if(layout==="moving")return baseMoving(mode,index,rng,difficulty);
  if(layout==="void")return baseVoid(mode,index,rng,difficulty);return baseJump(mode,index,rng,layout==="trampoline");
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

function addHardTrap(level:LevelDefinition,index:number,rng:Rng):void {
  const archetypes:TrollTrapArchetype[]=["gate-pop","bumper-ambush","floor-drop","cross-gate","safe-lane-collapse","rebound-punish","late-combo"];
  const archetype=archetypes[(index-1)%archetypes.length]!;
  level.trollArchetype=archetype;
  const anchor=sampleRoute(level,.61),trigger=sampleRoute(level,.45),dir=tangent(level,.61),normal={x:-dir.y,y:dir.x};
  const side=rng.bool()?1:-1;
  const triggerBase={triggerX:trigger.x,triggerY:trigger.y,triggerRadius:90};

  if(archetype==="gate-pop"){
    level.popWalls=[{x:anchor.x-56,y:anchor.y-11,w:112,h:22,...triggerBase}];
    return;
  }
  if(archetype==="bumper-ambush"){
    level.popBumpers=[{x:anchor.x+normal.x*34*side,y:anchor.y+normal.y*34*side,r:31,...triggerBase,triggerRadius:94}];
    return;
  }
  if(archetype==="floor-drop"){
    const p=sampleRoute(level,.68);
    level.popVoids=[{x:p.x-48,y:p.y-25,w:96,h:50,...triggerBase,triggerRadius:96}];
    return;
  }
  if(archetype==="cross-gate"){
    const vertical=Math.abs(dir.y)>=Math.abs(dir.x);
    level.popWalls=[vertical
      ? {x:anchor.x+normal.x*42*side-11,y:anchor.y-62,w:22,h:124,...triggerBase}
      : {x:anchor.x-62,y:anchor.y+normal.y*42*side-11,w:124,h:22,...triggerBase}];
    return;
  }
  if(archetype==="safe-lane-collapse"){
    const p=sampleRoute(level,.64);
    level.popVoids=[{x:p.x-52+normal.x*24*side,y:p.y-24+normal.y*24*side,w:104,h:48,...triggerBase,triggerRadius:100}];
    return;
  }
  if(archetype==="rebound-punish"){
    const p=sampleRoute(level,.73);
    level.popBumpers=[{x:p.x+normal.x*28*side,y:p.y+normal.y*28*side,r:34,...triggerBase,triggerRadius:98}];
    return;
  }

  // Late-combo is a familiar two-beat joke rather than a new rule. Before hole 15 it stays
  // deliberately light; later it combines two already-learned reactions with breathing room.
  const p1=sampleRoute(level,.58),p2=sampleRoute(level,.75);
  level.popWalls=[{x:p1.x-48,y:p1.y-10,w:96,h:20,...triggerBase,triggerRadius:92}];
  if(index>=15){
    level.popBumpers=[{x:p2.x+normal.x*30*side,y:p2.y+normal.y*30*side,r:30,triggerX:p1.x,triggerY:p1.y,triggerRadius:82}];
  }
}

function primaryFor(plan:PlanEntry):CourseMechanic {
  if(plan.mechanic)return plan.mechanic;
  if(plan.layout==="portal")return "portal";
  if(plan.layout==="moving")return "moving";
  if(plan.layout==="void")return "void";
  if(plan.layout==="ramp")return "ramp";
  if(plan.layout==="trampoline")return "trampoline";
  return "wall";
}

function setClassicGoals(level:LevelDefinition,index:number):void {
  const strokes=index<=3?1:index<=20?2:index<=30?3:4;
  level.threeStar=goal(strokes);level.twoStar=goal(strokes+1);level.group=Math.ceil(index/10);
}
function setHardGoals(level:LevelDefinition,index:number):void {
  const strokes=index<=10?3:index<=24?4:5;
  level.threeStar=goal(strokes);level.twoStar=goal(strokes+1);level.group=Math.ceil(index/10);
}

export function buildCampaignCourse(mode:GameMode,index:number):LevelDefinition {
  const clamped=Math.max(1,Math.min(40,index)),rng=seeded((mode==="classic"?0x51f15e:0xa11ce)+clamped*(mode==="classic"?7919:104729));
  const difficulty=mode==="classic"?(clamped-1)/39:.52+(clamped-1)/39*.48;
  const plan:PlanEntry=mode==="classic"?CLASSIC_PLAN[clamped-1]!:{layout:HARD_LAYOUTS[clamped-1]!,mechanic:HARD_MECHANICS[clamped-1]!};
  const level=buildBase(mode,clamped,rng,plan.layout,difficulty);
  level.primaryMechanic=primaryFor(plan);
  applyMechanic(level,plan.mechanic,rng,difficulty,clamped);

  if(mode==="troll"){
    // Extra visible mechanics arrive only after the player has learned the vocabulary.
    if(clamped>=18&&plan.layout!=="ramp"&&plan.layout!=="trampoline"){
      const extras:[MechanicKind,MechanicKind,MechanicKind,MechanicKind]=["bumper","fan","ice","moving"],extra=extras[(clamped+2)%4]!;
      if(extra==="moving"){const p=sampleRoute(level,.36);level.movingBumpers=[...(level.movingBumpers??[]),movingBumper(p.x,p.y,29,"x",38+Math.round(difficulty*14),1+difficulty*.15,rng.next()*Math.PI)];}
      else applyMechanic(level,extra,rng,difficulty*.9,clamped+1);
    }
    addHardTrap(level,clamped,rng);setHardGoals(level,clamped);
  }else setClassicGoals(level,clamped);
  return level;
}
