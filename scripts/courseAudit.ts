import { buildCampaignCourse } from "../src/data/procedural/campaignGenerator";
import { sanitizeCourse } from "../src/data/procedural/courseUtils";
import type {
  CurveDef,
  LevelDefinition,
  MovingBumperDef,
  MovingWallDef,
  RectDef,
  TriangleDef,
  Vec2
} from "../src/types";

const DT = 1 / 60;
const FIELD = { x: 28, y: 28, w: 484, h: 904 };
const BALL_R = 13;
const MAX_SPEED = 172 * 7.4;
const BASE_FRICTION = 0.9875;
const ICE_FRICTION = 0.9982;
const SAND_FRICTION = 0.955;
const AIR_FRICTION = 0.9995;
const WALL_BOUNCE = 0.90;
const CURVE_BOUNCE = 0.92;
const MOVING_WALL_BOUNCE = 0.94;
const STOP_SPEED = 18;
const SINK_SPEED = 430;
const BOOST_FORCE = 650;
const GRAVITY = 980;
const SOFT_SPEED = 1220;
const HARD_SPEED = 1360;
const MAX_VERTICAL_SPEED = 475;

interface TrapState { active: boolean; anim: number; }
interface SimState {
  x: number; y: number; vx: number; vy: number; z: number; vz: number;
  time: number;
  portalCooldown: number;
  bumperCooldown: number;
  launchCooldown: number;
  popWalls: TrapState[];
  popBumpers: TrapState[];
  popVoids: TrapState[];
}
interface Shot { angle: number; power: number; }
interface SearchNode { state: SimState; strokes: number; shots: Shot[]; score: number; }
interface SolvedRun { strokes: number; time: number; shots: Shot[]; }
interface AuditRow {
  id: string;
  target: number;
  targetTime: number | null;
  bestStrokes: number | null;
  bestTime: number | null;
  status: string;
  routeRatio: number;
  mechanics: number;
  walls: number;
}

const clamp = (v:number,min:number,max:number):number => Math.max(min,Math.min(max,v));
const dist = (a:{x:number;y:number},b:{x:number;y:number}):number => Math.hypot(a.x-b.x,a.y-b.y);
const pointInRect = (p:{x:number;y:number},r:RectDef):boolean => p.x>r.x&&p.x<r.x+r.w&&p.y>r.y&&p.y<r.y+r.h;
const cloneState = (s:SimState):SimState => ({...s,popWalls:s.popWalls.map(x=>({...x})),popBumpers:s.popBumpers.map(x=>({...x})),popVoids:s.popVoids.map(x=>({...x}))});
const grounded = (s:SimState):boolean => s.z<=0.5&&s.vz<=0.5;

function initialState(level:LevelDefinition):SimState {
  return {
    x:level.ball.x,y:level.ball.y,vx:0,vy:0,z:0,vz:0,time:0,
    portalCooldown:0,bumperCooldown:0,launchCooldown:0,
    popWalls:(level.popWalls??[]).map(()=>({active:false,anim:0})),
    popBumpers:(level.popBumpers??[]).map(()=>({active:false,anim:0})),
    popVoids:(level.popVoids??[]).map(()=>({active:false,anim:0}))
  };
}

function updateTraps(level:LevelDefinition,s:SimState):void {
  for(let i=0;i<(level.popWalls??[]).length;i+=1){
    const def=level.popWalls![i]!; const rt=s.popWalls[i]!;
    if(!rt.active&&Math.hypot(s.x-def.triggerX,s.y-def.triggerY)<def.triggerRadius) rt.active=true;
    if(rt.active) rt.anim=Math.min(1,rt.anim+DT*7);
  }
  for(let i=0;i<(level.popBumpers??[]).length;i+=1){
    const def=level.popBumpers![i]!; const rt=s.popBumpers[i]!;
    if(!rt.active&&Math.hypot(s.x-def.triggerX,s.y-def.triggerY)<def.triggerRadius) rt.active=true;
    if(rt.active) rt.anim=Math.min(1,rt.anim+DT*7);
  }
  for(let i=0;i<(level.popVoids??[]).length;i+=1){
    const def=level.popVoids![i]!; const rt=s.popVoids[i]!;
    if(!rt.active&&Math.hypot(s.x-def.triggerX,s.y-def.triggerY)<def.triggerRadius) rt.active=true;
    if(rt.active) rt.anim=Math.min(1,rt.anim+DT*6.5);
  }
}

