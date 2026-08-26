import type {
  CurveDef,
  LevelDefinition,
  MovingBumperDef,
  MovingWallDef,
  RectDef,
  TriangleDef,
  Vec2
} from "../types";

export const GOLF_PHYSICS = {
  field: { x: 28, y: 28, w: 484, h: 904 },
  ballRadius: 13,
  holeRadius: 17,
  maxPull: 172,
  dragGain: 1.35,
  power: 7.4,
  baseFriction: 0.9875,
  iceFriction: 0.9982,
  sandFriction: 0.955,
  airFriction: 0.9995,
  wallBounce: 0.90,
  curveBounce: 0.92,
  movingWallBounce: 0.94,
  stopSpeed: 18,
  boostForce: 650,
  gravity: 980,
  softSpeed: 1220,
  hardSpeed: 1360,
  maxVerticalSpeed: 475
} as const;

export type SimulationMechanic =
  | "wall"
  | "bumper"
  | "sand"
  | "ice"
  | "booster"
  | "fan"
  | "curve"
  | "portal"
  | "moving"
  | "ramp"
  | "trampoline"
  | "void"
  | "hole";

export type SimulationEventKind =
  | "shot"
  | "wall-hit"
  | "bumper-hit"
  | "surface-sand"
  | "surface-ice"
  | "booster"
  | "fan"
  | "curve-hit"
  | "portal"
  | "moving-hit"
  | "ramp"
  | "trampoline"
  | "takeoff"
  | "landing"
  | "void"
  | "trap-wall"
  | "trap-bumper"
  | "trap-void"
  | "hole-lip"
  | "hole";

export interface SimulationEvent {
  kind: SimulationEventKind;
  x: number;
  y: number;
  detail?: string;
}

export interface GolfBallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  vz: number;
  r: number;
}

interface RuntimeTrapState {
  active: boolean;
  anim: number;
}

export interface GolfSimulationState {
  ball: GolfBallState;
  shotOrigin: Vec2;
  moving: boolean;
  sunk: boolean;
  voided: boolean;
  time: number;
  portalCooldown: number;
  bumperCooldown: number;
  launchCooldown: number;
  holeLipCooldown: number;
  surface: "grass" | "sand" | "ice" | "air";
  popWalls: RuntimeTrapState[];
  popBumpers: RuntimeTrapState[];
  popVoids: RuntimeTrapState[];
  touchedMechanics: SimulationMechanic[];
  triggeredTraps: string[];
}

export interface SimulationShot {
  angle: number;
  power: number;
}

export interface ShotSimulationResult {
  state: GolfSimulationState;
  events: SimulationEvent[];
  sunk: boolean;
  voided: boolean;
  duration: number;
}

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const distance = (a: {x:number;y:number}, b: {x:number;y:number}): number => Math.hypot(a.x - b.x, a.y - b.y);
const pointInRect = (p: {x:number;y:number}, rect: RectDef): boolean =>
  p.x > rect.x && p.x < rect.x + rect.w && p.y > rect.y && p.y < rect.y + rect.h;

function addUnique<T extends string>(items: T[], value: T): void {
  if (!items.includes(value)) items.push(value);
}

export function createGolfSimulationState(level: LevelDefinition): GolfSimulationState {
  return {
    ball: { x: level.ball.x, y: level.ball.y, vx: 0, vy: 0, z: 0, vz: 0, r: GOLF_PHYSICS.ballRadius },
    shotOrigin: { ...level.ball },
    moving: false,
    sunk: false,
    voided: false,
    time: 0,
    portalCooldown: 0,
    bumperCooldown: 0,
    launchCooldown: 0,
    holeLipCooldown: 0,
    surface: "grass",
    popWalls: (level.popWalls ?? []).map(() => ({ active: false, anim: 0 })),
    popBumpers: (level.popBumpers ?? []).map(() => ({ active: false, anim: 0 })),
    popVoids: (level.popVoids ?? []).map(() => ({ active: false, anim: 0 })),
    touchedMechanics: [],
    triggeredTraps: []
  };
}

export function cloneGolfSimulationState(state: GolfSimulationState): GolfSimulationState {
  return {
    ...state,
    ball: { ...state.ball },
    shotOrigin: { ...state.shotOrigin },
    popWalls: state.popWalls.map((x) => ({ ...x })),
    popBumpers: state.popBumpers.map((x) => ({ ...x })),
    popVoids: state.popVoids.map((x) => ({ ...x })),
    touchedMechanics: [...state.touchedMechanics],
    triggeredTraps: [...state.triggeredTraps]
  };
}

