import type { GameMode, LevelDefinition } from "../types";
import { buildCampaignCourse } from "./procedural/auditedCampaign";
import { sanitizeCourse } from "./procedural/courseUtils";

export const LEVELS_PER_MODE = 40;

const CLASSIC = Array.from({ length: LEVELS_PER_MODE }, (_, i) => sanitizeCourse(buildCampaignCourse("classic", i + 1)));
const HARD = Array.from({ length: LEVELS_PER_MODE }, (_, i) => sanitizeCourse(buildCampaignCourse("troll", i + 1)));

export function levelsForMode(mode: GameMode): LevelDefinition[] {
  return mode === "troll" ? HARD : CLASSIC;
}

export function levelFor(mode: GameMode, index: number): LevelDefinition {
  const source = levelsForMode(mode);
  return source[Math.max(0, Math.min(source.length - 1, index))] ?? source[0]!;
}
