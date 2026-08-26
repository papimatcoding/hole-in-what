import type { LevelDefinition } from "../../types";
import { buildCampaignCourse } from "./auditedCampaign";

export function buildClassicCourse(index:number):LevelDefinition {
  return buildCampaignCourse("classic",index);
}
