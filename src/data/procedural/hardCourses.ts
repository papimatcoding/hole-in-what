import type { LevelDefinition } from "../../types";
import { buildCampaignCourse } from "./auditedCampaign";

export function buildHardCourse(index:number):LevelDefinition {
  return buildCampaignCourse("troll",index);
}
