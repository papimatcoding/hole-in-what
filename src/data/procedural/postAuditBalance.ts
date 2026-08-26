import type { LevelDefinition, TrollTrapArchetype, Vec2 } from "../../types";
import { goal } from "./courseUtils";

const clamp=(v:number,min:number,max:number):number=>Math.max(min,Math.min(max,v));
const rect=(x:number,y:number,w:number,h:number)=>({x,y,w,h});
const tri=(a:Vec2,b:Vec2,c:Vec2)=>({a,b,c});

function setPath(level:LevelDefinition,...points:Vec2[]):void{level.designPath=[level.ball,...points,level.hole];}
function directPoint(level:LevelDefinition,fraction:number):Vec2 {const q=clamp(fraction,0,1);return{x:level.ball.x+(level.hole.x-level.ball.x)*q,y:level.ball.y+(level.hole.y-level.ball.y)*q};}
function directFrame(level:LevelDefinition):{dir:Vec2;normal:Vec2}{const dx=level.hole.x-level.ball.x,dy=level.hole.y-level.ball.y,len=Math.hypot(dx,dy)||1,dir={x:dx/len,y:dy/len};return{dir,normal:{x:-dir.y,y:dir.x}};}
function sampleDesignRoute(level:LevelDefinition,fraction:number):Vec2{
  const pts=level.designPath?.length?[level.ball,...level.designPath,level.hole]:[level.ball,level.hole],lengths:number[]=[];let total=0;
  for(let i=0;i<pts.length-1;i+=1){const len=Math.hypot(pts[i+1]!.x-pts[i]!.x,pts[i+1]!.y-pts[i]!.y);lengths.push(len);total+=len;}
  let remaining=total*clamp(fraction,0,1);
  for(let i=0;i<lengths.length;i+=1){const len=lengths[i]!;if(remaining<=len){const q=len?remaining/len:0;return{x:pts[i]!.x+(pts[i+1]!.x-pts[i]!.x)*q,y:pts[i]!.y+(pts[i+1]!.y-pts[i]!.y)*q};}remaining-=len;}
  return{...pts[pts.length-1]!};
}

/**
 * Specific seeds that the structural audit proved were repeats get a genuinely different
 * silhouette here. This is not a cosmetic modifier swap: ball/hole positions, walls and the
 * intended route all change. The procedural generator remains the source for other holes.
 */