function resolveBounds(s:SimState):void {
  const left=FIELD.x+BALL_R,right=FIELD.x+FIELD.w-BALL_R,top=FIELD.y+BALL_R,bottom=FIELD.y+FIELD.h-BALL_R;
  if(s.x<left){s.x=left;s.vx=Math.abs(s.vx)*WALL_BOUNCE;}
  if(s.x>right){s.x=right;s.vx=-Math.abs(s.vx)*WALL_BOUNCE;}
  if(s.y<top){s.y=top;s.vy=Math.abs(s.vy)*WALL_BOUNCE;}
  if(s.y>bottom){s.y=bottom;s.vy=-Math.abs(s.vy)*WALL_BOUNCE;}
}

function resolveWall(s:SimState,rect:RectDef,bounce=WALL_BOUNCE):void {
  const cx=clamp(s.x,rect.x,rect.x+rect.w),cy=clamp(s.y,rect.y,rect.y+rect.h);
  if(Math.hypot(s.x-cx,s.y-cy)>=BALL_R) return;
  const left=Math.abs((s.x+BALL_R)-rect.x),right=Math.abs((rect.x+rect.w)-(s.x-BALL_R));
  const top=Math.abs((s.y+BALL_R)-rect.y),bottom=Math.abs((rect.y+rect.h)-(s.y-BALL_R));
  const min=Math.min(left,right,top,bottom);
  if(min===left){s.x=rect.x-BALL_R;s.vx=-Math.abs(s.vx)*bounce;}
  else if(min===right){s.x=rect.x+rect.w+BALL_R;s.vx=Math.abs(s.vx)*bounce;}
  else if(min===top){s.y=rect.y-BALL_R;s.vy=-Math.abs(s.vy)*bounce;}
  else{s.y=rect.y+rect.h+BALL_R;s.vy=Math.abs(s.vy)*bounce;}
}

function pointInTriangle(p:Vec2,t:TriangleDef):boolean {
  const sign=(p1:Vec2,p2:Vec2,p3:Vec2)=>(p1.x-p3.x)*(p2.y-p3.y)-(p2.x-p3.x)*(p1.y-p3.y);
  const d1=sign(p,t.a,t.b),d2=sign(p,t.b,t.c),d3=sign(p,t.c,t.a);
  return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0));
}
function closestSegment(p:Vec2,a:Vec2,b:Vec2):Vec2 {
  const abx=b.x-a.x,aby=b.y-a.y,d=abx*abx+aby*aby||1;
  const q=clamp(((p.x-a.x)*abx+(p.y-a.y)*aby)/d,0,1);
  return {x:a.x+abx*q,y:a.y+aby*q};
}
function resolveTriangle(s:SimState,t:TriangleDef):void {
  const p={x:s.x,y:s.y},inside=pointInTriangle(p,t),edges:[[Vec2,Vec2],[Vec2,Vec2],[Vec2,Vec2]]=[[t.a,t.b],[t.b,t.c],[t.c,t.a]];
  let closest={x:0,y:0},ea=t.a,eb=t.b,best=Infinity;
  for(const [a,b] of edges){const q=closestSegment(p,a,b),d2=(p.x-q.x)**2+(p.y-q.y)**2;if(d2<best){best=d2;closest=q;ea=a;eb=b;}}
  const d=Math.sqrt(best); if(!inside&&d>=BALL_R) return;
  let nx:number,ny:number;
  if(d>1e-4){nx=(p.x-closest.x)/d;ny=(p.y-closest.y)/d;if(inside){nx*=-1;ny*=-1;}}
  else{const ex=eb.x-ea.x,ey=eb.y-ea.y,len=Math.hypot(ex,ey)||1;nx=-ey/len;ny=ex/len;const c={x:(t.a.x+t.b.x+t.c.x)/3,y:(t.a.y+t.b.y+t.c.y)/3};if((c.x-closest.x)*nx+(c.y-closest.y)*ny>0){nx*=-1;ny*=-1;}}
  s.x=closest.x+nx*(BALL_R+0.5);s.y=closest.y+ny*(BALL_R+0.5);
  const dot=s.vx*nx+s.vy*ny;if(dot<0){s.vx-=(1+WALL_BOUNCE)*dot*nx;s.vy-=(1+WALL_BOUNCE)*dot*ny;}
}

