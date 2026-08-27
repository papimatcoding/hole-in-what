import { GOLF_PHYSICS } from "./GolfSimulation";
import type { CurveDef, LevelDefinition, MovingBumperDef, MovingWallDef, RectDef, TriangleDef, Vec2 } from "../types";

export interface CourseValidationState {
  label: string;
  time?: number;
  activePopWalls?: boolean[];
  activePopBumpers?: boolean[];
  activePopVoids?: boolean[];
}

export interface ReachabilityResult {
  stateLabel: string;
  reachable: boolean;
  visited: number;
  startBlocked: boolean;
  holeBlocked: boolean;
}

export interface CourseClearanceReport {
  id: string;
  results: ReachabilityResult[];
  blockingStates: string[];
}

interface CircleBlocker { label: string; x: number; y: number; r: number; }
interface GridCell { point: Vec2; gx: number; gy: number; }

const FIELD = GOLF_PHYSICS.field;
const BALL = GOLF_PHYSICS.ballRadius;
const SAFETY = 3;
const GRID = 10;

const clamp = (v: number, min: number, max: number): number => Math.max(min, Math.min(max, v));
const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
const normalizeAngle = (angle: number): number => ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
const gridKey = (gx: number, gy: number): string => `${gx}:${gy}`;

function movingWallRect(wall: MovingWallDef, seconds = 0): RectDef {
  const q = Math.sin(seconds * (wall.speed ?? 1.15) + (wall.phase ?? 0)) * wall.amplitude;
  return { x: wall.x + (wall.axis === "x" ? q : 0), y: wall.y + (wall.axis === "y" ? q : 0), w: wall.w, h: wall.h };
}

function movingBumperPoint(bumper: MovingBumperDef, seconds = 0): Vec2 {
  const q = Math.sin(seconds * (bumper.speed ?? 1.3) + (bumper.phase ?? 0)) * bumper.amplitude;
  return { x: bumper.x + (bumper.axis === "x" ? q : 0), y: bumper.y + (bumper.axis === "y" ? q : 0) };
}

function angleInArc(angle: number, start: number, end: number): boolean {
  const a = normalizeAngle(angle), s = normalizeAngle(start), e = normalizeAngle(end);
  return s <= e ? a >= s && a <= e : a >= s || a <= e;
}

function pointInExpandedRect(p: Vec2, r: RectDef, radius: number): boolean {
  return p.x >= r.x - radius && p.x <= r.x + r.w + radius && p.y >= r.y - radius && p.y <= r.y + r.h + radius;
}

function circleRectDistance(p: Vec2, r: RectDef): number {
  const x = clamp(p.x, r.x, r.x + r.w), y = clamp(p.y, r.y, r.y + r.h);
  return Math.hypot(p.x - x, p.y - y);
}

function pointInTriangle(p: Vec2, t: TriangleDef): boolean {
  const sign = (p1: Vec2, p2: Vec2, p3: Vec2): number => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
  const d1 = sign(p, t.a, t.b), d2 = sign(p, t.b, t.c), d3 = sign(p, t.c, t.a);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0, hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

function segmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x, aby = b.y - a.y, len2 = abx * abx + aby * aby || 1;
  const q = clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / len2, 0, 1);
  return Math.hypot(p.x - (a.x + abx * q), p.y - (a.y + aby * q));
}

function pointNearTriangle(p: Vec2, t: TriangleDef, radius: number): boolean {
  if (pointInTriangle(p, t)) return true;
  return segmentDistance(p, t.a, t.b) < radius || segmentDistance(p, t.b, t.c) < radius || segmentDistance(p, t.c, t.a) < radius;
}

function pointNearCurve(p: Vec2, c: CurveDef, radius: number): boolean {
  const dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy);
  if (!angleInArc(Math.atan2(dy, dx), c.startAngle, c.endAngle)) return false;
  const half = (c.thickness ?? 22) / 2 + radius;
  return Math.abs(d - c.r) < half;
}

function activeFlag(flags: boolean[] | undefined, index: number): boolean {
  return flags?.[index] === true;
}

function blockingRects(level: LevelDefinition, state: CourseValidationState): RectDef[] {
  const out: RectDef[] = [...(level.walls ?? [])];
  for (const wall of level.movingWalls ?? []) out.push(movingWallRect(wall, state.time ?? 0));
  (level.popWalls ?? []).forEach((wall, i) => { if (activeFlag(state.activePopWalls, i)) out.push(wall); });
  return out;
}

function hazardRects(level: LevelDefinition, state: CourseValidationState): RectDef[] {
  const out: RectDef[] = [...(level.voids ?? [])];
  (level.popVoids ?? []).forEach((v, i) => { if (activeFlag(state.activePopVoids, i)) out.push(v); });
  return out;
}

function blockers(level: LevelDefinition, state: CourseValidationState): CircleBlocker[] {
  const out: CircleBlocker[] = [];
  (level.bumpers ?? []).forEach((b, i) => out.push({ label: `bumper[${i}]`, x: b.x, y: b.y, r: b.r }));
  (level.movingBumpers ?? []).forEach((b, i) => { const p = movingBumperPoint(b, state.time ?? 0); out.push({ label: `movingBumper[${i}]`, x: p.x, y: p.y, r: b.r }); });
  (level.popBumpers ?? []).forEach((b, i) => { if (activeFlag(state.activePopBumpers, i)) out.push({ label: `popBumper[${i}]`, x: b.x, y: b.y, r: b.r }); });
  return out;
}