function diversifyProceduralGeometry(level:LevelDefinition,index:number):void{
  if(level.mode==="classic"&&index===19){
    level.ball={x:118,y:825};level.hole={x:420,y:155};
    level.walls=[rect(250,430,24,275),rect(250,430,150,24)];
    level.triangles=[];level.bumpers=[];level.sand=[];level.ice=[];
    level.boosters=[{x:372,y:555,w:92,h:72,dx:0,dy:-1,power:1.02}];
    level.primaryMechanic="booster";setPath(level,{x:415,y:675},{x:415,y:530},{x:420,y:300});
  }
  if(level.mode==="classic"&&index===37){
    level.ball={x:420,y:825};level.hole={x:105,y:155};
    level.walls=[rect(28,590,220,24),rect(292,395,220,24),rect(245,395,24,125)];
    level.ice=[rect(300,455,165,120)];level.bumpers=[];level.triangles=[];
    level.primaryMechanic="ice";setPath(level,{x:420,y:620},{x:385,y:500},{x:180,y:455},{x:105,y:260});
  }
  if(level.mode==="classic"&&index===40){
    level.ball={x:270,y:825};level.hole={x:420,y:155};
    level.walls=[rect(28,635,125,24),rect(387,635,125,24),rect(28,300,180,24)];
    level.voids=[rect(165,395,210,175)];level.ramps=[];
    level.trampolines=[{x:270,y:665,r:38,power:440}];
    level.primaryMechanic="trampoline";setPath(level,{x:270,y:665},{x:270,y:350},{x:420,y:240});
  }

  if(level.mode!=="troll")return;
  if(index===30){
    level.ball={x:115,y:825};level.hole={x:420,y:155};
    level.walls=[];level.triangles=[
      tri({x:145,y:640},{x:300,y:640},{x:145,y:485}),
      tri({x:395,y:360},{x:240,y:360},{x:395,y:515})
    ];
    level.bumpers=[{x:275,y:500,r:34}];level.movingWalls=[];level.movingBumpers=[];
    level.primaryMechanic="bumper";setPath(level,{x:220,y:620},{x:275,y:500},{x:345,y:340},{x:420,y:235});
  }
  if(index===32){
    level.ball={x:410,y:825};level.hole={x:120,y:155};
    level.walls=[rect(28,500,484,24),rect(270,285,242,24)];
    level.portals=[{a:{x:390,y:590,r:30},b:{x:175,y:390,r:30}}];
    level.primaryMechanic="portal";setPath(level,{x:390,y:590},{x:175,y:390},{x:150,y:260},{x:120,y:200});
  }
  if(index===33){
    level.ball={x:120,y:825};level.hole={x:420,y:155};
    level.walls=[rect(250,510,24,215),rect(250,510,155,24),rect(28,305,210,24)];
    level.fans=[{x:335,y:545,w:135,h:120,dx:-1,dy:0,strength:315}];
    level.movingWalls=[];level.movingBumpers=[];level.primaryMechanic="fan";
    setPath(level,{x:410,y:675},{x:400,y:490},{x:245,y:380},{x:420,y:230});
  }
  if(index===34){
    level.ball={x:270,y:825};level.hole={x:110,y:155};
    level.walls=[rect(28,610,165,24),rect(347,610,165,24),rect(230,310,282,24)];
    level.movingWalls=[{x:250,y:455,w:24,h:105,axis:"x",amplitude:78,speed:1.08,phase:.4}];
    level.movingBumpers=[];level.primaryMechanic="moving";
    setPath(level,{x:270,y:650},{x:270,y:505},{x:130,y:400},{x:110,y:230});
  }
  if(index===36){
    level.ball={x:420,y:825};level.hole={x:115,y:155};
    level.walls=[rect(28,635,175,24),rect(337,315,175,24)];
    level.voids=[rect(205,545,175,88),rect(145,345,175,88)];
    level.ramps=[];level.trampolines=[];level.primaryMechanic="void";
    setPath(level,{x:400,y:690},{x:155,y:505},{x:385,y:305},{x:115,y:220});
  }
  if(index===39){
    level.ball={x:110,y:825};level.hole={x:420,y:155};
    level.walls=[rect(170,410,24,300),rect(365,300,24,285)];
    level.movingWalls=[{x:245,y:525,w:105,h:24,axis:"y",amplitude:82,speed:1.12,phase:1.1}];
    level.movingBumpers=[];level.primaryMechanic="moving";
    setPath(level,{x:315,y:700},{x:315,y:520},{x:120,y:360},{x:420,y:230});
  }
  if(index===40){
    level.ball={x:120,y:825};level.hole={x:415,y:155};
    level.walls=[rect(28,650,220,24),rect(315,300,197,24)];
    level.voids=[rect(245,420,210,165)];level.ramps=[];
    level.trampolines=[{x:185,y:625,r:40,power:448}];level.primaryMechanic="trampoline";
    setPath(level,{x:185,y:625},{x:360,y:380},{x:415,y:225});
  }
}

function protectPortals(level:LevelDefinition):void{
  if(!(level.portals?.length))return;const endpoints=level.portals.flatMap(pair=>[pair.a,pair.b]);
  level.walls=(level.walls??[]).filter(w=>{if(w.w<=w.h*2)return true;return!endpoints.some(p=>Math.abs((w.y+w.h/2)-p.y)<62);});
}

function tuneClassicMeaning(level:LevelDefinition,index:number):void{
  if(index===7){const p=sampleDesignRoute(level,.56);level.bumpers=[{x:p.x,y:p.y,r:34}];level.primaryMechanic="bumper";}
  if(index===9||index===20){level.bumpers=[];level.primaryMechanic="wall";}
  if(index===25){const p=directPoint(level,.54),{normal}=directFrame(level);level.fans=[{x:p.x-88,y:p.y-58,w:176,h:116,dx:normal.x,dy:normal.y,strength:315}];level.primaryMechanic="fan";}
  if(index===39&&level.portals?.length){level.curves=[];level.primaryMechanic="portal";}
}

