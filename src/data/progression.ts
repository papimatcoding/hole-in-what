import type { LevelRecord } from "../types";

export interface StarRewardDefinition {
  id: string;
  stars: number;
  cosmeticId: string;
}

export interface CampaignChapterDefinition {
  index: number;
  id: string;
  name: string;
  requiredStars: number;
  claimRewardId: string | null;
  mechanics: string[];
}

export type PrestigeRewardDefinition =
  | { id:string; stars:number; kind:"cosmetic"; cosmeticId:string }
  | { id:string; stars:number; kind:"chapter"; chapterIndex:number };

// Legacy unlock constants kept while the old mode split still exists internally.
export const TROLL_UNLOCK_STARS = 12;
export const TROLL_UNLOCK_CLASSIC_COMPLETIONS = 5;

export const CAMPAIGN_CHAPTER_SIZE = 10;
export const CAMPAIGN_CHAPTER_STAR_STEP = 18;

export const CAMPAIGN_CHAPTERS:CampaignChapterDefinition[]=[
  {
    index:0,
    id:"grassland",
    name:"GRASSLAND",
    requiredStars:0,
    claimRewardId:null,
    mechanics:["GEOMETRÍA","BUMPERS","RAMPAS"]
  },
  {
    index:1,
    id:"metropolis",
    name:"METROPOLIS",
    requiredStars:18,
    claimRewardId:"chapter-metropolis",
    mechanics:["GEOMETRÍA URBANA","NUEVAS MECÁNICAS"]
  }
];

export function campaignChapterDefinition(chapterIndex:number):CampaignChapterDefinition{
  const index=Math.max(0,Math.floor(chapterIndex));
  return CAMPAIGN_CHAPTERS[index]??{
    index,
    id:`chapter-${index+1}`,
    name:`CAPÍTULO ${index+1}`,
    requiredStars:index*CAMPAIGN_CHAPTER_STAR_STEP,
    claimRewardId:`chapter-${index+1}`,
    mechanics:["PRÓXIMAMENTE"]
  };
}

export function requiredStarsForCampaignChapter(chapterIndex:number):number{
  return campaignChapterDefinition(chapterIndex).requiredStars;
}

export const PRESTIGE_REWARDS:PrestigeRewardDefinition[]=[
  {id:"prestige-trail-stardust",stars:10,kind:"cosmetic",cosmeticId:"trail-stardust"},
  {id:"chapter-metropolis",stars:18,kind:"chapter",chapterIndex:1},
  {id:"prestige-ball-ace",stars:20,kind:"cosmetic",cosmeticId:"ball-ace"},
  {id:"prestige-trail-aurora",stars:35,kind:"cosmetic",cosmeticId:"trail-aurora"},
  {id:"prestige-ball-prism",stars:50,kind:"cosmetic",cosmeticId:"ball-prism"}
];

// Compatibility export for systems that only care about cosmetic milestones.
export const STAR_REWARDS:StarRewardDefinition[]=PRESTIGE_REWARDS
  .filter((reward):reward is Extract<PrestigeRewardDefinition,{kind:"cosmetic"}>=>reward.kind==="cosmetic")
  .map(reward=>({id:reward.id,stars:reward.stars,cosmeticId:reward.cosmeticId}));

export function totalStarsFromRecords(records:Record<string,LevelRecord>):number{
  return Object.values(records).reduce((sum,record)=>sum+(record?.stars??0),0);
}

export function starRewardForCosmetic(cosmeticId:string):StarRewardDefinition|undefined{
  return STAR_REWARDS.find(reward=>reward.cosmeticId===cosmeticId);
}

export function prestigeRewardById(id:string):PrestigeRewardDefinition|undefined{
  return PRESTIGE_REWARDS.find(reward=>reward.id===id);
}
