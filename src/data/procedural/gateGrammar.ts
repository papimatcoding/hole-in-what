import type { GameMode, LevelDefinition, Vec2 } from "../../types";
import { FIELD, WALL, blank, r, setDesignPath, type Rng } from "./courseUtils";

export interface GateSpec {
  y: number;
  x: number;
  width: number;
}

export interface GateCourse {
  level: LevelDefinition;
  gates: GateSpec[];
}

interface GateCourseOptions {
  gateCount: number;
  difficulty: number;
  ballX?: number;
  holeX?: number;
  minGap?: number;
  maxGap?: number;
  forceCenters?: number[];
}

const CENTERS = [120, 270, 420];
const clamp = (value:number,min:number,max:number):number => Math.max(min,Math.min(max,value));

function gateYs(count:number):number[] {
  if (count <= 1) return [500];
  const bottom = 690;
  const top = 300;
  return Array.from({ length: count }, (_, i) => Math.round(bottom + (top - bottom) * (i / (count - 1))));
}

function chooseCenter(rng:Rng, previous:number | null, difficulty:number):number {
  const candidates = previous === null
    ? [...CENTERS]
    : CENTERS.filter(x => Math.abs(x - previous) >= (difficulty > 0.45 ? 140 : 90));
  return candidates[rng.int(0, candidates.length - 1)] ?? CENTERS[1]!;
}

export function addGate(level:LevelDefinition, gate:GateSpec):void {
  const leftEdge = clamp(gate.x - gate.width / 2, FIELD.left + 10, FIELD.right - 40);
  const rightEdge = clamp(gate.x + gate.width / 2, FIELD.left + 40, FIELD.right - 10);
  if (leftEdge > FIELD.left) level.walls!.push(r(FIELD.left, gate.y, leftEdge - FIELD.left, WALL));
  if (rightEdge < FIELD.right) level.walls!.push(r(rightEdge, gate.y, FIELD.right - rightEdge, WALL));
}

export function buildGateCourse(mode:GameMode,index:number,rng:Rng,options:GateCourseOptions):GateCourse {
  const minGap = options.minGap ?? 104;
  const maxGap = options.maxGap ?? 174;
  const baseGap = Math.round(maxGap - (maxGap - minGap) * clamp(options.difficulty,0,1));
  const ys = gateYs(options.gateCount);
  const forced = options.forceCenters ?? [];

  const centers:number[] = [];
  let previous:number | null = null;
  for (let i = 0; i < options.gateCount; i += 1) {
    const center = forced[i] ?? chooseCenter(rng, previous, options.difficulty);
    centers.push(center);
    previous = center;
  }

  const ballX = options.ballX ?? (centers[0]! < 270 ? 420 : 120);
  const holeX = options.holeX ?? (centers[centers.length - 1]! < 270 ? 420 : 120);
  const level = blank(mode,index,ballX,holeX);

  const gates = ys.map((y,i):GateSpec => ({
    y,
    x: centers[i]!,
    width: clamp(baseGap + rng.int(-8,8), minGap, maxGap)
  }));
  for (const gate of gates) addGate(level,gate);

  const route:Vec2[] = gates.map(gate => ({ x: gate.x, y: gate.y + 34 }));
  setDesignPath(level,route);

  // From the second half onward, add one purposeful side rail between some gates.
  // It prevents lazy diagonal cheesing without turning the field into a maze.
  if (options.difficulty >= 0.48 && gates.length >= 2) {
    for (let i = 0; i < gates.length - 1; i += 2) {
      const lower = gates[i]!;
      const upper = gates[i + 1]!;
      const movingRight = upper.x > lower.x;
      const railX = movingRight ? FIELD.left + 82 : FIELD.right - 106;
      const y = upper.y + WALL + 28;
      const h = Math.max(70, lower.y - y - 34);
      if (h > 70) level.walls!.push(r(railX,y,WALL,h));
    }
  }

  return { level, gates };
}

export function gateApproach(gate:GateSpec, offset=72):Vec2 {
  return { x: gate.x, y: gate.y + offset };
}

export function gateExit(gate:GateSpec, offset=62):Vec2 {
  return { x: gate.x, y: gate.y - offset };
}

export function rectAroundGate(gate:GateSpec,height:number,padding=8):{x:number;y:number;w:number;h:number} {
  return {
    x: gate.x - gate.width / 2 + padding,
    y: gate.y - height / 2,
    w: Math.max(48, gate.width - padding * 2),
    h: height
  };
}
