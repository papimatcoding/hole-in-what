import type { LevelDefinition, StarRequirement } from "../types";

export function requirementMet(requirement: StarRequirement, strokes: number, timeMs: number): boolean {
  if (requirement.maxStrokes !== undefined && strokes > requirement.maxStrokes) return false;
  if (requirement.maxTimeMs !== undefined && timeMs > requirement.maxTimeMs) return false;
  return true;
}

export function starsForRun(level: LevelDefinition, strokes: number, timeMs: number): number {
  if (requirementMet(level.threeStar, strokes, timeMs)) return 3;
  if (requirementMet(level.twoStar, strokes, timeMs)) return 2;
  return 1;
}

export function formatRequirement(requirement: StarRequirement, compact = false): string {
  const parts: string[] = [];

  if (requirement.maxStrokes !== undefined) {
    parts.push(compact ? `≤${requirement.maxStrokes}g` : `≤ ${requirement.maxStrokes} ${requirement.maxStrokes === 1 ? "golpe" : "golpes"}`);
  }

  if (requirement.maxTimeMs !== undefined) {
    const seconds = requirement.maxTimeMs / 1000;
    const label = Number.isInteger(seconds) ? seconds.toFixed(0) : seconds.toFixed(1);
    parts.push(compact ? `≤${label}s` : `≤ ${label} s`);
  }

  return parts.length > 0 ? parts.join(compact ? " · " : "  ·  ") : "Completar";
}

export function formatLevelGoals(level: LevelDefinition): { three: string; two: string } {
  return {
    three: formatRequirement(level.threeStar),
    two: formatRequirement(level.twoStar)
  };
}