function trapTriggerFraction(archetype:TrollTrapArchetype):number{switch(archetype){case"floor-drop":case"safe-lane-collapse":return .30;case"gate-pop":case"cross-gate":case"late-combo":return .33;case"bumper-ambush":return .36;case"rebound-punish":return .46;}}
const EARLY_TROLL_BEAT=new Set([15,18,27,30,35,39]);

function calibrateHardTrap(level:LevelDefinition,index:number):void{
  const archetype:TrollTrapArchetype=level.trollArchetype??"gate-pop",early=EARLY_TROLL_BEAT.has(index),trigger=directPoint(level,early?.22:trapTriggerFraction(archetype)),anchor=directPoint(level,early?.46:.64),late=directPoint(level,early?.58:.77),{dir,normal}=directFrame(level),side=index%2===0?1:-1,triggerBase={triggerX:trigger.x,triggerY:trigger.y,triggerRadius:early?104:112};
  level.popWalls=[];level.popBumpers=[];level.popVoids=[];const vertical=Math.abs(dir.y)>=Math.abs(dir.x);
  if(archetype==="gate-pop"){level.popWalls=[vertical?{x:anchor.x-66,y:anchor.y-11,w:132,h:22,...triggerBase}:{x:anchor.x-11,y:anchor.y-66,w:22,h:132,...triggerBase}];return;}
  if(archetype==="bumper-ambush"){level.popBumpers=[{x:anchor.x+normal.x*24*side,y:anchor.y+normal.y*24*side,r:33,...triggerBase,triggerRadius:early?108:114}];return;}
  if(archetype==="floor-drop"){level.popVoids=[{x:anchor.x-54,y:anchor.y-28,w:108,h:56,...triggerBase,triggerRadius:116}];return;}
  if(archetype==="cross-gate"){level.popWalls=[vertical?{x:anchor.x-12+normal.x*34*side,y:anchor.y-60,w:24,h:120,...triggerBase}:{x:anchor.x-60,y:anchor.y-12+normal.y*34*side,w:120,h:24,...triggerBase}];return;}
  if(archetype==="safe-lane-collapse"){level.popVoids=[{x:anchor.x-54+normal.x*22*side,y:anchor.y-28+normal.y*22*side,w:108,h:56,...triggerBase,triggerRadius:118}];return;}
  if(archetype==="rebound-punish"){level.popBumpers=[{x:late.x+normal.x*30*side,y:late.y+normal.y*30*side,r:35,...triggerBase,triggerRadius:early?108:116}];return;}
  const first=directPoint(level,early?.44:.59);level.popWalls=[vertical?{x:first.x-55,y:first.y-10,w:110,h:20,...triggerBase,triggerRadius:early?108:114}:{x:first.x-10,y:first.y-55,w:20,h:110,...triggerBase,triggerRadius:early?108:114}];if(index>=15)level.popBumpers=[{x:late.x+normal.x*28*side,y:late.y+normal.y*28*side,r:31,triggerX:first.x,triggerY:first.y,triggerRadius:88}];
}

function classicGoals(level:LevelDefinition,index:number):void{let strokes=index<=3?1:index<=20?2:3;if(index===31||index===38||index===40)strokes=2;level.threeStar=goal(strokes);level.twoStar=goal(strokes+1);level.group=Math.ceil(index/10);}
function hardGoals(level:LevelDefinition,index:number):void{const strokes=index<=10?3:4;level.threeStar=goal(strokes);level.twoStar=goal(strokes+1);level.group=Math.ceil(index/10);}

export function applyPostAuditBalance(level:LevelDefinition,index:number):LevelDefinition{
  if(level.authored){level.group=Math.ceil(index/10);return level;}
  diversifyProceduralGeometry(level,index);protectPortals(level);
  if(level.mode==="classic"){tuneClassicMeaning(level,index);classicGoals(level,index);}else{calibrateHardTrap(level,index);hardGoals(level,index);}
  return level;
}
