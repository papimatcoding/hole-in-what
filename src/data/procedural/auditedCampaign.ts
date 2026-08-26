import type { GameMode, LevelDefinition } from "../../types";
import { authoredCourse } from "../authoredVerticalSlice";
import { applyPostAuditBalance } from "./postAuditBalance";

/**
 * Player-facing campaign is fully authored. Procedural generation remains available elsewhere as
 * a design/prototyping tool, but it must never silently substitute a shipped course.
 */
export function buildCampaignCourse(mode:GameMode,index:number):LevelDefinition {
  const authored=authoredCourse(mode,index);
  if(!authored)throw new Error(`Missing authored campaign course: ${mode}-${String(index).padStart(2,"0")}`);
  return applyPostAuditBalance(authored,index);
}
