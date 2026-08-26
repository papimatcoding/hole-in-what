import type { GameMode, LevelDefinition, RectDef, Vec2 } from "../../types";

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
  const ball = {x:ballX,y:825};
  const hole = {x:holeX,y:155};
  return {
    id:`${hard ? "troll" : "classic"}-${String(index).padStart(2,"0")}`,
    mode, group, ball, hole, threeStar:goal(three,seconds), twoStar:goal(two),
    designPath:[ball,hole],
    fairways:[],walls:[],triangles:[],curves:[],movingWalls:[],movingBumpers:[],sand:[],ice:[],boosters:[],fans:[],winds:[],portals:[],ramps:[],trampolines:[],voids:[],bumpers:[],popWalls:[],popBumpers:[],popVoids:[]
  };
}

export function setDesignPath(level:LevelDefinition, points:Vec2[]):LevelDefinition {
  level.designPath = [level.ball, ...points, level.hole];
  return level;
}

export function mirrorX(x:number,mirror:boolean):number { return mirror ? FIELD.left + FIELD.right - x : x; }
export function mirrorRect(rect:RectDef,mirror:boolean):RectDef { return mirror ? {...rect,x:FIELD.left + FIELD.right - rect.x - rect.w} : rect; }

function overlap(a:RectDef,b:RectDef,margin=0):boolean {
  return a.x < b.x+b.w+margin && a.x+a.w > b.x-margin && a.y < b.y+b.h+margin && a.y+a.h > b.y-margin;
}
function pointInRect(x:number,y:number,rect:RectDef,margin=0):boolean {
  return x > rect.x-margin && x < rect.x+rect.w+margin && y > rect.y-margin && y < rect.y+rect.h+margin;
}
function clamp(value:number,min:number,max:number):number { return Math.max(min,Math.min(max,value)); }

function path(level:LevelDefinition):Vec2[] {
  return (level.designPath?.length ?? 0) >= 2 ? level.designPath! : [level.ball,level.hole];
}

function distancePointToSegment(p:Vec2,a:Vec2,b:Vec2):number {
  const abx=b.x-a.x;
  const aby=b.y-a.y;
  const d=abx*abx+aby*aby || 1;
  const q=clamp(((p.x-a.x)*abx+(p.y-a.y)*aby)/d,0,1);
  return Math.hypot(p.x-(a.x+abx*q),p.y-(a.y+aby*q));
}

function distanceToPath(level:LevelDefinition,p:Vec2):number {
  const pts=path(level);
  let best=Number.POSITIVE_INFINITY;
  for(let i=0;i<pts.length-1;i+=1) best=Math.min(best,distancePointToSegment(p,pts[i]!,pts[i+1]!));
  return best;
}

function rectTouchesPath(level:LevelDefinition,rect:RectDef,margin=22):boolean {
  const pts=path(level);
  for(let s=0;s<pts.length-1;s+=1){
    const a=pts[s]!;
    const b=pts[s+1]!;
    for(let i=0;i<=24;i+=1){
      const q=i/24;
      if(pointInRect(a.x+(b.x-a.x)*q,a.y+(b.y-a.y)*q,rect,margin)) return true;
    }
  }
  return false;
}

function circleTouchesPath(level:LevelDefinition,x:number,y:number,radius:number,margin=34):boolean {
  return distanceToPath(level,{x,y}) <= radius+margin;
}

function cleanRects(level:LevelDefinition,key:"voids"|"sand"|"ice"|"fans"|"ramps"):void {
  const walls=level.walls ?? [];
  const list=(level[key] ?? []) as RectDef[];
  // Touching a wall edge is valid: authored sand/ice often fills a corridor exactly up to its rails.
  // Only remove zones with a real geometric overlap, not a few pixels of defensive clearance.
  (level as unknown as Record<string,unknown>)[key]=list.filter(rect=>!walls.some(w=>overlap(rect,w,0)));
}

