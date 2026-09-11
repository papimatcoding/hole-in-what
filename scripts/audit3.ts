import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { levelsForMode } from "../src/data/campaign";
import { GOLF_PHYSICS } from "../src/systems/GolfSimulation";
import type { CurveDef, LevelDefinition, RectDef, TriangleDef, Vec2 } from "../src/types";

type AuditStatus = "PASS" | "REVIEW" | "BLOCKER";
type Disposition = "KEEP" | "CLEANUP" | "REDESIGN";
type Priority = "P0" | "P1" | "P2";

type HumanProfile = { name:string; successRate:number; voidRate:number; medianEndDistance:number };
type HumanRecovery = { sampleCount:number; recoverableRate:number; movingTimeoutRate:number };
type HumanRow = {
  id:string; mode:string; target:number; learnedStrokes:number|null; humanStrokes:number|null; naiveStrokes:number|null; explorerStrokes:number|null;
  routeFamilies:number; profiles:HumanProfile[]; minShotTolerance:number|null; humanScore:number|null; mechanicRelevant:boolean|null;
  recovery:HumanRecovery; minRestEdgeDistance:number|null; flags:string[]; status:AuditStatus;
};
type HumanReport = { generatedAt:string; version?:string; mode:string; rows:HumanRow[] };
type FeedbackLevel = { levelId:string; sampleSize:number; avgFun?:number|null; avgOriginality?:number|null; avgDifficulty?:number|null; bugRate?:number|null };
type FeedbackSnapshot = { levels:FeedbackLevel[] };
type NamedRect = { label:string; kind:string; r:RectDef; structural:boolean; visual:boolean };
type NamedCircle = { label:string; kind:string; x:number; y:number; r:number };
type GapIssue = { kind:"SEALED"|"TIGHT"; between:string; clearance:number; orientation:string };
type RouteMetrics = { length:number; direct:number; detour:number; segments:number; turns:number; hardTurns:number; axisRatio:number; diagonalRatio:number; sideChanges:number };
type GeometryMetrics = {
  rectCount:number; triangleCount:number; curveCount:number; circleCount:number; shapeCount:number; rectDominance:number; nonRectRatio:number;
  horizontalWallRatio:number; verticalWallRatio:number; structuralCoverage:number; openSpace:number; spreadX:number; spreadY:number;
  scaleClass:"OPEN"|"STANDARD"|"COMPACT"|"DENSE"; silhouette:string; deadGaps:GapIssue[]; offRouteObjects:string[];
};
type SimilarityHit = { id:string; score:number; shape:number; raster:number; mechanic:number; silhouetteSame:boolean; distance:number };
type ScoreCard = { clarity:number; flow:number; variety:number; composition:number; mechanic:number; goals:number; overall:number };
type Advice = { priority:Priority; code:string; text:string; evidence:string };
type Audit3Row = {
  id:string; mode:string; index:number; group:number; primaryMechanic:string|null; disposition:Disposition; status:AuditStatus;
  geometry:GeometryMetrics; route:RouteMetrics; scores:ScoreCard; nearest:SimilarityHit|null; nearestRecent:SimilarityHit|null;
  human:{strokes:number|null;best:number|null;target:number|null;touch:number|null;casual:number|null;tolerance:number|null;recovery:number|null;families:number|null;status:AuditStatus|null;flags:string[]};
  feedback:FeedbackLevel|null; flags:string[]; advice:Advice[];
};
type CampaignRun = { from:string; to:string; length:number; value:string };
type CampaignSummary = {
  mode:string; levels:number; averageOverall:number; averageVariety:number; rectDominantLevels:number; nonRectLevels:number;
  dispositions:Record<Disposition,number>; silhouettes:Record<string,number>; scales:Record<string,number>;
  repeatedSilhouetteRuns:CampaignRun[]; repeatedScaleRuns:CampaignRun[]; topRedesign:string[]; recommendations:string[];
};

const FIELD = GOLF_PHYSICS.field;
const BALL = GOLF_PHYSICS.ballRadius;
const VISUAL_PASSAGE = BALL * 2 + 8;
const TAU = Math.PI * 2;
const clamp = (v:number,a:number,b:number) => Math.max(a,Math.min(b,v));
const round = (v:number,d=1) => Number(v.toFixed(d));
const dist = (a:Vec2,b:Vec2) => Math.hypot(a.x-b.x,a.y-b.y);
const pct = (v:number|null) => v===null ? "n/a" : `${Math.round(v*100)}%`;
const levelIndex = (level:LevelDefinition) => Number(level.id.split("-").at(-1) ?? 0);

