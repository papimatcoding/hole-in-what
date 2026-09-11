import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { levelsForMode } from "../src/data/campaign";
import { GOLF_PHYSICS } from "../src/systems/GolfSimulation";
import type { CurveDef, LevelDefinition, RectDef, TriangleDef, Vec2 } from "../src/types";

type AuditStatus="PASS"|"REVIEW"|"BLOCKER";
type DesignDisposition="KEEP"|"CLEANUP"|"REDESIGN";
type Priority="P0"|"P1"|"P2";

interface HumanProfile{name:string;successRate:number;voidRate:number;medianEndDistance:number;}
interface HumanRecovery{sampleCount:number;recoverableRate:number;movingTimeoutRate:number;}
interface HumanRow{
  id:string;mode:string;target:number;learnedStrokes:number|null;humanStrokes:number|null;naiveStrokes:number|null;explorerStrokes:number|null;
  routeFamilies:number;profiles:HumanProfile[];minShotTolerance:number|null;humanScore:number|null;mechanicRelevant:boolean|null;
  recovery:HumanRecovery;minRestEdgeDistance:number|null;flags:string[];status:AuditStatus;
}
interface HumanReport{generatedAt:string;version?:string;mode:string;rows:HumanRow[];}
interface FeedbackLevel{levelId:string;sampleSize:number;avgFun?:number|null;avgOriginality?:number|null;avgDifficulty?:number|null;bugRate?:number|null;}
interface FeedbackSnapshot{levels:FeedbackLevel[];}
interface NamedRect{label:string;r:RectDef;structural:boolean;visual:boolean;kind:string;}
interface NamedCircle{label:string;x:number;y:number;r:number;kind:string;}
interface GapIssue{kind:"SEALED"|"TIGHT";between:string;clearance:number;orientation:string;}
interface RouteMetrics{length:number;direct:number;detour:number;segments:number;turns:number;hardTurns:number;axisRatio:number;diagonalRatio:number;sideChanges:number;}
interface GeometryMetrics{
  rectCount:number;triangleCount:number;curveCount:number;circleCount:number;shapeCount:number;rectDominance:number;nonRectRatio:number;
  horizontalWallRatio:number;verticalWallRatio:number;structuralCoverage:number;openSpace:number;spreadX:number;spreadY:number;
  scaleClass:"OPEN"|"STANDARD"|"COMPACT"|"DENSE";silhouette:string;deadGaps:GapIssue[];offRouteObjects:string[];
}
interface SimilarityHit{id:string;score:number;shape:number;raster:number;mechanic:number;silhouetteSame:boolean;distance:number;}
interface ScoreCard{clarity:number;flow:number;variety:number;composition:number;mechanic:number;goals:number;overall:number;}
interface Advice{priority:Priority;code:string;text:string;evidence:string;}
interface Audit3Row{
  id:string;mode:string;index:number;group:number;primaryMechanic:string|null;disposition:DesignDisposition;status:AuditStatus;
  geometry:GeometryMetrics;route:RouteMetrics;scores:ScoreCard;nearest:SimilarityHit|null;nearestRecent:SimilarityHit|null;
  human:{strokes:number|null;best:number|null;target:number|null;touch:number|null;casual:number|null;tolerance:number|null;recovery:number|null;families:number|null;status:AuditStatus|null;flags:string[]};
  feedback:FeedbackLevel|null;flags:string[];advice:Advice[];
}
interface CampaignRun{from:string;to:string;length:number;value:string;}
interface CampaignSummary{
  mode:string;levels:number;averageOverall:number;averageVariety:number;rectDominantLevels:number;nonRectLevels:number;
  dispositions:Record<DesignDisposition,number>;silhouettes:Record<string,number>;scales:Record<string,number>;
  repeatedSilhouetteRuns:CampaignRun[];repeatedScaleRuns:CampaignRun[];topRedesign:string[];recommendations:string[];
}

const FIELD=GOLF_PHYSICS.field;
const BALL=GOLF_PHYSICS.ballRadius;
const PASSABLE=BALL*2+8; // 34px: physical diameter + visual comfort margin.
const TAU=Math.PI*2;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const round=(v:number,d=1)=>Number(v.toFixed(d));
const dist=(a:Vec2,b:Vec2)=>Math.hypot(a.x-b.x,a.y-b.y);
const pct=(v:number|null)=>v===null?"n/a":`${Math.round(v*100)}%`;
const levelIndex=(level:LevelDefinition)=>Number(level.id.split("-").at(-1)??0);

const humanPath=process.env.AUDIT3_HUMAN_FILE??"artifacts/audit2-report.json";
const feedbackPath=process.env.AUDIT3_FEEDBACK_FILE??"artifacts/audit2-feedback.json";
const humanReport:HumanReport|null=existsSync(humanPath)?JSON.parse(readFileSync(humanPath,"utf8")) as HumanReport:null;
const feedback:FeedbackSnapshot|null=existsSync(feedbackPath)?JSON.parse(readFileSync(feedbackPath,"utf8")) as FeedbackSnapshot:null;
const humanById=new Map((humanReport?.rows??[]).map(x=>[x.id,x]));
const feedbackById=new Map((feedback?.levels??[]).map(x=>[x.levelId,x]));
const levels=[...levelsForMode("classic"),...levelsForMode("troll")];

