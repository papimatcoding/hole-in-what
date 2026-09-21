import type { LevelRecord } from "../types";

export interface StarRewardDefinition {
  stars: number;
  cosmeticId: string;
}

// HARD is Troll Golf's hook. During the authored reboot it should appear inside the first batch,
// not after the player has exhausted Classic.
export const TROLL_UNLOCK_STARS = 12;
export const TROLL_UNLOCK_CLASSIC_COMPLETIONS = 5;

// Campaign chapters are presentation-sized blocks. A new chapter asks for a modest replay
// investment instead of opening from one linear clear alone. Keep this balance in one place so
// future chapters can tune it without touching scenes or save data.
export const CAMPAIGN_CHAPTER_SIZE = 10;
export const CAMPAIGN_CHAPTER_STAR_STEP = 18;

export function requiredStarsForCampaignChapter(chapterIndex: number): number {
  return Math.max(0, Math.floor(chapterIndex)) * CAMPAIGN_CHAPTER_STAR_STEP;
}

export const STAR_REWARDS: StarRewardDefinition[] = [
  { stars: 10, cosmeticId: "trail-stardust" },
  { stars: 20, cosmeticId: "ball-ace" },
  { stars: 35, cosmeticId: "trail-aurora" },
  { stars: 50, cosmeticId: "ball-prism" }
];

export function totalStarsFromRecords(records: Record<string, LevelRecord>): number {
  return Object.values(records).reduce((sum, record) => sum + (record?.stars ?? 0), 0);
}

export function starRewardForCosmetic(cosmeticId: string): StarRewardDefinition | undefined {
  return STAR_REWARDS.find((reward) => reward.cosmeticId === cosmeticId);
}
