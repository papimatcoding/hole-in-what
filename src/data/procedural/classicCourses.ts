import type { LevelDefinition } from "../../types";
import { buildCampaignCourse } from "./campaignGenerator";
import { applyPostAuditBalance } from "./postAuditBalance";

export function buildClassicCourse(index:number):LevelDefinition {
  return applyPostAuditBalance(buildCampaignCourse("classic",index),index);
}