function rects(level:LevelDefinition):NamedRect[]{
  const out:NamedRect[]=[];
  const add=(kind:string,arr:RectDef[]|undefined,structural:boolean,visual=true)=>arr?.forEach((r,i)=>out.push({label:`${kind}[${i}]`,r,structural,visual,kind}));
  add("wall",level.walls,true);add("movingWall",level.movingWalls,true);add("popWall",level.popWalls,true);
  add("void",level.voids,true);add("popVoid",level.popVoids,true);
  add("sand",level.sand,false);add("ice",level.ice,false);add("booster",level.boosters,false);add("fan",level.fans,false);
  add("wind",level.winds,false);add("ramp",level.ramps,false);
  return out;
}
function circles(level:LevelDefinition):NamedCircle[]{
  const out:NamedCircle[]=[];
  level.bumpers?.forEach((b,i)=>out.push({label:`bumper[${i}]`,x:b.x,y:b.y,r:b.r,kind:"bumper"}));
  level.movingBumpers?.forEach((b,i)=>out.push({label:`movingBumper[${i}]`,x:b.x,y:b.y,r:b.r,kind:"movingBumper"}));
  level.popBumpers?.forEach((b,i)=>out.push({label:`popBumper[${i}]`,x:b.x,y:b.y,r:b.r,kind:"popBumper"}));
  level.trampolines?.forEach((b,i)=>out.push({label:`trampoline[${i}]`,x:b.x,y:b.y,r:b.r,kind:"trampoline"}));
  level.portals?.forEach((p,i)=>{out.push({label:`portal[${i}].a`,x:p.a.x,y:p.a.y,r:p.a.r??28,kind:"portal"},{label:`portal[${i}].b`,x:p.b.x,y:p.b.y,r:p.b.r??28,kind:"portal"});});
  return out;
}
function structuralRects(level:LevelDefinition):NamedRect[]{return rects(level).filter(x=>x.structural);}
function rangeOverlap(a1:number,a2:number,b1:number,b2:number):number{return Math.max(0,Math.min(a2,b2)-Math.max(a1,b1));}
function rectDistanceToPoint(r:RectDef,p:Vec2):number{const x=clamp(p.x,r.x,r.x+r.w),y=clamp(p.y,r.y,r.y+r.h);return Math.hypot(p.x-x,p.y-y);}
function segmentPointDistance(p:Vec2,a:Vec2,b:Vec2):number{const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1,q=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l2,0,1);return Math.hypot(p.x-(a.x+dx*q),p.y-(a.y+dy*q));}
function segmentRectApproxDistance(a:Vec2,b:Vec2,r:RectDef):number{
  const samples=10;let best=Infinity;for(let i=0;i<=samples;i++){const q=i/samples,p={x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q};best=Math.min(best,rectDistanceToPoint(r,p));}return best;
}
function normalizeAngle(a:number):number{return((a%TAU)+TAU)%TAU;}
function angleInArc(angle:number,c:CurveDef):boolean{const a=normalizeAngle(angle),s=normalizeAngle(c.startAngle),e=normalizeAngle(c.endAngle);return s<=e?a>=s&&a<=e:a>=s||a<=e;}
function pointInTriangle(p:Vec2,t:TriangleDef):boolean{const sign=(p1:Vec2,p2:Vec2,p3:Vec2)=>(p1.x-p3.x)*(p2.y-p3.y)-(p2.x-p3.x)*(p1.y-p3.y),d1=sign(p,t.a,t.b),d2=sign(p,t.b,t.c),d3=sign(p,t.c,t.a),neg=d1<0||d2<0||d3<0,pos=d1>0||d2>0||d3>0;return!(neg&&pos);}
function structuralAt(level:LevelDefinition,p:Vec2):boolean{
  if(structuralRects(level).some(x=>p.x>=x.r.x&&p.x<=x.r.x+x.r.w&&p.y>=x.r.y&&p.y<=x.r.y+x.r.h))return true;
  if((level.triangles??[]).some(t=>pointInTriangle(p,t)))return true;
  if((level.curves??[]).some(c=>{const d=Math.hypot(p.x-c.x,p.y-c.y),half=(c.thickness??22)/2;return Math.abs(d-c.r)<=half&&angleInArc(Math.atan2(p.y-c.y,p.x-c.x),c);} ))return true;
  if(circles(level).filter(c=>c.kind!=="portal"&&c.kind!=="trampoline").some(c=>Math.hypot(p.x-c.x,p.y-c.y)<=c.r))return true;
  return false;
}
function occupancy(level:LevelDefinition,cols=24,rows=40):{coverage:number;raster:Set<number>}{const set=new Set<number>();for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p={x:FIELD.x+(x+.5)*FIELD.w/cols,y:FIELD.y+(y+.5)*FIELD.h/rows};if(structuralAt(level,p))set.add(y*cols+x);}return{coverage:set.size/(cols*rows),raster:set};}
function jaccard(a:Set<number>,b:Set<number>):number{if(!a.size&&!b.size)return 1;if(!a.size||!b.size)return 0;let inter=0;for(const x of a)if(b.has(x))inter++;return inter/(a.size+b.size-inter);}

