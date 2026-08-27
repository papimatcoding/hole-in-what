import { levelsForMode } from "../src/data/campaign";
import type { LevelDefinition, RectDef } from "../src/types";

interface NamedRect{label:string;r:RectDef;}
interface NamedCircle{label:string;x:number;y:number;r:number;}
const pad=3;

function overlapRect(a:RectDef,b:RectDef):boolean{return a.x+pad<b.x+b.w&&a.x+a.w>b.x+pad&&a.y+pad<b.y+b.h&&a.y+a.h>b.y+pad;}
function circleRect(c:NamedCircle,r:RectDef):boolean{const x=Math.max(r.x,Math.min(c.x,r.x+r.w)),y=Math.max(r.y,Math.min(c.y,r.y+r.h));return Math.hypot(c.x-x,c.y-y)<c.r+2;}
function circleCircle(a:NamedCircle,b:NamedCircle):boolean{return Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r+3;}
function pointRect(x:number,y:number,r:RectDef,margin=15):boolean{return x>=r.x-margin&&x<=r.x+r.w+margin&&y>=r.y-margin&&y<=r.y+r.h+margin;}

function rects(level:LevelDefinition):NamedRect[]{
  const out:NamedRect[]=[];const add=(label:string,arr:RectDef[]|undefined)=>arr?.forEach((r,i)=>out.push({label:`${label}[${i}]`,r}));
  add("wall",level.walls);add("sand",level.sand);add("ice",level.ice);add("void",level.voids);add("booster",level.boosters);add("fan",level.fans);add("ramp",level.ramps);add("movingWall",level.movingWalls);add("popWall",level.popWalls);add("popVoid",level.popVoids);return out;
}
function circles(level:LevelDefinition):NamedCircle[]{
  const out:NamedCircle[]=[];level.bumpers?.forEach((b,i)=>out.push({label:`bumper[${i}]`,x:b.x,y:b.y,r:b.r}));level.movingBumpers?.forEach((b,i)=>out.push({label:`movingBumper[${i}]`,x:b.x,y:b.y,r:b.r}));level.popBumpers?.forEach((b,i)=>out.push({label:`popBumper[${i}]`,x:b.x,y:b.y,r:b.r}));level.trampolines?.forEach((b,i)=>out.push({label:`trampoline[${i}]`,x:b.x,y:b.y,r:b.r}));level.portals?.forEach((p,i)=>{out.push({label:`portal[${i}].a`,x:p.a.x,y:p.a.y,r:p.a.r??28},{label:`portal[${i}].b`,x:p.b.x,y:p.b.y,r:p.b.r??28});});return out;
}

const errors:string[]=[];
for(const mode of["classic","troll"]as const)for(const level of levelsForMode(mode)){
  const rs=rects(level),cs=circles(level);
  for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++)if(overlapRect(rs[i]!.r,rs[j]!.r))errors.push(`${level.id}: ${rs[i]!.label} overlaps ${rs[j]!.label}`);
  for(const c of cs)for(const r of rs)if(circleRect(c,r.r))errors.push(`${level.id}: ${c.label} overlaps ${r.label}`);
  for(let i=0;i<cs.length;i++)for(let j=i+1;j<cs.length;j++)if(circleCircle(cs[i]!,cs[j]!))errors.push(`${level.id}: ${cs[i]!.label} overlaps ${cs[j]!.label}`);
  for(const r of rs){if(pointRect(level.ball.x,level.ball.y,r.r))errors.push(`${level.id}: ball too close to ${r.label}`);if(pointRect(level.hole.x,level.hole.y,r.r,22))errors.push(`${level.id}: hole too close to ${r.label}`);}
}

if(errors.length){console.error(`AUTHORED GEOMETRY FAIL (${errors.length})\n${errors.join("\n")}`);process.exitCode=1;}
else console.log("PASS authored campaign has no accidental object overlaps");
