import type { GameMode, LevelDefinition } from "../types";
import { CLASSIC_AUTHORED } from "./authored/classic";
import { HARD_AUTHORED } from "./authored/hard";
import { sanitizeCourse } from "./procedural/courseUtils";

/** Player-facing campaign: authored levels only. No procedural or legacy fallback. */
const CLASSIC=CLASSIC_AUTHORED.map(level=>sanitizeCourse(level));
const HARD=HARD_AUTHORED.map(level=>sanitizeCourse(level));

export function levelsForMode(mode:GameMode):LevelDefinition[]{return mode==="troll"?HARD:CLASSIC;}

export function levelFor(mode:GameMode,index:number):LevelDefinition{
  const source=levelsForMode(mode);
  if(source.length===0)throw new Error(`No ${mode} campaign levels authored`);
  return source[Math.max(0,Math.min(source.length-1,index))]!;
}
