import type { GameMode, LevelDefinition } from "../../types";
import { buildCampaignCourse as buildRawCampaignCourse } from "./campaignGenerator";
import { applyPostAuditBalance } from "./postAuditBalance";

export function buildCampaignCourse(mode:GameMode,index:number):LevelDefinition {
  return applyPostAuditBalance(buildRawCampaignCourse(mode,index),index);
}