function deadGaps(level:LevelDefinition):GapIssue[]{
  const rs=structuralRects(level),cs=circles(level).filter(c=>c.kind.includes("Bumper")||c.kind==="bumper");const issues:GapIssue[]=[];
  const add=(between:string,gap:number,orientation:string)=>{if(gap<=0||gap>=PASSABLE)return;issues.push({kind:gap<BALL*2?"SEALED":"TIGHT",between,clearance:round(gap),orientation});};
  for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){
    const a=rs[i]!,b=rs[j]!,xOverlap=rangeOverlap(a.r.x,a.r.x+a.r.w,b.r.x,b.r.x+b.r.w),yOverlap=rangeOverlap(a.r.y,a.r.y+a.r.h,b.r.y,b.r.y+b.r.h);
    if(xOverlap>=BALL*1.5){const top=a.r.y+a.r.h<=b.r.y?a:b,bottom=top===a?b:a;add(`${a.label} ↔ ${b.label}`,bottom.r.y-(top.r.y+top.r.h),"horizontal slit");}
    if(yOverlap>=BALL*1.5){const left=a.r.x+a.r.w<=b.r.x?a:b,right=left===a?b:a;add(`${a.label} ↔ ${b.label}`,right.r.x-(left.r.x+left.r.w),"vertical slit");}
  }
  for(const a of rs){if(a.r.h>=BALL*2){add(`${a.label} ↔ left boundary`,a.r.x-FIELD.x,"edge slit");add(`${a.label} ↔ right boundary`,FIELD.x+FIELD.w-(a.r.x+a.r.w),"edge slit");}if(a.r.w>=BALL*2){add(`${a.label} ↔ top boundary`,a.r.y-FIELD.y,"edge slit");add(`${a.label} ↔ bottom boundary`,FIELD.y+FIELD.h-(a.r.y+a.r.h),"edge slit");}}
  for(const c of cs)for(const a of rs){const d=rectDistanceToPoint(a.r,{x:c.x,y:c.y})-c.r;add(`${c.label} ↔ ${a.label}`,d,"circle gap");}
  return issues.sort((a,b)=>a.clearance-b.clearance);
}
function routePoints(level:LevelDefinition):Vec2[]{const src=level.designPath?.length?level.designPath:[level.ball,level.hole],out:Vec2[]=[];for(const p of src)if(!out.length||dist(out.at(-1)!,p)>2)out.push(p);if(!out.length||dist(out[0]!,level.ball)>2)out.unshift(level.ball);if(dist(out.at(-1)!,level.hole)>2)out.push(level.hole);return out;}
function routeMetrics(level:LevelDefinition):RouteMetrics{
  const pts=routePoints(level),vectors=pts.slice(1).map((p,i)=>({x:p.x-pts[i]!.x,y:p.y-pts[i]!.y}));let length=0,axis=0,diag=0;for(const v of vectors){const l=Math.hypot(v.x,v.y);length+=l;const a=Math.abs(Math.atan2(v.y,v.x))*180/Math.PI%90,dAxis=Math.min(a,90-a);if(dAxis<=12)axis++;if(dAxis>=24)diag++;}
  let turns=0,hardTurns=0;for(let i=1;i<vectors.length;i++){const a=vectors[i-1]!,b=vectors[i]!,dot=a.x*b.x+a.y*b.y,den=Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y)||1,turn=Math.acos(clamp(dot/den,-1,1))*180/Math.PI;if(turn>=25)turns++;if(turn>=65)hardTurns++;}
  let sideChanges=0,lastSide=0;for(const p of pts){const side=p.x<FIELD.x+FIELD.w*.42?-1:p.x>FIELD.x+FIELD.w*.58?1:0;if(side&&lastSide&&side!==lastSide)sideChanges++;if(side)lastSide=side;}
  const direct=dist(level.ball,level.hole);return{length:round(length),direct:round(direct),detour:round(length/Math.max(1,direct),2),segments:vectors.length,turns,hardTurns,axisRatio:vectors.length?round(axis/vectors.length,2):0,diagonalRatio:vectors.length?round(diag/vectors.length,2):0,sideChanges};
}
function objectSpread(level:LevelDefinition):{x:number;y:number}{
  const boxes:RectDef[]=[...structuralRects(level).map(x=>x.r)];
  for(const t of level.triangles??[]){const xs=[t.a.x,t.b.x,t.c.x],ys=[t.a.y,t.b.y,t.c.y];boxes.push({x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});}
  for(const c of level.curves??[])boxes.push({x:c.x-c.r,y:c.y-c.r,w:c.r*2,h:c.r*2});
  for(const c of circles(level).filter(x=>x.kind!=="portal"))boxes.push({x:c.x-c.r,y:c.y-c.r,w:c.r*2,h:c.r*2});
  if(!boxes.length)return{x:0,y:0};const left=Math.min(...boxes.map(r=>r.x)),right=Math.max(...boxes.map(r=>r.x+r.w)),top=Math.min(...boxes.map(r=>r.y)),bottom=Math.max(...boxes.map(r=>r.y+r.h));return{x:clamp((right-left)/FIELD.w,0,1),y:clamp((bottom-top)/FIELD.h,0,1)};
}
function offRouteObjects(level:LevelDefinition):string[]{
  const pts=routePoints(level),out:string[]=[];for(const obj of structuralRects(level)){
    let best=Infinity;for(let i=1;i<pts.length;i++)best=Math.min(best,segmentRectApproxDistance(pts[i-1]!,pts[i]!,obj.r));
    const center={x:obj.r.x+obj.r.w/2,y:obj.r.y+obj.r.h/2};if(best>135&&dist(center,level.ball)>95&&dist(center,level.hole)>95)out.push(obj.label);
  }return out;
}
function silhouette(level:LevelDefinition,hRatio:number,vRatio:number,open:number):string{
  const walls=structuralRects(level).filter(x=>x.kind.includes("wall")||x.kind.includes("Wall"));const tris=level.triangles?.length??0,curves=level.curves?.length??0,circs=circles(level).filter(x=>x.kind!=="portal").length;
  if(curves>=1)return"CURVED";if(tris>=2)return"ANGULAR";if(tris===1)return"CHAMFERED";if(circs>=2&&walls.length<=3)return"ISLANDS";
  if(walls.length>=3&&hRatio>=.68)return"SHELVES";if(walls.length>=3&&vRatio>=.68)return"COLUMNS";
  if(walls.length===1){const r=walls[0]!.r,cx=r.x+r.w/2,cy=r.y+r.h/2;if(Math.abs(cx-(FIELD.x+FIELD.w/2))<FIELD.w*.18&&Math.abs(cy-(FIELD.y+FIELD.h/2))<FIELD.h*.22)return"MONOLITH";}
  if(open>=.94&&walls.length<=2)return"OPEN";if(walls.length>=5)return"MAZE";return"MIXED";
}
function geometryMetrics(level:LevelDefinition):GeometryMetrics{
  const rs=rects(level).filter(x=>x.visual),tris=level.triangles?.length??0,curves=level.curves?.length??0,circs=circles(level).length,total=rs.length+tris+curves+circs;
  const walls=structuralRects(level).filter(x=>x.kind.includes("wall")||x.kind.includes("Wall"));let h=0,v=0;for(const x of walls){if(x.r.w>=x.r.h*1.35)h++;else if(x.r.h>=x.r.w*1.35)v++;}
  const occ=occupancy(level),spread=objectSpread(level),open=1-occ.coverage,structuralCount=walls.length+tris+curves+circs;
  const scaleClass:GeometryMetrics["scaleClass"]=occ.coverage>=.19||structuralCount>=9?"DENSE":spread.x>0&&spread.y>0&&(spread.x<.56||spread.y<.52)?"COMPACT":open>=.91&&spread.x>=.66&&spread.y>=.65?"OPEN":"STANDARD";
  const hRatio=walls.length?h/walls.length:0,vRatio=walls.length?v/walls.length:0;
  return{rectCount:rs.length,triangleCount:tris,curveCount:curves,circleCount:circs,shapeCount:total,rectDominance:total?round(rs.length/total,2):0,nonRectRatio:total?round((tris+curves+circs)/total,2):0,horizontalWallRatio:round(hRatio,2),verticalWallRatio:round(vRatio,2),structuralCoverage:round(occ.coverage,3),openSpace:round(open,3),spreadX:round(spread.x,2),spreadY:round(spread.y,2),scaleClass,silhouette:silhouette(level,hRatio,vRatio,open),deadGaps:deadGaps(level),offRouteObjects:offRouteObjects(level)};
}
function mechanics(level:LevelDefinition):Set<string>{const out=new Set<string>();const add=(name:string,n:number|undefined)=>{if((n??0)>0)out.add(name);};add("bumper",(level.bumpers?.length??0)+(level.movingBumpers?.length??0)+(level.popBumpers?.length??0));add("sand",level.sand?.length);add("ice",level.ice?.length);add("booster",level.boosters?.length);add("fan",(level.fans?.length??0)+(level.winds?.length??0));add("curve",level.curves?.length);add("portal",level.portals?.length);add("moving",(level.movingWalls?.length??0)+(level.movingBumpers?.length??0));add("void",(level.voids?.length??0)+(level.popVoids?.length??0));add("ramp",level.ramps?.length);add("trampoline",level.trampolines?.length);return out;}
function setJaccard(a:Set<string>,b:Set<string>):number{if(!a.size&&!b.size)return 1;let inter=0;for(const x of a)if(b.has(x))inter++;return inter/(a.size+b.size-inter||1);}
function vector(level:LevelDefinition,g:GeometryMetrics,r:RouteMetrics):number[]{return[g.rectDominance,g.nonRectRatio,g.horizontalWallRatio,g.verticalWallRatio,g.structuralCoverage,g.spreadX,g.spreadY,r.axisRatio,r.diagonalRatio,clamp((r.detour-1)/1.6,0,1),clamp(r.turns/6,0,1),clamp(mechanics(level).size/4,0,1)];}
function vectorSimilarity(a:number[],b:number[]):number{let sum=0;for(let i=0;i<a.length;i++){const d=(a[i]??0)-(b[i]??0);sum+=d*d;}return clamp(1-Math.sqrt(sum/a.length),0,1);}
function compareLevels(a:LevelDefinition,ag:GeometryMetrics,ar:RouteMetrics,b:LevelDefinition,bg:GeometryMetrics,br:RouteMetrics):SimilarityHit{
  const av=vector(a,ag,ar),bv=vector(b,bg,br),shape=vectorSimilarity(av,bv),ra=occupancy(a,18,30).raster,rb=occupancy(b,18,30).raster,raster=jaccard(ra,rb),mechanic=setJaccard(mechanics(a),mechanics(b)),silhouetteSame=ag.silhouette===bg.silhouette;
  const score=clamp(shape*.46+raster*.28+mechanic*.14+(silhouetteSame?.12:0),0,1);return{id:b.id,score:round(score,3),shape:round(shape,3),raster:round(raster,3),mechanic:round(mechanic,3),silhouetteSame,distance:Math.abs(levelIndex(a)-levelIndex(b))};
}
function profile(row:HumanRow|null,name:string):HumanProfile|null{return row?.profiles.find(x=>x.name===name)??null;}
function scoreCard(level:LevelDefinition,g:GeometryMetrics,r:RouteMetrics,h:HumanRow|null,nearestRecent:SimilarityHit|null):ScoreCard{
  const touch=profile(h,"touch")?.successRate??.7,casual=profile(h,"casual")?.successRate??.6,tol=h?.minShotTolerance??.5,recovery=h?.recovery.recoverableRate??.8;
  const sealed=g.deadGaps.filter(x=>x.kind==="SEALED").length,tight=g.deadGaps.length-sealed;
  let clarity=100-sealed*11-tight*4-(h?.minRestEdgeDistance!==null&&h?.minRestEdgeDistance!==undefined&&h.minRestEdgeDistance<22?10:0)-(h?.status==="BLOCKER"?35:0);clarity=clamp(clarity,0,100);
  let flow=(touch*.32+casual*.18+tol*.25+recovery*.25)*100;if((h?.routeFamilies??2)>=3)flow+=5;if(r.detour>2.3)flow-=7;flow=clamp(flow,0,100);
  let variety=58+(g.nonRectRatio*28)+(r.diagonalRatio*18)-(g.rectDominance>.86?14:0)-(g.horizontalWallRatio>.72?10:0);if(nearestRecent&&nearestRecent.score>.76)variety-=(nearestRecent.score-.76)*90+8;if(g.silhouette==="SHELVES"&&r.sideChanges>=2)variety-=7;variety=clamp(variety,0,100);
  let composition=92-g.offRouteObjects.length*7-g.deadGaps.length*3;if(g.scaleClass==="DENSE")composition-=8;if(g.shapeCount>13)composition-=Math.min(14,(g.shapeCount-13)*2);composition=clamp(composition,0,100);
  let mechanic=level.primaryMechanic&&level.primaryMechanic!=="wall"?(h?.mechanicRelevant===false?35:h?.mechanicRelevant===true?94:75):82;if(mechanics(level).size>=2)mechanic+=3;mechanic=clamp(mechanic,0,100);
  const target=level.threeStar.maxStrokes??null,human=h?.humanStrokes??null;let goals=82;if(target!==null&&human!==null){const d=Math.abs(target-human);goals=d===0?98:d===1?78:48;}if(h?.flags.some(x=>x.startsWith("OBJECTIVE_")))goals=Math.min(goals,55);
  const overall=clarity*.18+flow*.22+variety*.24+composition*.13+mechanic*.13+goals*.10;return{clarity:round(clarity),flow:round(flow),variety:round(variety),composition:round(composition),mechanic:round(mechanic),goals:round(goals),overall:round(overall)};
}
function advice(level:LevelDefinition,g:GeometryMetrics,r:RouteMetrics,h:HumanRow|null,nearestRecent:SimilarityHit|null,s:ScoreCard,fb:FeedbackLevel|null):Advice[]{
  const out:Advice[]=[];const push=(priority:Priority,code:string,text:string,evidence:string)=>out.push({priority,code,text,evidence});
  if(h?.status==="BLOCKER")push("P0","HUMAN_BLOCKER","Resolver el blocker de ejecución antes de rediseñar estética o añadir dificultad.",h.flags.join(", ")||"Audit 2.1 BLOCKER");
  const sealed=g.deadGaps.filter(x=>x.kind==="SEALED"),tight=g.deadGaps.filter(x=>x.kind==="TIGHT");if(sealed.length)push("P1","DEAD_GAP","Cerrar visualmente o ensanchar estos huecos: si parece un paso, la bola debe caber con margen.",sealed.slice(0,4).map(x=>`${x.between} ${x.clearance}px`).join("; "));if(tight.length>=2)push("P2","TIGHT_GAPS","Revisar pasos casi transitables; la geometría debería comunicar claramente qué es corredor y qué no.",tight.slice(0,4).map(x=>`${x.between} ${x.clearance}px`).join("; "));
  if(g.rectDominance>=.86&&g.shapeCount>=3)push("P1","RECT_DOMINANCE","Romper la gramática de cajas: sustituir alguna pieza funcional por diagonal, triángulo, curva o forma circular cuando cambie el rebote/lectura.",`${Math.round(g.rectDominance*100)}% de primitivas visuales son rectangulares`);
  if(g.silhouette==="SHELVES"&&r.sideChanges>=2)push("P1","SHELF_GRAMMAR","Evitar otra secuencia de estanterías alternas. Conservar la mecánica, pero cambiar la silueta/pregunta espacial.",`${Math.round(g.horizontalWallRatio*100)}% paredes horizontales · ${r.sideChanges} cambios de lado`);
  if(r.axisRatio>=.8&&r.segments>=3)push("P2","AXIS_ROUTE","Introducir al menos una decisión diagonal/curva si mejora el flujo; demasiados tramos ortogonales refuerzan la sensación de plantilla.",`${Math.round(r.axisRatio*100)}% de segmentos de ruta alineados a ejes`);
  if(nearestRecent&&nearestRecent.score>=.76)push("P1","PERCEPTUAL_REPEAT","Diferenciar este hoyo de sus vecinos en silueta, escala o ruta; no basta con mover paredes.",`${nearestRecent.id} similarity=${nearestRecent.score}`);
  if(g.offRouteObjects.length)push("P2","OFF_ROUTE_OBJECT","Revisar si estas piezas son necesarias para anti-cheese, lectura o recuperación. Si no cumplen una función, eliminarlas.",g.offRouteObjects.slice(0,5).join(", "));
  if(h?.mechanicRelevant===false)push("P1","MECHANIC_DECORATIVE","La mecánica principal debe afectar a una ruta competitiva, no actuar como decoración evitable.",String(level.primaryMechanic??"unknown"));
  if((h?.routeFamilies??2)<=1&&!level.onboarding)push("P1","SINGLE_ROUTE","Crear una segunda familia de ejecución o una elección riesgo/recompensa para evitar niveles-contraseña.",`${h?.routeFamilies??0} familia(s) de ruta`);
  const touch=profile(h,"touch")?.successRate??1;if(touch<.45)push("P1","LOW_TOUCH_MARGIN","Aumentar zonas de aterrizaje o anchura útil; subir diversión mediante decisiones, no precisión obligatoria.",`touch=${pct(touch)} tolerance=${pct(h?.minShotTolerance??null)}`);
  if((h?.recovery.recoverableRate??1)<.78)push("P1","POOR_RECOVERY","Dar una salida clara a tiros mediocres: que el error cueste golpes, no una run muerta.",`recovery=${pct(h?.recovery.recoverableRate??null)}`);
  if(level.threeStar.maxStrokes!==undefined&&h?.humanStrokes!==null&&h?.humanStrokes!==undefined&&Math.abs(level.threeStar.maxStrokes-h.humanStrokes)>=2)push("P1","OBJECTIVE_MISMATCH","Calibrar 3★ con la ruta humana modelada; los trickshots expertos pueden existir sin definir el par humano.",`target=${level.threeStar.maxStrokes} human=${h.humanStrokes}`);
  if(g.scaleClass==="DENSE"&&g.openSpace<.82)push("P2","DENSITY","Reducir piezas o abrir una zona de respiración; más obstáculos no equivalen a más diseño.",`open=${Math.round(g.openSpace*100)}% shapes=${g.shapeCount}`);
  if(fb&&(fb.avgOriginality??5)<=2.5)push("P1","HUMAN_ORIGINALITY_LOW","Priorizar un cambio de silueta/pregunta estratégica porque jugadores reales perciben repetición.",`originality=${fb.avgOriginality?.toFixed(1)} n=${fb.sampleSize}`);
  if(fb&&(fb.avgFun??5)<=2.5&&(fb.avgDifficulty??3)<=3)push("P1","HUMAN_FUN_LOW","La dificultad no explica la nota baja: rediseñar decisión, ritmo o identidad del hoyo antes de endurecerlo.",`fun=${fb.avgFun?.toFixed(1)} difficulty=${fb.avgDifficulty?.toFixed(1)} n=${fb.sampleSize}`);
  if(!out.length)push("P2","KEEP_CORE","La estructura no muestra deuda clara. Mantener la pregunta central y validar sensaciones con humanos antes de añadir piezas.",`overall=${s.overall}`);
  const order:Record<Priority,number>={P0:0,P1:1,P2:2};return out.sort((a,b)=>order[a.priority]-order[b.priority]);
}

