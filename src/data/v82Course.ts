import { levelsForMode } from "./levels";
import { applyV81LevelPatch } from "./v81LevelPatches";
import type { GameMode, LevelDefinition } from "../types";

export function finalizeV82Level(level: LevelDefinition): LevelDefinition {
  const next = applyV81LevelPatch(level);

  switch (next.id) {
    case "classic-13":
      return {
        ...next,
        walls: [
          {x:70,y:610,w:205,h:24},
          {x:310,y:295,w:24,h:130}
        ]
      };

    case "classic-19":
      return {
        ...next,
        walls: [
          {x:165,y:730,w:285,h:24},
          {x:90,y:500,w:255,h:24},
          {x:240,y:300,w:220,h:24}
        ]
      };

    case "troll-13":
      return {
        ...next,
        walls: [
          {x:90,y:630,w:190,h:24},
          {x:310,y:295,w:24,h:125}
        ]
      };

    case "troll-20":
      return {
        ...next,
        popVoids: [
          {x:245,y:210,w:150,h:58,triggerX:335,triggerY:385,triggerRadius:100}
        ]
      };

    default:
      return next;
  }
}

export function v82LevelsForMode(mode: GameMode): LevelDefinition[] {
  return levelsForMode(mode).map(finalizeV82Level);
}
