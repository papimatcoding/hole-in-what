import type { LevelDefinition } from "../../types";
import { buildCampaignCourse } from "./campaignGenerator";

export function buildHardCourse(index:number):LevelDefinition {
  return buildCampaignCourse("troll",index);
}