function resolveBumper(s:SimState,x:number,y:number,r:number,mult:number):boolean {
  const d=Math.hypot(s.x-x,s.y-y); if(d>=BALL_R+r) return false;
  const nx=(s.x-x)/(d||1),ny=(s.y-y)/(d||1);s.x=x+nx*(BALL_R+r+1);s.y=y+ny*(BALL_R+r+1);
  const dot=s.vx*nx+s.vy*ny;s.vx=(s.vx-2*dot*nx)*mult;s.vy=(s.vy-2*dot*ny)*mult;return true;
}

function normalizeAngle(a:number):number {const p=Math.PI*2;return ((a%p)+p)%p;}
function angleInArc(a:number,start:number,end:number):boolean {a=normalizeAngle(a);start=normalizeAngle(start);end=normalizeAngle(end);return start<=end?a>=start&&a<=end:a>=start||a<=end;}
function resolveCurve(s:SimState,c:CurveDef):void {
  const dx=s.x-c.x,dy=s.y-c.y,d=Math.hypot(dx,dy)||0.001,a=normalizeAngle(Math.atan2(dy,dx));if(!angleInArc(a,c.startAngle,c.endAngle)) return;
  const half=(c.thickness??22)/2+BALL_R,delta=d-c.r;if(Math.abs(delta)>=half) return;
  const bx=dx/d,by=dy/d,side=delta>=0?1:-1,nx=bx*side,ny=by*side,target=c.r+side*(half+0.7);
  s.x=c.x+bx*target;s.y=c.y+by*target;const dot=s.vx*nx+s.vy*ny;if(dot<0){s.vx-=(1+CURVE_BOUNCE)*dot*nx;s.vy-=(1+CURVE_BOUNCE)*dot*ny;}
}

function movingWallRect(w:MovingWallDef,t:number):RectDef {const q=Math.sin(t*(w.speed??1.15)+(w.phase??0))*w.amplitude;return{x:w.x+(w.axis==="x"?q:0),y:w.y+(w.axis==="y"?q:0),w:w.w,h:w.h};}
function movingBumperPoint(b:MovingBumperDef,t:number):Vec2 {const q=Math.sin(t*(b.speed??1.3)+(b.phase??0))*b.amplitude;return{x:b.x+(b.axis==="x"?q:0),y:b.y+(b.axis==="y"?q:0)};}
function movingVelocity(amplitude:number,speed:number,phase:number,t:number):number {return Math.cos(t*speed+phase)*amplitude*speed;}

function tryLaunch(level:LevelDefinition,s:SimState):void {
  if(s.launchCooldown>0||!grounded(s)) return;
  const speed=Math.hypot(s.vx,s.vy);
  if(speed>=120){
    for(const ramp of level.ramps??[]){
      if(!pointInRect(s,ramp)) continue;const len=Math.hypot(ramp.dx,ramp.dy)||1,dx=ramp.dx/len,dy=ramp.dy/len;
      if((s.vx*dx+s.vy*dy)/speed<0.18) continue;s.vz=ramp.lift??450;s.vx+=dx*(ramp.boost??110);s.vy+=dy*(ramp.boost??110);s.launchCooldown=0.48;return;
    }
  }
  for(const tr of level.trampolines??[]){if(Math.hypot(s.x-tr.x,s.y-tr.y)<=tr.r+BALL_R*0.45){s.vz=tr.power??565;s.vx*=1.045;s.vy*=1.045;s.launchCooldown=0.52;return;}}
}

function activeVoid(level:LevelDefinition,s:SimState):boolean {
  if((level.voids??[]).some(v=>pointInRect(s,v))) return true;
  for(let i=0;i<(level.popVoids??[]).length;i+=1){if(s.popVoids[i]!.active&&s.popVoids[i]!.anim>0.56&&pointInRect(s,level.popVoids![i]!)) return true;}
  return false;
}

