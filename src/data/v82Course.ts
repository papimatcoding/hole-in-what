import { buildClassicCourse } from "./procedural/classicCourses";
import { buildHardCourse } from "./procedural/hardCourses";
import { sanitizeCourse } from "./procedural/courseUtils";
import type { GameMode, LevelDefinition } from "../types";

const CLASSIC = Array.from({ length: 20 }, (_, i) => sanitizeCourse(buildClassicCourse(i + 1)));
const HARD = Array.from({ length: 20 }, (_, i) => sanitizeCourse(buildHardCourse(i + 1)));

function indexFromId(id: string): number {
  const value = Number(id.split("-").at(-1));
  return Number.isFinite(value) ? Math.max(0, Math.min(19, value - 1)) : 0;
}

export function finalizeV82Level(level: LevelDefinition): LevelDefinition {
  const source = level.mode === "troll" ? HARD : CLASSIC;
  return source[indexFromId(level.id)] ?? source[0]!;
}

export function v82LevelsForMode(mode: GameMode): LevelDefinition[] {
  return mode === "troll" ? HARD : CLASSIC;
}