const humanPath = process.env.AUDIT3_HUMAN_FILE ?? "artifacts/audit2-report.json";
const feedbackPath = process.env.AUDIT3_FEEDBACK_FILE ?? "artifacts/audit2-feedback.json";
const humanReport:HumanReport|null = existsSync(humanPath) ? JSON.parse(readFileSync(humanPath,"utf8")) as HumanReport : null;
const feedback:FeedbackSnapshot|null = existsSync(feedbackPath) ? JSON.parse(readFileSync(feedbackPath,"utf8")) as FeedbackSnapshot : null;
const humanById = new Map((humanReport?.rows ?? []).map(x => [x.id,x]));
const feedbackById = new Map((feedback?.levels ?? []).map(x => [x.levelId,x]));
const levels = [...levelsForMode("classic"),...levelsForMode("troll")];

function rects(level:LevelDefinition):NamedRect[] {
  const out:NamedRect[]=[];
  const add=(kind:string,items:RectDef[]|undefined,structural:boolean,visual=true)=>items?.forEach((r,i)=>out.push({label:`${kind}[${i}]`,kind,r,structural,visual}));
  add("wall",level.walls,true); add("movingWall",level.movingWalls,true); add("popWall",level.popWalls,true);
  add("void",level.voids,true); add("popVoid",level.popVoids,true);
  add("sand",level.sand,false); add("ice",level.ice,false); add("booster",level.boosters,false); add("fan",level.fans,false);
  add("wind",level.winds,false); add("ramp",level.ramps,false);
  return out;
}
function circles(level:LevelDefinition):NamedCircle[] {
  const out:NamedCircle[]=[];
  level.bumpers?.forEach((b,i)=>out.push({label:`bumper[${i}]`,kind:"bumper",x:b.x,y:b.y,r:b.r}));
  level.movingBumpers?.forEach((b,i)=>out.push({label:`movingBumper[${i}]`,kind:"movingBumper",x:b.x,y:b.y,r:b.r}));
  level.popBumpers?.forEach((b,i)=>out.push({label:`popBumper[${i}]`,kind:"popBumper",x:b.x,y:b.y,r:b.r}));
  level.trampolines?.forEach((b,i)=>out.push({label:`trampoline[${i}]`,kind:"trampoline",x:b.x,y:b.y,r:b.r}));
  level.portals?.forEach((p,i)=>{
    out.push({label:`portal[${i}].a`,kind:"portal",x:p.a.x,y:p.a.y,r:p.a.r??28});
    out.push({label:`portal[${i}].b`,kind:"portal",x:p.b.x,y:p.b.y,r:p.b.r??28});
  });
  return out;
}
const structuralRects = (level:LevelDefinition) => rects(level).filter(x=>x.structural);
const overlap = (a1:number,a2:number,b1:number,b2:number) => Math.max(0,Math.min(a2,b2)-Math.max(a1,b1));
function rectDistance(r:RectDef,p:Vec2):number { const x=clamp(p.x,r.x,r.x+r.w),y=clamp(p.y,r.y,r.y+r.h);return Math.hypot(p.x-x,p.y-y); }
function segmentRectDistance(a:Vec2,b:Vec2,r:RectDef):number {
  let best=Infinity;for(let i=0;i<=10;i++){const q=i/10,p={x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q};best=Math.min(best,rectDistance(r,p));}return best;
}
function pointInTriangle(p:Vec2,t:TriangleDef):boolean {
  const sign=(p1:Vec2,p2:Vec2,p3:Vec2)=>(p1.x-p3.x)*(p2.y-p3.y)-(p2.x-p3.x)*(p1.y-p3.y);
  const d1=sign(p,t.a,t.b),d2=sign(p,t.b,t.c),d3=sign(p,t.c,t.a);return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0));
}
function norm(a:number):number { return ((a%TAU)+TAU)%TAU; }
function inArc(angle:number,c:CurveDef):boolean { const a=norm(angle),s=norm(c.startAngle),e=norm(c.endAngle);return s<=e?a>=s&&a<=e:a>=s||a<=e; }
function structuralAt(level:LevelDefinition,p:Vec2):boolean {
  if(structuralRects(level).some(x=>p.x>=x.r.x&&p.x<=x.r.x+x.r.w&&p.y>=x.r.y&&p.y<=x.r.y+x.r.h))return true;
  if((level.triangles??[]).some(t=>pointInTriangle(p,t)))return true;
  if((level.curves??[]).some(c=>{const d=Math.hypot(p.x-c.x,p.y-c.y);return Math.abs(d-c.r)<=(c.thickness??22)/2&&inArc(Math.atan2(p.y-c.y,p.x-c.x),c);} ))return true;
  return circles(level).filter(c=>c.kind.includes("Bumper")||c.kind==="bumper").some(c=>Math.hypot(p.x-c.x,p.y-c.y)<=c.r);
}
function occupancy(level:LevelDefinition,cols=24,rows=40):{coverage:number;raster:Set<number>} {
  const raster=new Set<number>();for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p={x:FIELD.x+(x+.5)*FIELD.w/cols,y:FIELD.y+(y+.5)*FIELD.h/rows};if(structuralAt(level,p))raster.add(y*cols+x);}return{coverage:raster.size/(cols*rows),raster};
}
function jaccard(a:Set<number>,b:Set<number>):number { if(!a.size&&!b.size)return 1;if(!a.size||!b.size)return 0;let n=0;for(const x of a)if(b.has(x))n++;return n/(a.size+b.size-n); }

