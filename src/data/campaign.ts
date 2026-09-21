import type { GameMode, LevelDefinition } from "../types";
import { CLASSIC_AUTHORED } from "./authored/classic";
import { CLASSIC_BLOCK_2 } from "./authored/classicBlock2";
import { HARD_AUTHORED } from "./authored/hard";
import { sanitizeCourse } from "./procedural/courseUtils";

/** Player-facing campaign: authored levels only. No procedural or legacy fallback. */
const CLASSIC=[...CLASSIC_AUTHORED,...CLASSIC_BLOCK_2].map(level=>sanitizeCourse(level));
const HARD=HARD_AUTHORED.map(level=>sanitizeCourse(level));

export function levelsForMode(mode:GameMode):LevelDefinition[]{return mode==="troll"?HARD:CLASSIC;}

/** Unified presentation; legacy IDs/modes remain stable for saves, audits and telemetry.
 * Ordering is provisional until the level-by-level identity rework is certified. */
export const CAMPAIGN_ENTRIES=[...CLASSIC.map((level,levelIndex)=>({level,mode:"classic" as GameMode,levelIndex})),...HARD.map((level,levelIndex)=>({level,mode:"troll" as GameMode,levelIndex}))];
export function campaignIndex(mode:GameMode,levelIndex:number):number{return CAMPAIGN_ENTRIES.findIndex(entry=>entry.mode===mode&&entry.levelIndex===levelIndex);}

export function levelFor(mode:GameMode,index:number):LevelDefinition{
  const source=levelsForMode(mode);
  if(source.length===0)throw new Error(`No ${mode} campaign levels authored`);
  return source[Math.max(0,Math.min(source.length-1,index))]!;
}
