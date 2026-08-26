import type { GameMode, LevelDefinition } from "../../types";
import { authoredCourse } from "../authoredVerticalSlice";
import { buildCampaignCourse as buildRawCampaignCourse } from "./campaignGenerator";
import { applyPostAuditBalance } from "./postAuditBalance";

export function buildCampaignCourse(mode:GameMode,index:number):LevelDefinition {
  const authored=authoredCourse(mode,index);
  return applyPostAuditBalance(authored??buildRawCampaignCourse(mode,index),index);
}
