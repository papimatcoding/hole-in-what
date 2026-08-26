import type { LevelDefinition } from "../../types";
import { buildCampaignCourse } from "./campaignGenerator";

export function buildClassicCourse(index:number):LevelDefinition {
  return buildCampaignCourse("classic",index);
}