export function courseStateVariants(level: LevelDefinition): CourseValidationState[] {
  const variants: CourseValidationState[] = [{ label: "initial", time: 0 }];
  const allWalls = (level.popWalls ?? []).map(() => true);
  const allBumpers = (level.popBumpers ?? []).map(() => true);
  const allVoids = (level.popVoids ?? []).map(() => true);
  (level.popWalls ?? []).forEach((_, i) => variants.push({ label: `popWall[${i}]`, activePopWalls: allWalls.map((__, j) => i === j) }));
  (level.popBumpers ?? []).forEach((_, i) => variants.push({ label: `popBumper[${i}]`, activePopBumpers: allBumpers.map((__, j) => i === j) }));
  (level.popVoids ?? []).forEach((_, i) => variants.push({ label: `popVoid[${i}]`, activePopVoids: allVoids.map((__, j) => i === j) }));
  if (allWalls.length + allBumpers.length + allVoids.length > 1) variants.push({ label: "all-traps", activePopWalls: allWalls, activePopBumpers: allBumpers, activePopVoids: allVoids });
  for (const t of [0.8, 1.6, 2.4]) if ((level.movingWalls?.length ?? 0) + (level.movingBumpers?.length ?? 0) > 0) variants.push({ label: `moving@${t.toFixed(1)}s`, time: t });
  return variants;
}

export function pointIsBlocked(level: LevelDefinition, p: Vec2, state: CourseValidationState, margin = BALL + SAFETY): boolean {
  if (p.x < FIELD.x + margin || p.x > FIELD.x + FIELD.w - margin || p.y < FIELD.y + margin || p.y > FIELD.y + FIELD.h - margin) return true;
  for (const r of blockingRects(level, state)) if (circleRectDistance(p, r) < margin) return true;
  for (const r of hazardRects(level, state)) if (pointInExpandedRect(p, r, BALL * 0.72)) return true;
  for (const b of blockers(level, state)) if (dist(p, b) < margin + b.r) return true;
  for (const t of level.triangles ?? []) if (pointNearTriangle(p, t, margin)) return true;
  for (const c of level.curves ?? []) if (pointNearCurve(p, c, margin)) return true;
  return false;
}

function segmentClear(level: LevelDefinition, a: Vec2, b: Vec2, state: CourseValidationState): boolean {
  const steps = Math.max(2, Math.ceil(dist(a, b) / 5));
  for (let i = 0; i <= steps; i += 1) {
    const q = i / steps;
    if (pointIsBlocked(level, { x: a.x + (b.x - a.x) * q, y: a.y + (b.y - a.y) * q }, state)) return false;
  }
  return true;
}

function nearestOpenCell(level: LevelDefinition, p: Vec2, state: CourseValidationState, cells: GridCell[]): number {
  let best = -1, bestD = Infinity;
  for (let i = 0; i < cells.length; i += 1) {
    const d = dist(p, cells[i]!.point);
    if (d < bestD && segmentClear(level, p, cells[i]!.point, state)) { best = i; bestD = d; }
  }
  return best;
}

export function analyzeReachability(level: LevelDefinition, state: CourseValidationState): ReachabilityResult {
  const cells: GridCell[] = [];
  const indexByGrid = new Map<string, number>();
  let gy = 0;
  for (let y = FIELD.y + BALL + SAFETY; y <= FIELD.y + FIELD.h - BALL - SAFETY; y += GRID, gy += 1) {
    let gx = 0;
    for (let x = FIELD.x + BALL + SAFETY; x <= FIELD.x + FIELD.w - BALL - SAFETY; x += GRID, gx += 1) {
      const point = { x, y };
      if (pointIsBlocked(level, point, state)) continue;
      const index = cells.length;
      cells.push({ point, gx, gy });
      indexByGrid.set(gridKey(gx, gy), index);
    }
  }

  const startBlocked = pointIsBlocked(level, level.ball, state), holeBlocked = pointIsBlocked(level, level.hole, state, BALL + 6);
  if (startBlocked || holeBlocked) return { stateLabel: state.label, reachable: false, visited: 0, startBlocked, holeBlocked };
  const start = nearestOpenCell(level, level.ball, state, cells), goal = nearestOpenCell(level, level.hole, state, cells);
  if (start < 0 || goal < 0) return { stateLabel: state.label, reachable: false, visited: 0, startBlocked, holeBlocked };

  const queue = [start], seen = new Set<number>([start]);
  while (queue.length) {
    const i = queue.shift()!;
    const cell = cells[i]!;
    if (i === goal || segmentClear(level, cell.point, level.hole, state)) return { stateLabel: state.label, reachable: true, visited: seen.size, startBlocked, holeBlocked };
    for (const dy of [-1, 0, 1]) for (const dx of [-1, 0, 1]) {
      if (dx === 0 && dy === 0) continue;
      const n = indexByGrid.get(gridKey(cell.gx + dx, cell.gy + dy));
      if (n === undefined || seen.has(n)) continue;
      if (!segmentClear(level, cell.point, cells[n]!.point, state)) continue;
      seen.add(n); queue.push(n);
    }
  }
  return { stateLabel: state.label, reachable: false, visited: seen.size, startBlocked, holeBlocked };
}

export function analyzeCourseClearance(level: LevelDefinition): CourseClearanceReport {
  const results = courseStateVariants(level).map((state) => analyzeReachability(level, state));
  return { id: level.id, results, blockingStates: results.filter((r) => !r.reachable).map((r) => r.stateLabel) };
}
