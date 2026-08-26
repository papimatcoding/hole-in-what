import type { GameMode, LevelDefinition } from "../types";
import { CLASSIC_AUTHORED } from "./authored/classic";
import { HARD_AUTHORED } from "./authored/hard";
import { finalizeAuthored } from "./authored/finalize";

/**
 * Full authored campaign. The procedural generator remains in the repository as a prototyping
 * tool, but player-facing campaign levels must come from this source so missing authored content
 * fails loudly instead of silently falling back to a template.
 */
export function authoredCourse(mode:GameMode,index:number):LevelDefinition|null{
  const source=mode==="classic"?CLASSIC_AUTHORED:HARD_AUTHORED;
  const level=source[index-1];
  return level?finalizeAuthored(level):null;
}