function customMechanics(level:LevelDefinition,s:SimState):void {
  for(const f of [...(level.fans??[]),...(level.winds??[])]){
    if(!pointInRect(s,f)) continue;const len=Math.hypot(f.dx,f.dy)||1,k=(f.strength??300)*(s.z>0.5?0.82:1)*DT;s.vx+=f.dx/len*k;s.vy+=f.dy/len*k;
  }
  if(grounded(s)){
    for(const c of level.curves??[]) resolveCurve(s,c);
    for(const w of level.movingWalls??[]){const rect=movingWallRect(w,s.time),vel=movingVelocity(w.amplitude,w.speed??1.15,w.phase??0,s.time);const bx=s.x,by=s.y;resolveWall(s,rect,MOVING_WALL_BOUNCE);if(s.x!==bx||s.y!==by){if(w.axis==="x")s.vx+=vel*0.34;else s.vy+=vel*0.34;}}
    for(const b of level.movingBumpers??[]){const p=movingBumperPoint(b,s.time),vel=movingVelocity(b.amplitude,b.speed??1.3,b.phase??0,s.time);if(resolveBumper(s,p.x,p.y,b.r,1.26)){if(b.axis==="x")s.vx+=vel*0.28;else s.vy+=vel*0.28;}}
  }
  if(s.bumperCooldown<=0&&grounded(s)){
    for(const b of level.bumpers??[]){if(Math.hypot(s.x-b.x,s.y-b.y)<=b.r+BALL_R+3&&Math.hypot(s.vx,s.vy)>=25){s.vx*=1.14;s.vy*=1.14;s.bumperCooldown=0.11;break;}}
  }
  if(s.portalCooldown<=0){
    for(const pair of level.portals??[]){
      const endpoints:[[typeof pair.a,typeof pair.b],[typeof pair.a,typeof pair.b]]=[[pair.a,pair.b],[pair.b,pair.a]];
      let teleported=false;
      for(const [from,to] of endpoints){
        if(Math.hypot(s.x-from.x,s.y-from.y)>(from.r??28)+BALL_R*0.2) continue;
        const speed=Math.hypot(s.vx,s.vy);let dx=speed>1?s.vx/speed:to.x-from.x,dy=speed>1?s.vy/speed:to.y-from.y;const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
        const exit=(to.r??28)+BALL_R+5;s.x=to.x+dx*exit;s.y=to.y+dy*exit;s.portalCooldown=0.38;teleported=true;break;
      }
      if(teleported) break;
    }
  }
  const speed=Math.hypot(s.vx,s.vy);if(speed>SOFT_SPEED){const excess=speed-SOFT_SPEED,target=Math.min(HARD_SPEED,SOFT_SPEED+excess*0.32),scale=target/speed;s.vx*=scale;s.vy*=scale;}
  if(Math.abs(s.vz)>MAX_VERTICAL_SPEED)s.vz=Math.sign(s.vz)*MAX_VERTICAL_SPEED;
}

function simulateShot(level:LevelDefinition,start:SimState,shot:Shot):{state:SimState;sunk:boolean;voided:boolean}|null {
  const s=cloneState(start);const origin={x:s.x,y:s.y};
  const speed=MAX_SPEED*clamp(shot.power,0.08,1);s.vx=Math.cos(shot.angle)*speed;s.vy=Math.sin(shot.angle)*speed;
  for(let frame=0;frame<600;frame+=1){
    s.time+=DT;s.portalCooldown=Math.max(0,s.portalCooldown-DT);s.bumperCooldown=Math.max(0,s.bumperCooldown-DT);s.launchCooldown=Math.max(0,s.launchCooldown-DT);updateTraps(level,s);
    tryLaunch(level,s);
    const air=!grounded(s),onSand=!air&&(level.sand??[]).some(r=>pointInRect(s,r)),onIce=!air&&(level.ice??[]).some(r=>pointInRect(s,r));
    const friction=air?AIR_FRICTION:onSand?SAND_FRICTION:onIce?ICE_FRICTION:BASE_FRICTION;
    if(!air){for(const b of level.boosters??[]){if(pointInRect(s,b)){const len=Math.hypot(b.dx,b.dy)||1,k=BOOST_FORCE*(b.power??1)*DT;s.vx+=b.dx/len*k;s.vy+=b.dy/len*k;}}}
    s.x+=s.vx*DT;s.y+=s.vy*DT;const damping=Math.pow(friction,DT*60);s.vx*=damping;s.vy*=damping;
    if(air){s.z+=s.vz*DT;s.vz-=GRAVITY*DT;if(s.z<=0&&s.vz<0){s.z=0;s.vz=0;}}
    resolveBounds(s);
    if(grounded(s)){
      for(const w of level.walls??[])resolveWall(s,w);
      for(const t of level.triangles??[])resolveTriangle(s,t);
      for(let i=0;i<(level.popWalls??[]).length;i+=1){if(s.popWalls[i]!.active&&s.popWalls[i]!.anim>0.25)resolveWall(s,level.popWalls![i]!);}
      for(const b of level.bumpers??[])resolveBumper(s,b.x,b.y,b.r,1.07);
      for(let i=0;i<(level.popBumpers??[]).length;i+=1){if(s.popBumpers[i]!.active&&s.popBumpers[i]!.anim>0.25)resolveBumper(s,level.popBumpers![i]!.x,level.popBumpers![i]!.y,level.popBumpers![i]!.r,1.09);}
      if(activeVoid(level,s)){s.x=origin.x;s.y=origin.y;s.vx=s.vy=s.vz=s.z=0;s.time+=0.38;return{state:s,sunk:false,voided:true};}
    }
    const v=Math.hypot(s.vx,s.vy),hd=Math.hypot(s.x-level.hole.x,s.y-level.hole.y);
    if(grounded(s)&&hd<23&&v<SINK_SPEED){s.vx=s.vy=0;return{state:s,sunk:true,voided:false};}
    if(grounded(s)&&v<STOP_SPEED){s.vx=s.vy=0;return{state:s,sunk:false,voided:false};}
    customMechanics(level,s);
  }
  return null;
}