function normalizePhysics(level:LevelDefinition):void {
  level.fans=(level.fans ?? []).map(f=>({...f,strength:clamp(f.strength ?? 270,235,330)}));
  level.winds=(level.winds ?? []).map(f=>({...f,strength:clamp(f.strength ?? 270,235,330)}));
  level.boosters=(level.boosters ?? []).map(b=>({...b,power:clamp(b.power ?? 1,0.82,1.18)}));
  level.ramps=(level.ramps ?? []).map(ramp=>({...ramp,lift:clamp(ramp.lift ?? 350,325,380),boost:clamp(ramp.boost ?? 42,28,55)}));
  level.trampolines=(level.trampolines ?? []).map(t=>({...t,power:clamp(t.power ?? 440,415,465)}));
  level.movingWalls=(level.movingWalls ?? []).map(m=>({...m,amplitude:clamp(m.amplitude,35,86),speed:clamp(m.speed ?? 1.05,0.82,1.24)}));
  level.movingBumpers=(level.movingBumpers ?? []).map(m=>({...m,amplitude:clamp(m.amplitude,35,90),speed:clamp(m.speed ?? 1.1,0.88,1.28)}));
}

function keepPurposefulMechanics(level:LevelDefinition):void {
  level.sand=(level.sand ?? []).filter(x=>rectTouchesPath(level,x,24));
  level.ice=(level.ice ?? []).filter(x=>rectTouchesPath(level,x,24));
  level.boosters=(level.boosters ?? []).filter(x=>rectTouchesPath(level,x,22));
  level.fans=(level.fans ?? []).filter(x=>rectTouchesPath(level,x,34));
  level.winds=(level.winds ?? []).filter(x=>rectTouchesPath(level,x,34));
  level.ramps=(level.ramps ?? []).filter(x=>rectTouchesPath(level,x,30));
  level.trampolines=(level.trampolines ?? []).filter(x=>circleTouchesPath(level,x.x,x.y,x.r,38));
  level.bumpers=(level.bumpers ?? []).filter(x=>circleTouchesPath(level,x.x,x.y,x.r,42));

  level.movingBumpers=(level.movingBumpers ?? []).filter(x=>{
    const effective=x.r+x.amplitude;
    return circleTouchesPath(level,x.x,x.y,effective,30);
  });
  level.movingWalls=(level.movingWalls ?? []).filter(x=>{
    const expanded=x.axis==="x"
      ? {x:x.x-x.amplitude,y:x.y,w:x.w+x.amplitude*2,h:x.h}
      : {x:x.x,y:x.y-x.amplitude,w:x.w,h:x.h+x.amplitude*2};
    return rectTouchesPath(level,expanded,28);
  });
  level.curves=(level.curves ?? []).filter(c=>distanceToPath(level,{x:c.x,y:c.y}) <= c.r+(c.thickness ?? 22)+48);
  level.portals=(level.portals ?? []).filter(pair=>
    circleTouchesPath(level,pair.a.x,pair.a.y,pair.a.r ?? 28,46) &&
    circleTouchesPath(level,pair.b.x,pair.b.y,pair.b.r ?? 28,62)
  );
}

function ensureHardTrap(level:LevelDefinition):void {
  const count=(level.popWalls?.length ?? 0)+(level.popBumpers?.length ?? 0)+(level.popVoids?.length ?? 0);
  if(level.mode!=="troll" || count>0) return;
  const pts=path(level),hit=pts[Math.max(1,Math.floor((pts.length-1)*.58))]??level.hole,trigger=pts[Math.max(0,Math.floor((pts.length-1)*.42))]??level.ball;
  level.popBumpers=[{x:hit.x,y:hit.y,r:34,triggerX:trigger.x,triggerY:trigger.y,triggerRadius:92}];
}

/**
 * Sanitising is defensive only: remove impossible overlaps and clamp physics. It deliberately
 * does NOT invent geometry. Difficulty and direct-line blocking belong to the course author /
 * generator, otherwise every level converges toward the same generic wall pattern.
 */
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

  if((next.voids?.length ?? 0)===0){ next.ramps=[]; next.trampolines=[]; }
  keepPurposefulMechanics(next);
  ensureHardTrap(next);
  normalizePhysics(next);
  return next;
}