function gapIssues(level:LevelDefinition):GapIssue[] {
  const rs=structuralRects(level),solidCircles=circles(level).filter(c=>c.kind.includes("Bumper")||c.kind==="bumper"),out:GapIssue[]=[];
  const add=(between:string,clearance:number,orientation:string)=>{if(clearance<=0||clearance>=VISUAL_PASSAGE)return;out.push({kind:clearance<BALL*2?"SEALED":"TIGHT",between,clearance:round(clearance),orientation});};
  for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){
    const a=rs[i]!,b=rs[j]!,xo=overlap(a.r.x,a.r.x+a.r.w,b.r.x,b.r.x+b.r.w),yo=overlap(a.r.y,a.r.y+a.r.h,b.r.y,b.r.y+b.r.h);
    if(xo>=BALL*1.5){const top=a.r.y+a.r.h<=b.r.y?a:b,bottom=top===a?b:a;add(`${a.label} ↔ ${b.label}`,bottom.r.y-(top.r.y+top.r.h),"horizontal slit");}
    if(yo>=BALL*1.5){const left=a.r.x+a.r.w<=b.r.x?a:b,right=left===a?b:a;add(`${a.label} ↔ ${b.label}`,right.r.x-(left.r.x+left.r.w),"vertical slit");}
  }
  for(const r of rs){
    if(r.r.h>=BALL*2){add(`${r.label} ↔ left boundary`,r.r.x-FIELD.x,"edge slit");add(`${r.label} ↔ right boundary`,FIELD.x+FIELD.w-r.r.x-r.r.w,"edge slit");}
    if(r.r.w>=BALL*2){add(`${r.label} ↔ top boundary`,r.r.y-FIELD.y,"edge slit");add(`${r.label} ↔ bottom boundary`,FIELD.y+FIELD.h-r.r.y-r.r.h,"edge slit");}
  }
  for(const c of solidCircles)for(const r of rs)add(`${c.label} ↔ ${r.label}`,rectDistance(r.r,{x:c.x,y:c.y})-c.r,"circle gap");
  return out.sort((a,b)=>a.clearance-b.clearance);
}
function routePoints(level:LevelDefinition):Vec2[] {
  const source=level.designPath?.length?level.designPath:[level.ball,level.hole],out:Vec2[]=[];for(const p of source)if(!out.length||dist(out.at(-1)!,p)>2)out.push(p);
  if(!out.length||dist(out[0]!,level.ball)>2)out.unshift(level.ball);if(dist(out.at(-1)!,level.hole)>2)out.push(level.hole);return out;
}
function routeMetrics(level:LevelDefinition):RouteMetrics {
  const pts=routePoints(level),vecs=pts.slice(1).map((p,i)=>({x:p.x-pts[i]!.x,y:p.y-pts[i]!.y}));let length=0,axis=0,diagonal=0,turns=0,hardTurns=0;
  for(const v of vecs){length+=Math.hypot(v.x,v.y);const raw=((Math.atan2(v.y,v.x)*180/Math.PI)%90+90)%90,dAxis=Math.min(raw,90-raw);if(dAxis<=12)axis++;if(dAxis>=24)diagonal++;}
  for(let i=1;i<vecs.length;i++){const a=vecs[i-1]!,b=vecs[i]!,den=Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y)||1,turn=Math.acos(clamp((a.x*b.x+a.y*b.y)/den,-1,1))*180/Math.PI;if(turn>=25)turns++;if(turn>=65)hardTurns++;}
  let sideChanges=0,last=0;for(const p of pts){const side=p.x<FIELD.x+FIELD.w*.42?-1:p.x>FIELD.x+FIELD.w*.58?1:0;if(side&&last&&side!==last)sideChanges++;if(side)last=side;}
  const direct=dist(level.ball,level.hole);return{length:round(length),direct:round(direct),detour:round(length/Math.max(1,direct),2),segments:vecs.length,turns,hardTurns,axisRatio:vecs.length?round(axis/vecs.length,2):0,diagonalRatio:vecs.length?round(diagonal/vecs.length,2):0,sideChanges};
}
function spread(level:LevelDefinition):{x:number;y:number} {
  const boxes:RectDef[]=structuralRects(level).map(x=>x.r);
  for(const t of level.triangles??[]){const xs=[t.a.x,t.b.x,t.c.x],ys=[t.a.y,t.b.y,t.c.y];boxes.push({x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});}
  for(const c of level.curves??[])boxes.push({x:c.x-c.r,y:c.y-c.r,w:c.r*2,h:c.r*2});
  for(const c of circles(level).filter(x=>x.kind!=="portal"))boxes.push({x:c.x-c.r,y:c.y-c.r,w:c.r*2,h:c.r*2});
  if(!boxes.length)return{x:0,y:0};const left=Math.min(...boxes.map(x=>x.x)),right=Math.max(...boxes.map(x=>x.x+x.w)),top=Math.min(...boxes.map(x=>x.y)),bottom=Math.max(...boxes.map(x=>x.y+x.h));return{x:clamp((right-left)/FIELD.w,0,1),y:clamp((bottom-top)/FIELD.h,0,1)};
}
function offRoute(level:LevelDefinition):string[] {
  const pts=routePoints(level),out:string[]=[];for(const obj of structuralRects(level)){let best=Infinity;for(let i=1;i<pts.length;i++)best=Math.min(best,segmentRectDistance(pts[i-1]!,pts[i]!,obj.r));const center={x:obj.r.x+obj.r.w/2,y:obj.r.y+obj.r.h/2};if(best>135&&dist(center,level.ball)>95&&dist(center,level.hole)>95)out.push(obj.label);}return out;
}
function silhouette(level:LevelDefinition,horizontal:number,vertical:number,openSpace:number):string {
  const walls=structuralRects(level).filter(x=>x.kind.includes("wall")||x.kind.includes("Wall")),triangles=level.triangles?.length??0,curves=level.curves?.length??0,rounds=circles(level).filter(x=>x.kind!=="portal").length;
  if(curves)return"CURVED";if(triangles>=2)return"ANGULAR";if(triangles===1)return"CHAMFERED";if(rounds>=2&&walls.length<=3)return"ISLANDS";if(walls.length>=3&&horizontal>=.68)return"SHELVES";if(walls.length>=3&&vertical>=.68)return"COLUMNS";
  if(walls.length===1){const r=walls[0]!.r,cx=r.x+r.w/2,cy=r.y+r.h/2;if(Math.abs(cx-(FIELD.x+FIELD.w/2))<FIELD.w*.18&&Math.abs(cy-(FIELD.y+FIELD.h/2))<FIELD.h*.22)return"MONOLITH";}
  if(openSpace>=.94&&walls.length<=2)return"OPEN";if(walls.length>=5)return"MAZE";return"MIXED";
}
function geometry(level:LevelDefinition):GeometryMetrics {
  const visualRects=rects(level).filter(x=>x.visual),triangles=level.triangles?.length??0,curves=level.curves?.length??0,rounds=circles(level).length,total=visualRects.length+triangles+curves+rounds;
  const walls=structuralRects(level).filter(x=>x.kind.includes("wall")||x.kind.includes("Wall"));let h=0,v=0;for(const w of walls){if(w.r.w>=w.r.h*1.35)h++;else if(w.r.h>=w.r.w*1.35)v++;}
  const occ=occupancy(level),objectSpread=spread(level),openSpace=1-occ.coverage,hRatio=walls.length?h/walls.length:0,vRatio=walls.length?v/walls.length:0,structuralCount=walls.length+triangles+curves+rounds;
  const scaleClass:GeometryMetrics["scaleClass"]=occ.coverage>=.19||structuralCount>=9?"DENSE":objectSpread.x>0&&objectSpread.y>0&&(objectSpread.x<.56||objectSpread.y<.52)?"COMPACT":openSpace>=.91&&objectSpread.x>=.66&&objectSpread.y>=.65?"OPEN":"STANDARD";
  return{rectCount:visualRects.length,triangleCount:triangles,curveCount:curves,circleCount:rounds,shapeCount:total,rectDominance:total?round(visualRects.length/total,2):0,nonRectRatio:total?round((triangles+curves+rounds)/total,2):0,horizontalWallRatio:round(hRatio,2),verticalWallRatio:round(vRatio,2),structuralCoverage:round(occ.coverage,3),openSpace:round(openSpace,3),spreadX:round(objectSpread.x,2),spreadY:round(objectSpread.y,2),scaleClass,silhouette:silhouette(level,hRatio,vRatio,openSpace),deadGaps:gapIssues(level),offRouteObjects:offRoute(level)};
}
function mechanics(level:LevelDefinition):Set<string> {
  const out=new Set<string>(),add=(name:string,n:number|undefined)=>{if((n??0)>0)out.add(name);};add("bumper",(level.bumpers?.length??0)+(level.movingBumpers?.length??0)+(level.popBumpers?.length??0));add("sand",level.sand?.length);add("ice",level.ice?.length);add("booster",level.boosters?.length);add("fan",(level.fans?.length??0)+(level.winds?.length??0));add("curve",level.curves?.length);add("portal",level.portals?.length);add("moving",(level.movingWalls?.length??0)+(level.movingBumpers?.length??0));add("void",(level.voids?.length??0)+(level.popVoids?.length??0));add("ramp",level.ramps?.length);add("trampoline",level.trampolines?.length);return out;
}
function setJaccard(a:Set<string>,b:Set<string>):number { if(!a.size&&!b.size)return 1;let n=0;for(const x of a)if(b.has(x))n++;return n/(a.size+b.size-n||1); }
function signature(level:LevelDefinition,g:GeometryMetrics,r:RouteMetrics):number[] { return[g.rectDominance,g.nonRectRatio,g.horizontalWallRatio,g.verticalWallRatio,g.structuralCoverage,g.spreadX,g.spreadY,r.axisRatio,r.diagonalRatio,clamp((r.detour-1)/1.6,0,1),clamp(r.turns/6,0,1),clamp(mechanics(level).size/4,0,1)]; }
function signatureSimilarity(a:number[],b:number[]):number { let sum=0;for(let i=0;i<a.length;i++){const d=(a[i]??0)-(b[i]??0);sum+=d*d;}return clamp(1-Math.sqrt(sum/a.length),0,1); }
function compare(a:LevelDefinition,ag:GeometryMetrics,ar:RouteMetrics,b:LevelDefinition,bg:GeometryMetrics,br:RouteMetrics):SimilarityHit {
  const shape=signatureSimilarity(signature(a,ag,ar),signature(b,bg,br)),raster=jaccard(occupancy(a,18,30).raster,occupancy(b,18,30).raster),mechanic=setJaccard(mechanics(a),mechanics(b)),silhouetteSame=ag.silhouette===bg.silhouette;
  const score=clamp(shape*.46+raster*.28+mechanic*.14+(silhouetteSame ? .12 : 0),0,1);return{id:b.id,score:round(score,3),shape:round(shape,3),raster:round(raster,3),mechanic:round(mechanic,3),silhouetteSame,distance:Math.abs(levelIndex(a)-levelIndex(b))};
}
function profile(row:HumanRow|null,name:string):HumanProfile|null { return row?.profiles.find(x=>x.name===name)??null; }
function scores(level:LevelDefinition,g:GeometryMetrics,r:RouteMetrics,h:HumanRow|null,recent:SimilarityHit|null):ScoreCard {
  const touch=profile(h,"touch")?.successRate??.7,casual=profile(h,"casual")?.successRate??.6,tolerance=h?.minShotTolerance??.5,recovery=h?.recovery.recoverableRate??.8,sealed=g.deadGaps.filter(x=>x.kind==="SEALED").length,tight=g.deadGaps.length-sealed;
  let clarity=100-sealed*11-tight*4-(h?.minRestEdgeDistance!==null&&h?.minRestEdgeDistance!==undefined&&h.minRestEdgeDistance<22?10:0)-(h?.status==="BLOCKER"?35:0);clarity=clamp(clarity,0,100);
  let flow=(touch*.32+casual*.18+tolerance*.25+recovery*.25)*100;if((h?.routeFamilies??2)>=3)flow+=5;if(r.detour>2.3)flow-=7;flow=clamp(flow,0,100);
  let variety=58+g.nonRectRatio*28+r.diagonalRatio*18-(g.rectDominance>.86?14:0)-(g.horizontalWallRatio>.72?10:0);if(recent&&recent.score>.76)variety-=(recent.score-.76)*90+8;if(g.silhouette==="SHELVES"&&r.sideChanges>=2)variety-=7;variety=clamp(variety,0,100);
  let composition=92-g.offRouteObjects.length*7-g.deadGaps.length*3;if(g.scaleClass==="DENSE")composition-=8;if(g.shapeCount>13)composition-=Math.min(14,(g.shapeCount-13)*2);composition=clamp(composition,0,100);
  let mechanic=level.primaryMechanic&&level.primaryMechanic!=="wall"?(h?.mechanicRelevant===false?35:h?.mechanicRelevant===true?94:75):82;if(mechanics(level).size>=2)mechanic+=3;mechanic=clamp(mechanic,0,100);
  const target=level.threeStar.maxStrokes??null,human=h?.humanStrokes??null;let goals=82;if(target!==null&&human!==null){const d=Math.abs(target-human);goals=d===0?98:d===1?78:48;}if(h?.flags.some(x=>x.startsWith("OBJECTIVE_")))goals=Math.min(goals,55);
  return{clarity:round(clarity),flow:round(flow),variety:round(variety),composition:round(composition),mechanic:round(mechanic),goals:round(goals),overall:round(clarity*.18+flow*.22+variety*.24+composition*.13+mechanic*.13+goals*.10)};
}
function advice(level:LevelDefinition,g:GeometryMetrics,r:RouteMetrics,h:HumanRow|null,recent:SimilarityHit|null,s:ScoreCard,fb:FeedbackLevel|null):Advice[] {
  const out:Advice[]=[],push=(priority:Priority,code:string,text:string,evidence:string)=>out.push({priority,code,text,evidence});
  if(h?.status==="BLOCKER")push("P0","HUMAN_BLOCKER","Resolver el blocker de ejecución antes de estética o dificultad.",h.flags.join(", ")||"Audit 2.1 BLOCKER");
  const sealed=g.deadGaps.filter(x=>x.kind==="SEALED"),tight=g.deadGaps.filter(x=>x.kind==="TIGHT");
  if(sealed.length)push("P1","DEAD_GAP","Cerrar visualmente o ensanchar estos huecos: si parece un paso, la bola debe caber con margen.",sealed.slice(0,4).map(x=>`${x.between} ${x.clearance}px`).join("; "));
  if(tight.length>=2)push("P2","TIGHT_GAPS","Revisar pasos casi transitables y hacer inequívoca su lectura.",tight.slice(0,4).map(x=>`${x.between} ${x.clearance}px`).join("; "));
  if(g.rectDominance>=.86&&g.shapeCount>=3)push("P1","RECT_DOMINANCE","Romper la gramática de cajas con diagonal, triángulo, curva o forma circular cuando cambie la lectura/rebote.",`${Math.round(g.rectDominance*100)}% rectángulos`);
  if(g.silhouette==="SHELVES"&&r.sideChanges>=2)push("P1","SHELF_GRAMMAR","Evitar otra secuencia de estanterías alternas; conservar mecánica y cambiar silueta/pregunta espacial.",`${Math.round(g.horizontalWallRatio*100)}% horizontales · ${r.sideChanges} cambios de lado`);
  if(r.axisRatio>=.8&&r.segments>=3)push("P2","AXIS_ROUTE","Valorar una decisión diagonal/curva para evitar sensación de plantilla ortogonal.",`${Math.round(r.axisRatio*100)}% de ruta alineada a ejes`);
  if(recent&&recent.score>=.76)push("P1","PERCEPTUAL_REPEAT","Diferenciar este hoyo de vecinos por silueta, escala o ruta; mover paredes no basta.",`${recent.id} similarity=${recent.score}`);
  if(g.offRouteObjects.length)push("P2","OFF_ROUTE_OBJECT","Revisar si estas piezas hacen anti-cheese, lectura o recuperación. Si no, eliminarlas.",g.offRouteObjects.slice(0,5).join(", "));
  if(h?.mechanicRelevant===false)push("P1","MECHANIC_DECORATIVE","La mecánica principal debe afectar una ruta competitiva, no ser decoración evitable.",String(level.primaryMechanic??"unknown"));
  if((h?.routeFamilies??2)<=1&&!level.onboarding)push("P1","SINGLE_ROUTE","Crear otra familia de ejecución o elección riesgo/recompensa.",`${h?.routeFamilies??0} familia(s)`);
  const touch=profile(h,"touch")?.successRate??1;if(touch<.45)push("P1","LOW_TOUCH_MARGIN","Aumentar zona de aterrizaje o anchura; añadir decisiones antes que precisión obligatoria.",`touch=${pct(touch)} tolerance=${pct(h?.minShotTolerance??null)}`);
  if((h?.recovery.recoverableRate??1)<.78)push("P1","POOR_RECOVERY","Hacer que un tiro mediocre cueste golpes, no una run muerta.",`recovery=${pct(h?.recovery.recoverableRate??null)}`);
  if(level.threeStar.maxStrokes!==undefined&&h?.humanStrokes!==null&&h?.humanStrokes!==undefined&&Math.abs(level.threeStar.maxStrokes-h.humanStrokes)>=2)push("P1","OBJECTIVE_MISMATCH","Calibrar 3★ con la ruta humana; trickshots expertos pueden existir aparte.",`target=${level.threeStar.maxStrokes} human=${h.humanStrokes}`);
  if(g.scaleClass==="DENSE"&&g.openSpace<.82)push("P2","DENSITY","Reducir piezas o abrir respiración; más obstáculos no equivale a más diseño.",`open=${Math.round(g.openSpace*100)}% shapes=${g.shapeCount}`);
  if(fb&&(fb.avgOriginality??5)<=2.5)push("P1","HUMAN_ORIGINALITY_LOW","Cambiar silueta o pregunta estratégica: humanos perciben repetición.",`originality=${fb.avgOriginality?.toFixed(1)} n=${fb.sampleSize}`);
  if(fb&&(fb.avgFun??5)<=2.5&&(fb.avgDifficulty??3)<=3)push("P1","HUMAN_FUN_LOW","La dificultad no explica la nota baja; rediseñar decisión, ritmo o identidad antes de endurecer.",`fun=${fb.avgFun?.toFixed(1)} difficulty=${fb.avgDifficulty?.toFixed(1)} n=${fb.sampleSize}`);
  if(!out.length)push("P2","KEEP_CORE","No hay deuda clara. Mantener la pregunta central y validar con humanos.",`overall=${s.overall}`);
  const order:Record<Priority,number>={P0:0,P1:1,P2:2};return out.sort((a,b)=>order[a.priority]-order[b.priority]);
}

