import { levelsForMode } from "../src/data/campaign";
import type { CurveDef, LevelDefinition, TriangleDef, Vec2 } from "../src/types";

const FIELD={left:28,right:512,top:28,bottom:932};
const COLS=18,ROWS=30;

function pointInTriangle(p:Vec2,t:TriangleDef):boolean{
  const sign=(p1:Vec2,p2:Vec2,p3:Vec2)=>(p1.x-p3.x)*(p2.y-p3.y)-(p2.x-p3.x)*(p1.y-p3.y);
  const d1=sign(p,t.a,t.b),d2=sign(p,t.b,t.c),d3=sign(p,t.c,t.a);
  const neg=d1<0||d2<0||d3<0,pos=d1>0||d2>0||d3>0;
  return !(neg&&pos);
}
function normAngle(a:number):number{const tau=Math.PI*2;return((a%tau)+tau)%tau;}
function inArc(a:number,c:CurveDef):boolean{
  const x=normAngle(a),s=normAngle(c.startAngle),e=normAngle(c.endAngle);
  return s<=e?x>=s&&x<=e:x>=s||x<=e;
}
function structuralAt(level:LevelDefinition,p:Vec2):boolean{
  if((level.walls??[]).some(w=>p.x>=w.x&&p.x<=w.x+w.w&&p.y>=w.y&&p.y<=w.y+w.h))return true;
  if((level.voids??[]).some(w=>p.x>=w.x&&p.x<=w.x+w.w&&p.y>=w.y&&p.y<=w.y+w.h))return true;
  if((level.triangles??[]).some(t=>pointInTriangle(p,t)))return true;
  if((level.curves??[]).some(c=>{
    const dx=p.x-c.x,dy=p.y-c.y,d=Math.hypot(dx,dy),half=(c.thickness??22)/2+6;
    return Math.abs(d-c.r)<=half&&inArc(Math.atan2(dy,dx),c);
  }))return true;
  return false;
}
function raster(level:LevelDefinition,mirror=false):Set<number>{
  const out=new Set<number>();
  for(let y=0;y<ROWS;y+=1)for(let x=0;x<COLS;x+=1){
    let px=FIELD.left+(x+.5)*(FIELD.right-FIELD.left)/COLS;
    const py=FIELD.top+(y+.5)*(FIELD.bottom-FIELD.top)/ROWS;
    if(mirror)px=FIELD.left+FIELD.right-px;
    if(structuralAt(level,{x:px,y:py}))out.add(y*COLS+x);
  }
  return out;
}
function jaccard(a:Set<number>,b:Set<number>):number{
  if(a.size===0||b.size===0)return 0;
  let inter=0;for(const x of a)if(b.has(x))inter+=1;
  return inter/(a.size+b.size-inter);
}
function endpointSimilarity(a:LevelDefinition,b:LevelDefinition,mirror=false):number{
  const mx=(x:number)=>mirror?FIELD.left+FIELD.right-x:x;
  const diag=Math.hypot(FIELD.right-FIELD.left,FIELD.bottom-FIELD.top);
  const bd=Math.hypot(a.ball.x-mx(b.ball.x),a.ball.y-b.ball.y)/diag;
  const hd=Math.hypot(a.hole.x-mx(b.hole.x),a.hole.y-b.hole.y)/diag;
  return Math.max(0,1-(bd+hd)*1.8);
}
interface Pair{a:string;b:string;geometry:number;endpoint:number;score:number;mirrored:boolean;fatal:boolean;}
function compare(a:LevelDefinition,b:LevelDefinition):Pair{
  const ar=raster(a,false),br=raster(b,false),bm=raster(b,true);
  const directG=jaccard(ar,br),mirrorG=jaccard(ar,bm);
  const directE=endpointSimilarity(a,b,false),mirrorE=endpointSimilarity(a,b,true);
  const direct=directG*.86+directE*.14,mirrored=mirrorG*.86+mirrorE*.14;
  const useMirror=mirrored>direct,geometry=useMirror?mirrorG:directG,endpoint=useMirror?mirrorE:directE,score=Math.max(direct,mirrored);
  const aIndex=Number(a.id.split("-").at(-1)),bIndex=Number(b.id.split("-").at(-1));
  const inSlice=a.mode==="classic"?aIndex<=15&&bIndex<=15:aIndex<=5&&bIndex<=5;
  const fatal=inSlice&&geometry>=.90&&endpoint>=.68;
  return{a:a.id,b:b.id,geometry,endpoint,score,mirrored:useMirror,fatal};
}

const pairs:Pair[]=[];
for(const mode of["classic","troll"]as const){
  const levels=levelsForMode(mode);
  for(let i=0;i<levels.length;i+=1)for(let j=i+1;j<levels.length;j+=1)pairs.push(compare(levels[i]!,levels[j]!));
}
const suspicious=pairs.filter(p=>p.geometry>=.80&&p.endpoint>=.52).sort((a,b)=>b.score-a.score);
console.log("\n=== COURSE ORIGINALITY ===");
for(const p of suspicious.slice(0,30))console.log(`${p.fatal?"FATAL":"WARN "} ${p.a} ~ ${p.b} geometry=${p.geometry.toFixed(2)} endpoints=${p.endpoint.toFixed(2)} score=${p.score.toFixed(2)}${p.mirrored?" mirrored":""}`);
console.log(`\n${suspicious.length} structurally similar pairs flagged; ${suspicious.filter(p=>p.fatal).length} fatal inside vertical slice.`);
const fatal=suspicious.filter(p=>p.fatal);
if(fatal.length){console.error(`ORIGINALITY_FATAL: ${fatal.map(p=>`${p.a}/${p.b}`).join(", ")}`);process.exitCode=1;}