function pathProjection(level:LevelDefinition,p:Vec2):number {
  const pts=level.designPath?.length?level.designPath:[level.ball,level.hole];let total=0;const lens:number[]=[];
  for(let i=0;i<pts.length-1;i+=1){const l=dist(pts[i]!,pts[i+1]!);lens.push(l);total+=l;}
  let traversed=0,bestD=Infinity,bestF=0;
  for(let i=0;i<lens.length;i+=1){const a=pts[i]!,b=pts[i+1]!,abx=b.x-a.x,aby=b.y-a.y,d=abx*abx+aby*aby||1,q=clamp(((p.x-a.x)*abx+(p.y-a.y)*aby)/d,0,1),x=a.x+abx*q,y=a.y+aby*q,dd=Math.hypot(p.x-x,p.y-y);if(dd<bestD){bestD=dd;bestF=(traversed+lens[i]!*q)/(total||1);}traversed+=lens[i]!;}
  return bestF;
}

function targetsFor(level:LevelDefinition,s:SimState):Vec2[] {
  const pts=level.designPath?.length?level.designPath:[level.ball,level.hole];
  const candidates:[number,Vec2][] = pts.map(p=>[dist(s,p),p]);candidates.sort((a,b)=>a[0]-b[0]);
  const near=candidates[0]?.[1];let index=near?pts.indexOf(near):-1;
  if(index<0)index=0;
  const out=[level.hole];for(let k=1;k<=2;k+=1){const p=pts[Math.min(pts.length-1,index+k)];if(p&&!out.some(q=>dist(p,q)<5))out.push(p);}
  return out;
}

function candidateShots(level:LevelDefinition,s:SimState,stroke:number):Shot[] {
  const shots:Shot[]=[];const seen=new Set<string>();
  const add=(angle:number,power:number)=>{angle=normalizeAngle(angle);const key=`${Math.round(angle*180/Math.PI)}:${Math.round(power*100)}`;if(!seen.has(key)){seen.add(key);shots.push({angle,power});}};
  const powers=stroke<=2?[0.48,0.65,0.82,0.98]:[0.42,0.62,0.80,0.98];
  for(const target of targetsFor(level,s)){
    const base=Math.atan2(target.y-s.y,target.x-s.x);
    for(const off of [-18,-9,0,9,18])for(const p of powers)add(base+off*Math.PI/180,p);
  }
  for(let i=0;i<12;i+=1){const a=i*Math.PI*2/12;add(a,0.68);add(a,0.94);}
  return shots;
}

function denseHoleInOne(level:LevelDefinition):SolvedRun|null {
  const start=initialState(level);let best:SolvedRun|null=null;
  for(let deg=0;deg<360;deg+=2){const a=deg*Math.PI/180;for(let pi=0;pi<=13;pi+=1){const power=0.35+pi*0.05;const r=simulateShot(level,start,{angle:a,power});if(r?.sunk){const run={strokes:1,time:r.state.time,shots:[{angle:a,power}]};if(!best||run.time<best.time)best=run;}}}
  return best;
}