const computed=new Map<string,{g:GeometryMetrics;r:RouteMetrics}>();for(const level of levels)computed.set(level.id,{g:geometry(level),r:routeMetrics(level)});
const rows:Audit3Row[]=[];
for(const level of levels){
  const {g,r}=computed.get(level.id)!,h=humanById.get(level.id)??null,fb=feedbackById.get(level.id)??null,peers=levels.filter(x=>x.mode===level.mode&&x.id!==level.id);
  const hits=peers.map(p=>{const m=computed.get(p.id)!;return compare(level,g,r,p,m.g,m.r);}).sort((a,b)=>b.score-a.score),nearest=hits[0]??null,recent=hits.filter(x=>x.distance<=3).sort((a,b)=>b.score-a.score)[0]??null,s=scores(level,g,r,h,recent),tips=advice(level,g,r,h,recent,s,fb);
  const flags:string[]=[];if(g.deadGaps.some(x=>x.kind==="SEALED"))flags.push("DEAD_GAP");if(g.rectDominance>=.86&&g.shapeCount>=3)flags.push("RECT_DOMINANCE");if(g.silhouette==="SHELVES"&&r.sideChanges>=2)flags.push("SHELF_GRAMMAR");if(recent&&recent.score>=.76)flags.push(`REPEAT:${recent.id}`);if(g.offRouteObjects.length)flags.push("OFF_ROUTE_OBJECTS");if(h?.mechanicRelevant===false)flags.push("MECHANIC_RELEVANCE_LOW");
  const status:AuditStatus=h?.status==="BLOCKER"?"BLOCKER":s.overall<58||flags.includes("MECHANIC_RELEVANCE_LOW")?"REVIEW":"PASS";
  let disposition:Disposition=status==="BLOCKER"||s.overall<55?"REDESIGN":s.overall<77||flags.length?"CLEANUP":"KEEP";if(level.onboarding&&disposition==="REDESIGN")disposition="CLEANUP";
  rows.push({id:level.id,mode:level.mode,index:levelIndex(level),group:level.group,primaryMechanic:level.primaryMechanic??null,disposition,status,geometry:g,route:r,scores:s,nearest,nearestRecent:recent,human:{strokes:h?.humanStrokes??null,best:h?.learnedStrokes??null,target:level.threeStar.maxStrokes??null,touch:profile(h,"touch")?.successRate??null,casual:profile(h,"casual")?.successRate??null,tolerance:h?.minShotTolerance??null,recovery:h?.recovery.recoverableRate??null,families:h?.routeFamilies??null,status:h?.status??null,flags:h?.flags??[]},feedback:fb,flags,advice:tips});
}
function runs(modeRows:Audit3Row[],pick:(r:Audit3Row)=>string,min:number):CampaignRun[]{const out:CampaignRun[]=[];let start=0;while(start<modeRows.length){const value=pick(modeRows[start]!),first=start;let end=start+1;while(end<modeRows.length&&pick(modeRows[end]!)===value)end++;if(end-start>=min)out.push({from:modeRows[first]!.id,to:modeRows[end-1]!.id,length:end-start,value});start=end;}return out;}
function counts(items:string[]):Record<string,number>{const out:Record<string,number>={};for(const x of items)out[x]=(out[x]??0)+1;return out;}
function campaign(mode:string):CampaignSummary {
  const rs=rows.filter(x=>x.mode===mode).sort((a,b)=>a.index-b.index),dispositions:Record<Disposition,number>={KEEP:0,CLEANUP:0,REDESIGN:0};for(const r of rs)dispositions[r.disposition]++;
  const repeatedSilhouetteRuns=runs(rs,x=>x.geometry.silhouette,3),repeatedScaleRuns=runs(rs,x=>x.geometry.scaleClass,4),rectDominantLevels=rs.filter(x=>x.geometry.rectDominance>=.86&&x.geometry.shapeCount>=3).length,nonRectLevels=rs.filter(x=>x.geometry.nonRectRatio>=.18).length,recommendations:string[]=[];
  if(rectDominantLevels/Math.max(1,rs.length)>.5)recommendations.push(`Demasiados hoyos rectangulares (${rectDominantLevels}/${rs.length}). Próximos batches: al menos 2 de cada 3 con silueta no basada solo en rectángulos.`);
  if(repeatedSilhouetteRuns.length)recommendations.push(`Romper rachas de silueta: ${repeatedSilhouetteRuns.map(x=>`${x.from}–${x.to} ${x.value}`).join(", ")}.`);
  if(repeatedScaleRuns.length)recommendations.push(`Variar escala aparente: ${repeatedScaleRuns.map(x=>`${x.from}–${x.to} ${x.value}`).join(", ")}.`);
  if(rs.some(x=>x.geometry.deadGaps.some(g=>g.kind==="SEALED")))recommendations.push("Regla visual: hueco aparentemente jugable ≥34px; si no, cerrarlo claramente.");
  recommendations.push("Cada hoyo debe poder resumirse por una frase espacial antes de hablar de mecánica: isla, V, embudo, anillo, campo abierto, diagonal…");
  recommendations.push("3★ sigue la ruta humana; un trickshot estrecho del solver puede quedarse como mastery line.");
  const topRedesign=[...rs].sort((a,b)=>a.scores.overall-b.scores.overall||b.flags.length-a.flags.length).slice(0,Math.min(6,rs.length)).map(x=>`${x.id}:${x.disposition}:${x.scores.overall}`);
  return{mode,levels:rs.length,averageOverall:round(rs.reduce((s,x)=>s+x.scores.overall,0)/Math.max(1,rs.length)),averageVariety:round(rs.reduce((s,x)=>s+x.scores.variety,0)/Math.max(1,rs.length)),rectDominantLevels,nonRectLevels,dispositions,silhouettes:counts(rs.map(x=>x.geometry.silhouette)),scales:counts(rs.map(x=>x.geometry.scaleClass)),repeatedSilhouetteRuns,repeatedScaleRuns,topRedesign,recommendations};
}

