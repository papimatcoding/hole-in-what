import type { GameMode, LevelDefinition, RectDef } from "../../types";

export const FIELD = { left: 28, right: 512, top: 28, bottom: 932 };
export const WALL = 24;

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  bool(): boolean;
}

export function seeded(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    bool: () => next() >= 0.5
  };
}

export const r = (x:number,y:number,w:number,h:number): RectDef => ({x,y,w,h});
export const goal = (maxStrokes:number, seconds?:number) => ({ maxStrokes, ...(seconds !== undefined ? { maxTimeMs: Math.round(seconds * 1000) } : {}) });

export function blank(mode:GameMode,index:number,ballX:number,holeX:number):LevelDefinition {
  const hard = mode === "troll";
  const group = Math.min(4, Math.floor((index - 1) / 5) + 1);
  const classicThree = index === 1 ? 1 : index <= 4 ? 2 : index <= 9 ? 3 : index <= 15 ? 4 : 5;
  const hardThree = index <= 4 ? 4 : index <= 9 ? 5 : index <= 15 ? 6 : 7;
  const three = hard ? hardThree : classicThree;
  const two = three + (hard ? 3 : 2);
  const seconds = hard ? 18 + index * 0.85 : index < 6 ? undefined : 14 + index * 0.55;
  return {
    id:`${hard ? "troll" : "classic"}-${String(index).padStart(2,"0")}`,
    mode, group, ball:{x:ballX,y:825}, hole:{x:holeX,y:155}, threeStar:goal(three,seconds), twoStar:goal(two),
    fairways:[],walls:[],triangles:[],curves:[],movingWalls:[],movingBumpers:[],sand:[],ice:[],boosters:[],fans:[],winds:[],portals:[],ramps:[],trampolines:[],voids:[],bumpers:[],popWalls:[],popBumpers:[],popVoids:[]
  };
}

export function mirrorX(x:number,mirror:boolean):number { return mirror ? FIELD.left + FIELD.right - x : x; }
export function mirrorRect(rect:RectDef,mirror:boolean):RectDef { return mirror ? {...rect,x:FIELD.left + FIELD.right - rect.x - rect.w} : rect; }

function overlap(a:RectDef,b:RectDef,margin=0):boolean {
  return a.x < b.x+b.w+margin && a.x+a.w > b.x-margin && a.y < b.y+b.h+margin && a.y+a.h > b.y-margin;
}
function pointInRect(x:number,y:number,rect:RectDef,margin=0):boolean {
  return x > rect.x-margin && x < rect.x+rect.w+margin && y > rect.y-margin && y < rect.y+rect.h+margin;
}
function lineHitsRect(ax:number,ay:number,bx:number,by:number,rect:RectDef):boolean {
  for(let i=0;i<=56;i+=1){
    const q=i/56;
    if(pointInRect(ax+(bx-ax)*q,ay+(by-ay)*q,rect,13)) return true;
  }
  return false;
}
function clamp(value:number,min:number,max:number):number { return Math.max(min,Math.min(max,value)); }

function cleanRects(level:LevelDefinition,key:"voids"|"sand"|"ice"|"fans"|"ramps"):void {
  const walls=level.walls ?? [];
  const list=(level[key] ?? []) as RectDef[];
  (level as unknown as Record<string,unknown>)[key]=list.filter(rect=>!walls.some(w=>overlap(rect,w,3)));
}

function normalizePhysics(level:LevelDefinition):void {
  level.fans=(level.fans ?? []).map(f=>({...f,strength:clamp(f.strength ?? 270,225,335)}));
  level.winds=(level.winds ?? []).map(f=>({...f,strength:clamp(f.strength ?? 270,225,335)}));
  level.ramps=(level.ramps ?? []).map(ramp=>({...ramp,lift:clamp(ramp.lift ?? 350,325,385),boost:clamp(ramp.boost ?? 42,30,58)}));
  level.trampolines=(level.trampolines ?? []).map(t=>({...t,power:clamp(t.power ?? 440,415,470)}));
  level.movingWalls=(level.movingWalls ?? []).map(m=>({...m,amplitude:clamp(m.amplitude,35,90),speed:clamp(m.speed ?? 1.05,0.82,1.28)}));
  level.movingBumpers=(level.movingBumpers ?? []).map(m=>({...m,amplitude:clamp(m.amplitude,35,95),speed:clamp(m.speed ?? 1.1,0.88,1.32)}));
}

function ensureDirectLineBlocked(level:LevelDefinition):void {
  if(level.id==="classic-01") return;
  if((level.walls ?? []).some(w=>lineHitsRect(level.ball.x,level.ball.y,level.hole.x,level.hole.y,w))) return;
  const y=455;
  const q=(y-level.ball.y)/(level.hole.y-level.ball.y);
  const lineX=level.ball.x+(level.hole.x-level.ball.x)*q;
  const width=150;
  const x=Math.max(FIELD.left+18,Math.min(FIELD.right-width-18,lineX-width/2));
  level.walls=[...(level.walls ?? []),r(x,y,width,WALL)];
}

export function sanitizeCourse(level:LevelDefinition):LevelDefinition {
  const next:LevelDefinition=JSON.parse(JSON.stringify(level)) as LevelDefinition;
  const spawn=[next.ball,next.hole];
  next.walls=(next.walls ?? []).filter(w=>!spawn.some(p=>pointInRect(p.x,p.y,w,45)));
  next.voids=(next.voids ?? []).filter(v=>!spawn.some(p=>pointInRect(p.x,p.y,v,45)));

  for(const key of ["voids","sand","ice","fans","ramps"] as const) cleanRects(next,key);
  next.popWalls=(next.popWalls ?? []).filter(p=>!(next.walls ?? []).some(w=>overlap(p,w,3)) && !(next.voids ?? []).some(v=>overlap(p,v,3)));
  next.popVoids=(next.popVoids ?? []).filter(p=>!(next.walls ?? []).some(w=>overlap(p,w,3)));
  next.portals=(next.portals ?? []).filter(pair=>[pair.a,pair.b].every(p=>
    !(next.walls ?? []).some(w=>pointInRect(p.x,p.y,w,36)) && !(next.voids ?? []).some(v=>pointInRect(p.x,p.y,v,34))
  ));

  ensureDirectLineBlocked(next);
  // The validator may have inserted one final blocking wall, so sanitize modifiers once more.
  for(const key of ["voids","sand","ice","fans","ramps"] as const) cleanRects(next,key);

  // Jump modifiers must solve a jump problem. If the required hazard disappeared during sanitation, remove the modifier too.
  if((next.voids?.length ?? 0)===0){ next.ramps=[]; next.trampolines=[]; }

  if(next.mode==="troll" && (next.popWalls?.length ?? 0)+(next.popBumpers?.length ?? 0)+(next.popVoids?.length ?? 0)===0){
    next.popBumpers=[{x:270,y:445,r:34,triggerX:270,triggerY:575,triggerRadius:95}];
  }

  normalizePhysics(next);
  return next;
}
