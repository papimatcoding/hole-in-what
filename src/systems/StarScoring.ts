import type { LevelDefinition, StarRequirement } from "../types";

/** Campaign stars reward route quality. Time is deliberately a separate personal record. */
export function requirementMet(requirement: StarRequirement, strokes: number, _timeMs = 0): boolean {
  if (requirement.maxStrokes !== undefined && strokes > requirement.maxStrokes) return false;
  return true;
}

export function starsForRun(level: LevelDefinition, strokes: number, timeMs = 0): number {
  if (requirementMet(level.threeStar, strokes, timeMs)) return 3;
  if (requirementMet(level.twoStar, strokes, timeMs)) return 2;
  return 1;
}

export function formatRequirement(requirement: StarRequirement, compact = false): string {
  if (requirement.maxStrokes === undefined) return "Completar";
  if (compact) return `≤${requirement.maxStrokes}g`;
  return `≤ ${requirement.maxStrokes} ${requirement.maxStrokes === 1 ? "golpe" : "golpes"}`;
}

export function formatLevelGoals(level: LevelDefinition): { three: string; two: string } {
  return { three: formatRequirement(level.threeStar), two: formatRequirement(level.twoStar) };
}