const campaigns=[campaign("classic"),campaign("troll")];
const summary={total:rows.length,keep:rows.filter(x=>x.disposition==="KEEP").length,cleanup:rows.filter(x=>x.disposition==="CLEANUP").length,redesign:rows.filter(x=>x.disposition==="REDESIGN").length,blockers:rows.filter(x=>x.status==="BLOCKER").length,averageOverall:round(rows.reduce((s,x)=>s+x.scores.overall,0)/Math.max(1,rows.length))};
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/audit3-report.json",JSON.stringify({generatedAt:new Date().toISOString(),version:"3.0",humanModel:humanReport?.version??null,humanMode:humanReport?.mode??null,summary,campaigns,rows},null,2));
const md:string[]=["# Hole in What? · Audit 3.0 — Map Design","",`Summary: **${summary.keep} KEEP · ${summary.cleanup} CLEANUP · ${summary.redesign} REDESIGN · ${summary.blockers} BLOCKER**`,`Average design score: **${summary.averageOverall}/100**`,`Human layer: **${humanReport?`${humanReport.version??"2.x"} / ${humanReport.mode}`:"missing — structural-only fallback"}**`,"","> Evidence-driven design advisor. Scores guide review; they do not replace human playtests.",""];
for(const c of campaigns){md.push(`## ${c.mode.toUpperCase()} campaign`,`Average: **${c.averageOverall}/100** · Variety: **${c.averageVariety}/100** · Rect-dominant: **${c.rectDominantLevels}/${c.levels}** · Non-rect: **${c.nonRectLevels}/${c.levels}**`,`Silhouettes: ${Object.entries(c.silhouettes).map(([k,v])=>`${k} ${v}`).join(" · ")}`,`Scales: ${Object.entries(c.scales).map(([k,v])=>`${k} ${v}`).join(" · ")}`,`Priority review: ${c.topRedesign.join(" · ")}`,"",...c.recommendations.map(x=>`- ${x}`),"");}
md.push("## Level matrix","","| Hole | Action | Score | Variety | Silhouette | Scale | Rect | Open | Route | Human | Recent repeat | Flags |","|---|---|---:|---:|---|---|---:|---:|---|---|---|---|");
for(const r of rows)md.push(`| ${r.id} | **${r.disposition}** | ${r.scores.overall} | ${r.scores.variety} | ${r.geometry.silhouette} | ${r.geometry.scaleClass} | ${Math.round(r.geometry.rectDominance*100)}% | ${Math.round(r.geometry.openSpace*100)}% | ${r.route.segments}s/${r.route.turns}t/${Math.round(r.route.diagonalRatio*100)}% diag | ${r.human.strokes??"?"} strokes · ${pct(r.human.touch)} touch | ${r.nearestRecent?`${r.nearestRecent.id} ${r.nearestRecent.score}`:"—"} | ${r.flags.join(", ")||"—"} |`);
md.push("","## Designer briefs","");
for(const r of rows)md.push(`### ${r.id} · ${r.disposition} · ${r.scores.overall}/100`,`**Core:** ${r.geometry.silhouette} / ${r.geometry.scaleClass} · mechanic=${r.primaryMechanic??"none"} · rect=${Math.round(r.geometry.rectDominance*100)}% · open=${Math.round(r.geometry.openSpace*100)}% · detour=${r.route.detour}× · route families=${r.human.families??"?"}`,`**Scores:** clarity ${r.scores.clarity} · flow ${r.scores.flow} · variety ${r.scores.variety} · composition ${r.scores.composition} · mechanic ${r.scores.mechanic} · goals ${r.scores.goals}`,...r.advice.map(a=>`- **${a.priority} ${a.code}:** ${a.text} _(${a.evidence})_`),"");
writeFileSync("artifacts/audit3-report.md",md.join("\n"));
console.log("\n=== AUDIT 3.0 MAP DESIGN ===");for(const c of campaigns)console.log(`${c.mode.toUpperCase()}: avg=${c.averageOverall} variety=${c.averageVariety} KEEP=${c.dispositions.KEEP} CLEANUP=${c.dispositions.CLEANUP} REDESIGN=${c.dispositions.REDESIGN}`);console.log(`TOTAL: ${summary.keep} KEEP · ${summary.cleanup} CLEANUP · ${summary.redesign} REDESIGN · ${summary.blockers} BLOCKER`);console.log("Reports: artifacts/audit3-report.json + artifacts/audit3-report.md");
if(process.env.AUDIT3_STRICT==="1"&&summary.blockers>0)process.exitCode=1;