const baseMetrics=new Map<string,{g:GeometryMetrics;r:RouteMetrics}>();for(const level of levels)baseMetrics.set(level.id,{g:geometryMetrics(level),r:routeMetrics(level)});
const rows:Audit3Row[]=[];
for(const level of levels){
  const {g,r}=baseMetrics.get(level.id)!,h=humanById.get(level.id)??null,fb=feedbackById.get(level.id)??null,peers=levels.filter(x=>x.mode===level.mode&&x.id!==level.id);
  const hits=peers.map(p=>{const m=baseMetrics.get(p.id)!;return compareLevels(level,g,r,p,m.g,m.r);}).sort((a,b)=>b.score-a.score),nearest=hits[0]??null,recent=hits.filter(x=>x.distance<=3).sort((a,b)=>b.score-a.score)[0]??null,s=scoreCard(level,g,r,h,recent),adv=advice(level,g,r,h,recent,s,fb);
  const flags:string[]=[];if(g.deadGaps.some(x=>x.kind==="SEALED"))flags.push("DEAD_GAP");if(g.rectDominance>=.86&&g.shapeCount>=3)flags.push("RECT_DOMINANCE");if(g.silhouette==="SHELVES"&&r.sideChanges>=2)flags.push("SHELF_GRAMMAR");if(recent&&recent.score>=.76)flags.push(`REPEAT:${recent.id}`);if(g.offRouteObjects.length)flags.push("OFF_ROUTE_OBJECTS");if(h?.mechanicRelevant===false)flags.push("MECHANIC_RELEVANCE_LOW");
  const status:AuditStatus=h?.status==="BLOCKER"?"BLOCKER":s.overall<58||flags.includes("MECHANIC_RELEVANCE_LOW")?"REVIEW":"PASS";
  let disposition:DesignDisposition=status==="BLOCKER"||s.overall<55?"REDESIGN":s.overall<77||flags.length?"CLEANUP":"KEEP";if(level.onboarding&&disposition==="REDESIGN")disposition="CLEANUP";
  rows.push({id:level.id,mode:level.mode,index:levelIndex(level),group:level.group,primaryMechanic:level.primaryMechanic??null,disposition,status,geometry:g,route:r,scores:s,nearest,nearestRecent:recent,human:{strokes:h?.humanStrokes??null,best:h?.learnedStrokes??null,target:level.threeStar.maxStrokes??null,touch:profile(h,"touch")?.successRate??null,casual:profile(h,"casual")?.successRate??null,tolerance:h?.minShotTolerance??null,recovery:h?.recovery.recoverableRate??null,families:h?.routeFamilies??null,status:h?.status??null,flags:h?.flags??[]},feedback:fb,flags,advice:adv});
}
function consecutiveRuns(modeRows:Audit3Row[],pick:(r:Audit3Row)=>string,min=3):CampaignRun[]{const out:CampaignRun[]=[];let start=0;while(start<modeRows.length){const value=pick(modeRows[start]!),endStart=start;let end=start+1;while(end<modeRows.length&&pick(modeRows[end]!)===value)end++;if(end-start>=min)out.push({from:modeRows[endStart]!.id,to:modeRows[end-1]!.id,length:end-start,value});start=end;}return out;}
function countBy(items:string[]):Record<string,number>{const out:Record<string,number>={};for(const x of items)out[x]=(out[x]??0)+1;return out;}
function campaignSummary(mode:string):CampaignSummary{
  const rs=rows.filter(x=>x.mode===mode).sort((a,b)=>a.index-b.index),disp:Record<DesignDisposition,number>={KEEP:0,CLEANUP:0,REDESIGN:0};for(const r of rs)disp[r.disposition]++;
  const silhouetteRuns=consecutiveRuns(rs,x=>x.geometry.silhouette),scaleRuns=consecutiveRuns(rs,x=>x.geometry.scaleClass,4),rectDominant=rs.filter(x=>x.geometry.rectDominance>=.86&&x.geometry.shapeCount>=3).length,nonRect=rs.filter(x=>x.geometry.nonRectRatio>=.18).length,recs:string[]=[];
  if(rectDominant/Math.max(1,rs.length)>.5)recs.push(`Demasiados hoyos rectangulares (${rectDominant}/${rs.length}). En el próximo batch, al menos 2 de cada 3 hoyos deberían usar una silueta no basada solo en rectángulos.`);
  if(silhouetteRuns.length)recs.push(`Romper rachas de silueta repetida: ${silhouetteRuns.map(x=>`${x.from}–${x.to} ${x.value}`).join(", ")}.`);
  if(scaleRuns.length)recs.push(`Variar escala aparente: ${scaleRuns.map(x=>`${x.from}–${x.to} ${x.value}`).join(", ")}. Ninguna escala debería dominar 4+ hoyos seguidos.`);
  if(rs.filter(x=>x.geometry.deadGaps.some(g=>g.kind==="SEALED")).length)recs.push("Aplicar regla visual de clearance: un hueco aparentemente jugable debe tener ≥34px; si no, cerrarlo de forma inequívoca.");
  recs.push("Diseñar cada hoyo con una frase de silueta antes de colocar mecánicas (p. ej. isla, V, embudo, anillo, campo abierto). No repetir la misma frase en hoyos vecinos.");
  recs.push("Las estrellas siguen la ruta humana; un trickshot de solver puede ser mastery line sin obligar a deformar la geometría para eliminarlo.");
  const top=[...rs].sort((a,b)=>a.scores.overall-b.scores.overall||b.flags.length-a.flags.length).slice(0,Math.min(6,rs.length)).map(x=>`${x.id}:${x.disposition}:${x.scores.overall}`);
  return{mode,levels:rs.length,averageOverall:round(rs.reduce((s,x)=>s+x.scores.overall,0)/Math.max(1,rs.length)),averageVariety:round(rs.reduce((s,x)=>s+x.scores.variety,0)/Math.max(1,rs.length)),rectDominantLevels:rectDominant,nonRectLevels:nonRect,dispositions:disp,silhouettes:countBy(rs.map(x=>x.geometry.silhouette)),scales:countBy(rs.map(x=>x.geometry.scaleClass)),repeatedSilhouetteRuns:silhouetteRuns,repeatedScaleRuns:scaleRuns,topRedesign:top,recommendations:recs};
}
const campaigns=[campaignSummary("classic"),campaignSummary("troll")];
const summary={total:rows.length,keep:rows.filter(x=>x.disposition==="KEEP").length,cleanup:rows.filter(x=>x.disposition==="CLEANUP").length,redesign:rows.filter(x=>x.disposition==="REDESIGN").length,blockers:rows.filter(x=>x.status==="BLOCKER").length,averageOverall:round(rows.reduce((s,x)=>s+x.scores.overall,0)/Math.max(1,rows.length))};

mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/audit3-report.json",JSON.stringify({generatedAt:new Date().toISOString(),version:"3.0",humanModel:humanReport?.version??null,humanMode:humanReport?.mode??null,summary,campaigns,rows},null,2));
const md:string[]=["# Hole in What? · Audit 3.0 — Map Design","",`Summary: **${summary.keep} KEEP · ${summary.cleanup} CLEANUP · ${summary.redesign} REDESIGN · ${summary.blockers} BLOCKER**`,`Average design score: **${summary.averageOverall}/100**`,`Human layer: **${humanReport?`${humanReport.version??"2.x"} / ${humanReport.mode}`:"missing — structural-only fallback"}**`,"","> Audit 3.0 is a design advisor. Scores are evidence, not a replacement for human playtests. P0/P1 advice should be reviewed before adding more geometry.",""];
for(const c of campaigns){md.push(`## ${c.mode.toUpperCase()} campaign`,`Average: **${c.averageOverall}/100** · Variety: **${c.averageVariety}/100** · Rect-dominant: **${c.rectDominantLevels}/${c.levels}** · Non-rect: **${c.nonRectLevels}/${c.levels}**`,`Silhouettes: ${Object.entries(c.silhouettes).map(([k,v])=>`${k} ${v}`).join(" · ")}`,`Scales: ${Object.entries(c.scales).map(([k,v])=>`${k} ${v}`).join(" · ")}`,`Priority review: ${c.topRedesign.join(" · ")}`,"",...c.recommendations.map(x=>`- ${x}`),"");}
md.push("## Level matrix","","| Hole | Action | Score | Variety | Silhouette | Scale | Rect | Open | Route | Human | Recent repeat | Flags |","|---|---|---:|---:|---|---|---:|---:|---|---|---|---|");
for(const r of rows){md.push(`| ${r.id} | **${r.disposition}** | ${r.scores.overall} | ${r.scores.variety} | ${r.geometry.silhouette} | ${r.geometry.scaleClass} | ${Math.round(r.geometry.rectDominance*100)}% | ${Math.round(r.geometry.openSpace*100)}% | ${r.route.segments}s/${r.route.turns}t/${Math.round(r.route.diagonalRatio*100)}% diag | ${r.human.strokes??"?"} strokes · ${pct(r.human.touch)} touch | ${r.nearestRecent?`${r.nearestRecent.id} ${r.nearestRecent.score}`:"—"} | ${r.flags.join(", ")||"—"} |`);}
md.push("","## Designer briefs","");for(const r of rows){md.push(`### ${r.id} · ${r.disposition} · ${r.scores.overall}/100`,`**Core:** ${r.geometry.silhouette} / ${r.geometry.scaleClass} · mechanic=${r.primaryMechanic??"none"} · rect=${Math.round(r.geometry.rectDominance*100)}% · open=${Math.round(r.geometry.openSpace*100)}% · detour=${r.route.detour}× · route families=${r.human.families??"?"}`,`**Scores:** clarity ${r.scores.clarity} · flow ${r.scores.flow} · variety ${r.scores.variety} · composition ${r.scores.composition} · mechanic ${r.scores.mechanic} · goals ${r.scores.goals}`,...(r.advice.map(a=>`- **${a.priority} ${a.code}:** ${a.text} _(${a.evidence})_`)),"");}
writeFileSync("artifacts/audit3-report.md",md.join("\n"));
console.log(`\n=== AUDIT 3.0 MAP DESIGN ===`);for(const c of campaigns)console.log(`${c.mode.toUpperCase()}: avg=${c.averageOverall} variety=${c.averageVariety} KEEP=${c.dispositions.KEEP} CLEANUP=${c.dispositions.CLEANUP} REDESIGN=${c.dispositions.REDESIGN}`);console.log(`TOTAL: ${summary.keep} KEEP · ${summary.cleanup} CLEANUP · ${summary.redesign} REDESIGN · ${summary.blockers} BLOCKER`);console.log("Reports: artifacts/audit3-report.json + artifacts/audit3-report.md");
if(process.env.AUDIT3_STRICT==="1"&&summary.blockers>0)process.exitCode=1;