export function shotVelocity(angle: number, power: number): Vec2 {
  const normalizedPower = clamp(power, 0, 1);
  const speed = GOLF_PHYSICS.maxPull * GOLF_PHYSICS.power * normalizedPower;
  return { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
}

export function powerFromPhysicalPull(pullDistance: number): number {
  return clamp((pullDistance * GOLF_PHYSICS.dragGain) / GOLF_PHYSICS.maxPull, 0, 1);
}

export type HoleInteraction = "sink" | "lip" | "pass";

/**
 * Arcade cup model. A well-paced centred ball drops reliably, while a very fast ball
 * can cross the cup. Slow edge entries get a forgiving capture zone and medium/high
 * speed rim contacts can lip out instead of being magnetically absorbed.
 */
export function evaluateHoleInteraction(ball: Pick<GolfBallState,"x"|"y"|"vx"|"vy">, hole: Vec2): HoleInteraction {
  const d = distance(ball, hole);
  const speed = Math.hypot(ball.vx, ball.vy);
  if (d <= 12.5 && speed <= 365) return "sink";
  if (d <= 20 && speed <= 190) return "sink";
  if (d >= 15 && d <= 25 && speed > 150 && speed <= 650) {
    const nx = (ball.x - hole.x) / (d || 1);
    const ny = (ball.y - hole.y) / (d || 1);
    const radial = ball.vx * nx + ball.vy * ny;
    if (radial < -45) return "lip";
  }
  return "pass";
}

function pointInTriangle(p: Vec2, triangle: TriangleDef): boolean {
  const sign = (p1: Vec2, p2: Vec2, p3: Vec2): number =>
    (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(p, triangle.a, triangle.b);
  const d2 = sign(p, triangle.b, triangle.c);
  const d3 = sign(p, triangle.c, triangle.a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSq = abx * abx + aby * aby || 1;
  const q = clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSq, 0, 1);
  return { x: a.x + abx * q, y: a.y + aby * q };
}

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  return ((angle % twoPi) + twoPi) % twoPi;
}

function angleInArc(angle: number, start: number, end: number): boolean {
  const a = normalizeAngle(angle);
  const s = normalizeAngle(start);
  const e = normalizeAngle(end);
  return s <= e ? a >= s && a <= e : a >= s || a <= e;
}

function movingWallRect(wall: MovingWallDef, seconds: number): RectDef {
  const q = Math.sin(seconds * (wall.speed ?? 1.15) + (wall.phase ?? 0)) * wall.amplitude;
  return {
    x: wall.x + (wall.axis === "x" ? q : 0),
    y: wall.y + (wall.axis === "y" ? q : 0),
    w: wall.w,
    h: wall.h
  };
}

function movingBumperPoint(bumper: MovingBumperDef, seconds: number): Vec2 {
  const q = Math.sin(seconds * (bumper.speed ?? 1.3) + (bumper.phase ?? 0)) * bumper.amplitude;
  return {
    x: bumper.x + (bumper.axis === "x" ? q : 0),
    y: bumper.y + (bumper.axis === "y" ? q : 0)
  };
}

function movingVelocity(amplitude: number, speed: number, phase: number, seconds: number): number {
  return Math.cos(seconds * speed + phase) * amplitude * speed;
}

function easeOutBack(q: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(q - 1, 3) + c1 * Math.pow(q - 1, 2);
}

function animatedWallRect(level: LevelDefinition, state: GolfSimulationState, index: number): RectDef {
  const wall = level.popWalls![index]!;
  const q = easeOutBack(state.popWalls[index]!.anim);
  if (wall.w >= wall.h) return { x: wall.x, y: wall.y + wall.h * (1 - q) / 2, w: wall.w, h: wall.h * q };
  return { x: wall.x + wall.w * (1 - q) / 2, y: wall.y, w: wall.w * q, h: wall.h };
}

function resolveRect(ball: GolfBallState, rect: RectDef, bounce: number): boolean {
  const closestX = clamp(ball.x, rect.x, rect.x + rect.w);
  const closestY = clamp(ball.y, rect.y, rect.y + rect.h);
  if (Math.hypot(ball.x - closestX, ball.y - closestY) >= GOLF_PHYSICS.ballRadius) return false;

  const left = Math.abs((ball.x + GOLF_PHYSICS.ballRadius) - rect.x);
  const right = Math.abs((rect.x + rect.w) - (ball.x - GOLF_PHYSICS.ballRadius));
  const top = Math.abs((ball.y + GOLF_PHYSICS.ballRadius) - rect.y);
  const bottom = Math.abs((rect.y + rect.h) - (ball.y - GOLF_PHYSICS.ballRadius));
  const min = Math.min(left, right, top, bottom);
  if (min === left) { ball.x = rect.x - GOLF_PHYSICS.ballRadius; ball.vx = -Math.abs(ball.vx) * bounce; }
  else if (min === right) { ball.x = rect.x + rect.w + GOLF_PHYSICS.ballRadius; ball.vx = Math.abs(ball.vx) * bounce; }
  else if (min === top) { ball.y = rect.y - GOLF_PHYSICS.ballRadius; ball.vy = -Math.abs(ball.vy) * bounce; }
  else { ball.y = rect.y + rect.h + GOLF_PHYSICS.ballRadius; ball.vy = Math.abs(ball.vy) * bounce; }
  return true;
}

function resolveTriangle(ball: GolfBallState, triangle: TriangleDef): boolean {
  const point = { x: ball.x, y: ball.y };
  const inside = pointInTriangle(point, triangle);
  const edges: Array<[Vec2,Vec2]> = [[triangle.a,triangle.b],[triangle.b,triangle.c],[triangle.c,triangle.a]];
  let closest = {x:0,y:0};
  let edgeA = triangle.a;
  let edgeB = triangle.b;
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (const [a,b] of edges) {
    const q = closestPointOnSegment(point,a,b);
    const dx = point.x-q.x;
    const dy = point.y-q.y;
    const d2 = dx*dx+dy*dy;
    if (d2 < bestDistSq) { bestDistSq=d2; closest=q; edgeA=a; edgeB=b; }
  }
  const d = Math.sqrt(bestDistSq);
  if (!inside && d >= GOLF_PHYSICS.ballRadius) return false;
  let nx:number, ny:number;
  if (d > 0.0001) {
    nx=(point.x-closest.x)/d; ny=(point.y-closest.y)/d;
    if (inside) { nx*=-1; ny*=-1; }
  } else {
    const ex=edgeB.x-edgeA.x, ey=edgeB.y-edgeA.y, len=Math.hypot(ex,ey)||1;
    nx=-ey/len; ny=ex/len;
    const centroid={x:(triangle.a.x+triangle.b.x+triangle.c.x)/3,y:(triangle.a.y+triangle.b.y+triangle.c.y)/3};
    if ((centroid.x-closest.x)*nx+(centroid.y-closest.y)*ny>0) { nx*=-1; ny*=-1; }
  }
  ball.x=closest.x+nx*(GOLF_PHYSICS.ballRadius+0.5);
  ball.y=closest.y+ny*(GOLF_PHYSICS.ballRadius+0.5);
  const dot=ball.vx*nx+ball.vy*ny;
  if(dot<0){ball.vx-=(1+GOLF_PHYSICS.wallBounce)*dot*nx;ball.vy-=(1+GOLF_PHYSICS.wallBounce)*dot*ny;}
  return true;
}

function resolveBumper(ball: GolfBallState, x: number, y: number, radius: number, multiplier: number): boolean {
  const d = Math.hypot(ball.x-x,ball.y-y);
  if (d >= GOLF_PHYSICS.ballRadius + radius) return false;
  const nx=(ball.x-x)/(d||1),ny=(ball.y-y)/(d||1);
  ball.x=x+nx*(GOLF_PHYSICS.ballRadius+radius+1);
  ball.y=y+ny*(GOLF_PHYSICS.ballRadius+radius+1);
  const dot=ball.vx*nx+ball.vy*ny;
  ball.vx=(ball.vx-2*dot*nx)*multiplier;
  ball.vy=(ball.vy-2*dot*ny)*multiplier;
  return true;
}

function resolveCurve(ball: GolfBallState, curve: CurveDef): boolean {
  const dx=ball.x-curve.x,dy=ball.y-curve.y,d=Math.hypot(dx,dy)||0.001;
  if(!angleInArc(Math.atan2(dy,dx),curve.startAngle,curve.endAngle))return false;
  const half=(curve.thickness??22)/2+GOLF_PHYSICS.ballRadius,delta=d-curve.r;
  if(Math.abs(delta)>=half)return false;
  const bx=dx/d,by=dy/d,side=delta>=0?1:-1,nx=bx*side,ny=by*side,target=curve.r+side*(half+0.7);
  ball.x=curve.x+bx*target;ball.y=curve.y+by*target;
  const dot=ball.vx*nx+ball.vy*ny;
  if(dot<0){ball.vx-=(1+GOLF_PHYSICS.curveBounce)*dot*nx;ball.vy-=(1+GOLF_PHYSICS.curveBounce)*dot*ny;}
  return true;
}

export class GolfSimulation {
  readonly level: LevelDefinition;
  state: GolfSimulationState;

  constructor(level: LevelDefinition, state?: GolfSimulationState) {
    this.level = level;
    this.state = state ? cloneGolfSimulationState(state) : createGolfSimulationState(level);
  }

  launch(angle: number, power: number): boolean {
    if (this.state.moving || this.state.sunk || this.state.voided || this.isAirborne()) return false;
    const v = shotVelocity(angle,power);
    this.state.shotOrigin={x:this.state.ball.x,y:this.state.ball.y};
    this.state.ball.vx=v.x;this.state.ball.vy=v.y;
    this.state.moving=true;
    return true;
  }

  launchVector(vx: number, vy: number): boolean {
    if (this.state.moving || this.state.sunk || this.state.voided || this.isAirborne()) return false;
    this.state.shotOrigin={x:this.state.ball.x,y:this.state.ball.y};
    this.state.ball.vx=vx;this.state.ball.vy=vy;
    this.state.moving=true;
    return true;
  }

  resetAfterVoid(): void {
    const s=this.state;
    s.ball.x=s.shotOrigin.x;s.ball.y=s.shotOrigin.y;s.ball.vx=0;s.ball.vy=0;s.ball.z=0;s.ball.vz=0;
    s.voided=false;s.moving=false;s.surface="grass";
  }

  isAirborne(): boolean {
    return this.state.ball.z>0.5||this.state.ball.vz>0.5;
  }

  step(dtInput: number): SimulationEvent[] {
    const dt=Math.min(dtInput,0.033);
    const s=this.state;
    const b=s.ball;
    const events:SimulationEvent[]=[];
    if(!s.moving||s.sunk||s.voided)return events;

    s.time+=dt;
    s.portalCooldown=Math.max(0,s.portalCooldown-dt);
    s.bumperCooldown=Math.max(0,s.bumperCooldown-dt);
    s.launchCooldown=Math.max(0,s.launchCooldown-dt);
    s.holeLipCooldown=Math.max(0,s.holeLipCooldown-dt);

    this.updateTraps(dt,events);
    const wasAirborne=this.isAirborne();
    if(!wasAirborne)this.tryLaunch(events);
    const airborne=this.isAirborne();

    const onSand=!airborne&&(this.level.sand??[]).some(x=>pointInRect(b,x));
    const onIce=!airborne&&(this.level.ice??[]).some(x=>pointInRect(b,x));
    const surface=airborne?"air":onSand?"sand":onIce?"ice":"grass";
    if(surface!==s.surface){
      if(surface==="sand"){events.push({kind:"surface-sand",x:b.x,y:b.y});addUnique(s.touchedMechanics,"sand");}
      if(surface==="ice"){events.push({kind:"surface-ice",x:b.x,y:b.y});addUnique(s.touchedMechanics,"ice");}
      s.surface=surface;
    }

    if(!airborne){
      for(const booster of this.level.boosters??[]){
        if(!pointInRect(b,booster))continue;
        const len=Math.hypot(booster.dx,booster.dy)||1,force=GOLF_PHYSICS.boostForce*(booster.power??1);
        b.vx+=booster.dx/len*force*dt;b.vy+=booster.dy/len*force*dt;
        if(!s.touchedMechanics.includes("booster"))events.push({kind:"booster",x:b.x,y:b.y});
        addUnique(s.touchedMechanics,"booster");
      }
    }

    for(const zone of [...(this.level.fans??[]),...(this.level.winds??[])]){
      if(!pointInRect(b,zone))continue;
      const len=Math.hypot(zone.dx,zone.dy)||1,k=(zone.strength??300)*(airborne?0.82:1)*dt;
      b.vx+=zone.dx/len*k;b.vy+=zone.dy/len*k;
      if(!s.touchedMechanics.includes("fan"))events.push({kind:"fan",x:b.x,y:b.y});
      addUnique(s.touchedMechanics,"fan");
    }

    b.x+=b.vx*dt;b.y+=b.vy*dt;
    const friction=airborne?GOLF_PHYSICS.airFriction:onSand?GOLF_PHYSICS.sandFriction:onIce?GOLF_PHYSICS.iceFriction:GOLF_PHYSICS.baseFriction;
    const damping=Math.pow(friction,dt*60);b.vx*=damping;b.vy*=damping;

    if(airborne){
      b.z+=b.vz*dt;b.vz-=GOLF_PHYSICS.gravity*dt;
      if(b.z<=0&&b.vz<0){b.z=0;b.vz=0;events.push({kind:"landing",x:b.x,y:b.y});}
    }

    this.resolveBounds(events);
    if(!this.isAirborne())this.resolveGroundCollisions(events);
    if(s.voided||s.sunk)return events;

    if(!this.isAirborne())this.resolveHole(events);
    if(s.sunk)return events;

    const speed=Math.hypot(b.vx,b.vy);
    if(speed>GOLF_PHYSICS.softSpeed){
      const excess=speed-GOLF_PHYSICS.softSpeed,target=Math.min(GOLF_PHYSICS.hardSpeed,GOLF_PHYSICS.softSpeed+excess*0.32),scale=target/speed;
      b.vx*=scale;b.vy*=scale;
    }
    if(Math.abs(b.vz)>GOLF_PHYSICS.maxVerticalSpeed)b.vz=Math.sign(b.vz)*GOLF_PHYSICS.maxVerticalSpeed;

    if(!this.isAirborne()&&Math.hypot(b.vx,b.vy)<GOLF_PHYSICS.stopSpeed){b.vx=0;b.vy=0;s.moving=false;}
    return events;
  }

  private updateTraps(dt:number,events:SimulationEvent[]):void{
    const s=this.state,b=s.ball;
    for(let i=0;i<(this.level.popWalls??[]).length;i+=1){const def=this.level.popWalls![i]!,rt=s.popWalls[i]!;if(!rt.active&&distance(b,{x:def.triggerX,y:def.triggerY})<def.triggerRadius){rt.active=true;events.push({kind:"trap-wall",x:def.x+def.w/2,y:def.y+def.h/2});addUnique(s.triggeredTraps,`wall:${i}`);}if(rt.active)rt.anim=Math.min(1,rt.anim+dt*7);}
    for(let i=0;i<(this.level.popBumpers??[]).length;i+=1){const def=this.level.popBumpers![i]!,rt=s.popBumpers[i]!;if(!rt.active&&distance(b,{x:def.triggerX,y:def.triggerY})<def.triggerRadius){rt.active=true;events.push({kind:"trap-bumper",x:def.x,y:def.y});addUnique(s.triggeredTraps,`bumper:${i}`);}if(rt.active)rt.anim=Math.min(1,rt.anim+dt*7);}
    for(let i=0;i<(this.level.popVoids??[]).length;i+=1){const def=this.level.popVoids![i]!,rt=s.popVoids[i]!;if(!rt.active&&distance(b,{x:def.triggerX,y:def.triggerY})<def.triggerRadius){rt.active=true;events.push({kind:"trap-void",x:def.x+def.w/2,y:def.y+def.h/2});addUnique(s.triggeredTraps,`void:${i}`);}if(rt.active)rt.anim=Math.min(1,rt.anim+dt*6.5);}
  }

  private tryLaunch(events:SimulationEvent[]):void{
    const s=this.state,b=s.ball;if(s.launchCooldown>0)return;
    const speed=Math.hypot(b.vx,b.vy);
    if(speed>=120){for(const ramp of this.level.ramps??[]){if(!pointInRect(b,ramp))continue;const len=Math.hypot(ramp.dx,ramp.dy)||1,dx=ramp.dx/len,dy=ramp.dy/len;if((b.vx*dx+b.vy*dy)/speed<0.18)continue;b.vz=ramp.lift??450;b.vx+=dx*(ramp.boost??110);b.vy+=dy*(ramp.boost??110);s.launchCooldown=.48;addUnique(s.touchedMechanics,"ramp");events.push({kind:"ramp",x:b.x,y:b.y},{kind:"takeoff",x:b.x,y:b.y});return;}}
    for(const trampoline of this.level.trampolines??[]){if(distance(b,trampoline)>trampoline.r+GOLF_PHYSICS.ballRadius*.45)continue;b.vz=trampoline.power??565;b.vx*=1.045;b.vy*=1.045;s.launchCooldown=.52;addUnique(s.touchedMechanics,"trampoline");events.push({kind:"trampoline",x:b.x,y:b.y},{kind:"takeoff",x:b.x,y:b.y});return;}
  }

  private resolveBounds(events:SimulationEvent[]):void{
    const b=this.state.ball,f=GOLF_PHYSICS.field,left=f.x+GOLF_PHYSICS.ballRadius,right=f.x+f.w-GOLF_PHYSICS.ballRadius,top=f.y+GOLF_PHYSICS.ballRadius,bottom=f.y+f.h-GOLF_PHYSICS.ballRadius;
    let hit=false;if(b.x<left){b.x=left;b.vx=Math.abs(b.vx)*GOLF_PHYSICS.wallBounce;hit=true;}if(b.x>right){b.x=right;b.vx=-Math.abs(b.vx)*GOLF_PHYSICS.wallBounce;hit=true;}if(b.y<top){b.y=top;b.vy=Math.abs(b.vy)*GOLF_PHYSICS.wallBounce;hit=true;}if(b.y>bottom){b.y=bottom;b.vy=-Math.abs(b.vy)*GOLF_PHYSICS.wallBounce;hit=true;}if(hit){events.push({kind:"wall-hit",x:b.x,y:b.y});addUnique(this.state.touchedMechanics,"wall");}
  }

  private resolveGroundCollisions(events:SimulationEvent[]):void{
    const s=this.state,b=s.ball;
    for(const wall of this.level.walls??[]){if(resolveRect(b,wall,GOLF_PHYSICS.wallBounce)){events.push({kind:"wall-hit",x:b.x,y:b.y});addUnique(s.touchedMechanics,"wall");}}
    for(const triangle of this.level.triangles??[]){if(resolveTriangle(b,triangle)){events.push({kind:"wall-hit",x:b.x,y:b.y});addUnique(s.touchedMechanics,"wall");}}
    for(let i=0;i<(this.level.popWalls??[]).length;i+=1){if(s.popWalls[i]!.active&&s.popWalls[i]!.anim>.25&&resolveRect(b,animatedWallRect(this.level,s,i),GOLF_PHYSICS.wallBounce)){events.push({kind:"wall-hit",x:b.x,y:b.y});addUnique(s.touchedMechanics,"wall");}}
    for(const curve of this.level.curves??[]){if(resolveCurve(b,curve)){events.push({kind:"curve-hit",x:b.x,y:b.y});addUnique(s.touchedMechanics,"curve");}}
    for(const wall of this.level.movingWalls??[]){const rect=movingWallRect(wall,s.time),beforeX=b.x,beforeY=b.y;if(resolveRect(b,rect,GOLF_PHYSICS.movingWallBounce)){const velocity=movingVelocity(wall.amplitude,wall.speed??1.15,wall.phase??0,s.time);if(wall.axis==="x")b.vx+=velocity*.34;else b.vy+=velocity*.34;events.push({kind:"moving-hit",x:beforeX,y:beforeY});addUnique(s.touchedMechanics,"moving");}}
    for(const bumper of this.level.bumpers??[]){if(resolveBumper(b,bumper.x,bumper.y,bumper.r,1.07)){events.push({kind:"bumper-hit",x:b.x,y:b.y});addUnique(s.touchedMechanics,"bumper");}}
    for(let i=0;i<(this.level.popBumpers??[]).length;i+=1){const def=this.level.popBumpers![i]!,rt=s.popBumpers[i]!;if(rt.active&&rt.anim>.25&&resolveBumper(b,def.x,def.y,def.r*easeOutBack(rt.anim),1.09)){events.push({kind:"bumper-hit",x:b.x,y:b.y});addUnique(s.touchedMechanics,"bumper");}}
    for(const bumper of this.level.movingBumpers??[]){const p=movingBumperPoint(bumper,s.time);if(resolveBumper(b,p.x,p.y,bumper.r,1.26)){const velocity=movingVelocity(bumper.amplitude,bumper.speed??1.3,bumper.phase??0,s.time);if(bumper.axis==="x")b.vx+=velocity*.28;else b.vy+=velocity*.28;events.push({kind:"moving-hit",x:p.x,y:p.y});addUnique(s.touchedMechanics,"moving");}}
    if(s.bumperCooldown<=0){for(const bumper of this.level.bumpers??[]){if(distance(b,bumper)<=bumper.r+GOLF_PHYSICS.ballRadius+3&&Math.hypot(b.vx,b.vy)>=25){b.vx*=1.14;b.vy*=1.14;s.bumperCooldown=.11;break;}}}
    if(s.portalCooldown<=0&&s.moving){for(const pair of this.level.portals??[]){const endpoints:[[typeof pair.a,typeof pair.b],[typeof pair.a,typeof pair.b]]=[[pair.a,pair.b],[pair.b,pair.a]];let done=false;for(const [from,to] of endpoints){if(distance(b,from)>(from.r??28)+GOLF_PHYSICS.ballRadius*.2)continue;const speed=Math.hypot(b.vx,b.vy);let dx=speed>1?b.vx/speed:to.x-from.x,dy=speed>1?b.vy/speed:to.y-from.y;const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;const exit=(to.r??28)+GOLF_PHYSICS.ballRadius+5;b.x=to.x+dx*exit;b.y=to.y+dy*exit;s.portalCooldown=.38;events.push({kind:"portal",x:b.x,y:b.y});addUnique(s.touchedMechanics,"portal");done=true;break;}if(done)break;}}
    if((this.level.voids??[]).some(v=>pointInRect(b,v))||this.popVoidHit()){s.voided=true;s.moving=false;b.vx=0;b.vy=0;b.vz=0;events.push({kind:"void",x:b.x,y:b.y});addUnique(s.touchedMechanics,"void");}
  }

  private popVoidHit():boolean{
    const s=this.state,b=s.ball;for(let i=0;i<(this.level.popVoids??[]).length;i+=1){if(!s.popVoids[i]!.active||s.popVoids[i]!.anim<=.56)continue;if(pointInRect(b,this.level.popVoids![i]!))return true;}return false;
  }

  private resolveHole(events:SimulationEvent[]):void{
    const s=this.state,b=s.ball,interaction=evaluateHoleInteraction(b,this.level.hole);
    if(interaction==="sink"){s.sunk=true;s.moving=false;b.vx=0;b.vy=0;events.push({kind:"hole",x:this.level.hole.x,y:this.level.hole.y});addUnique(s.touchedMechanics,"hole");return;}
    if(interaction==="lip"&&s.holeLipCooldown<=0){const d=distance(b,this.level.hole)||1,nx=(b.x-this.level.hole.x)/d,ny=(b.y-this.level.hole.y)/d,radial=b.vx*nx+b.vy*ny;if(radial<0){b.vx=(b.vx-(1+0.38)*radial*nx)*.92;b.vy=(b.vy-(1+0.38)*radial*ny)*.92;s.holeLipCooldown=.12;events.push({kind:"hole-lip",x:b.x,y:b.y});}}
  }
}

export function simulateShotToRest(level:LevelDefinition,start:GolfSimulationState,shot:SimulationShot,maxSeconds=12):ShotSimulationResult{
  const sim=new GolfSimulation(level,start);const events:SimulationEvent[]=[];const startTime=sim.state.time;
  if(!sim.launch(shot.angle,shot.power))return{state:sim.state,events,sunk:sim.state.sunk,voided:sim.state.voided,duration:0};
  events.push({kind:"shot",x:sim.state.ball.x,y:sim.state.ball.y});
  const dt=1/60;let voided=false;
  while(sim.state.moving&&!sim.state.sunk&&sim.state.time-startTime<maxSeconds){const frame=sim.step(dt);events.push(...frame);if(sim.state.voided){voided=true;sim.resetAfterVoid();break;}}
  return{state:cloneGolfSimulationState(sim.state),events,sunk:sim.state.sunk,voided,duration:sim.state.time-startTime};
}