function searchLevel(level:LevelDefinition):SolvedRun|null {
  if(level.threeStar.maxStrokes===1){const hio=denseHoleInOne(level);if(hio)return hio;}
  const maxDepth=Math.min(11,Math.max(level.twoStar.maxStrokes??8,(level.threeStar.maxStrokes??6)+2));
  let beam:SearchNode[]=[{state:initialState(level),strokes:0,shots:[],score:0}];let best:SolvedRun|null=null;
  for(let depth=1;depth<=maxDepth;depth+=1){
    const next:SearchNode[]=[];const dedupe=new Map<string,SearchNode>();
    for(const node of beam){
      for(const shot of candidateShots(level,node.state,depth)){
        const r=simulateShot(level,node.state,shot);if(!r)continue;
        if(r.sunk){const run={strokes:depth,time:r.state.time,shots:[...node.shots,shot]};if(!best||run.strokes<best.strokes||(run.strokes===best.strokes&&run.time<best.time))best=run;continue;}
        const progress=pathProjection(level,r.state),holeD=Math.hypot(r.state.x-level.hole.x,r.state.y-level.hole.y);
        const score=holeD+(1-progress)*230+r.state.time*1.3+(r.voided?180:0);
        const key=`${Math.round(r.state.x/22)}:${Math.round(r.state.y/22)}:${r.state.popWalls.map(x=>x.active?1:0).join("")}:${r.state.popBumpers.map(x=>x.active?1:0).join("")}:${r.state.popVoids.map(x=>x.active?1:0).join("")}`;
        const candidate={state:r.state,strokes:depth,shots:[...node.shots,shot],score};const old=dedupe.get(key);if(!old||score<old.score)dedupe.set(key,candidate);
      }
    }
    if(best&&best.strokes===depth) return best;
    next.push(...dedupe.values());next.sort((a,b)=>a.score-b.score);beam=next.slice(0,18);
    if(beam.length===0)break;
  }
  return best;
}

function routeRatio(level:LevelDefinition):number {
  const pts=level.designPath?.length?level.designPath:[level.ball,level.hole];let length=0;for(let i=0;i<pts.length-1;i+=1)length+=dist(pts[i]!,pts[i+1]!);return length/(dist(level.ball,level.hole)||1);
}
function mechanicCount(level:LevelDefinition):number {
  return [level.bumpers,level.sand,level.ice,level.boosters,level.fans,level.curves,level.portals,level.movingWalls,level.movingBumpers,level.voids,level.ramps,level.trampolines].reduce((n,x)=>n+(x?.length??0),0);
}

const rows:AuditRow[]=[];
for(const mode of ["classic","troll"] as const){
  console.log(`\n=== ${mode.toUpperCase()} ===`);
  for(let i=1;i<=40;i+=1){
    const level=sanitizeCourse(buildCampaignCourse(mode,i));const found=searchLevel(level);const target=level.threeStar.maxStrokes??99,targetTime=level.threeStar.maxTimeMs?level.threeStar.maxTimeMs/1000:null;
    let status="OK";
    if(!found)status="NO_ROUTE_FOUND";
    else if(found.strokes>target)status="3STAR_STROKES_FAIL";
    else if(targetTime!==null&&found.time+found.strokes*1.25>targetTime)status="3STAR_TIME_TIGHT";
    else if(found.strokes+2<=target)status="TOO_EASY_FOR_TARGET";
    const row={id:level.id,target,targetTime,bestStrokes:found?.strokes??null,bestTime:found?Number(found.time.toFixed(2)):null,status,routeRatio:Number(routeRatio(level).toFixed(2)),mechanics:mechanicCount(level),walls:level.walls?.length??0};rows.push(row);
    console.log(`${row.id.padEnd(10)} target=${String(target).padStart(2)}${targetTime?`/${targetTime}s`:"    "} best=${String(row.bestStrokes??"?").padStart(2)}/${row.bestTime??"?"}s route=${row.routeRatio.toFixed(2)} mech=${row.mechanics} walls=${row.walls} ${status}`);
  }
}

function modeRows(prefix:string){return rows.filter(r=>r.id.startsWith(prefix));}
for(const prefix of ["classic","troll"]){
  const rs=modeRows(prefix);const problems=rs.filter(r=>r.status!=="OK");
  console.log(`\n${prefix.toUpperCase()} SUMMARY: ${rs.length-problems.length}/${rs.length} clean; ${problems.length} flagged`);
  for(const r of problems)console.log(`FLAG ${r.id} ${r.status} target=${r.target} best=${r.bestStrokes}/${r.bestTime}`);
}
console.log(`AUDIT_JSON=${JSON.stringify(rows)}`);
