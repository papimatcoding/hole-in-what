import { buildClassicCourse } from "./procedural/classicCourses";
import { buildHardCourse } from "./procedural/hardCourses";
import { sanitizeCourse } from "./procedural/courseUtils";
import type { GameMode, LevelDefinition } from "../types";

const LEVELS_PER_MODE = 40;
const CLASSIC = Array.from({ length: LEVELS_PER_MODE }, (_, i) => sanitizeCourse(buildClassicCourse(i + 1)));
const HARD = Array.from({ length: LEVELS_PER_MODE }, (_, i) => sanitizeCourse(buildHardCourse(i + 1)));

function indexFromId(id: string): number {
  const value = Number(id.split("-").at(-1));
  return Number.isFinite(value) ? Math.max(0, Math.min(LEVELS_PER_MODE - 1, value - 1)) : 0;
}

export function finalizeV82Level(level: LevelDefinition): LevelDefinition {
  const source = level.mode === "troll" ? HARD : CLASSIC;
  return source[indexFromId(level.id)] ?? source[0]!;
}

export function v82LevelsForMode(mode: GameMode): LevelDefinition[] {
  return mode === "troll" ? HARD : CLASSIC;
}
