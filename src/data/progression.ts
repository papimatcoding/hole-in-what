import type { LevelRecord } from "../types";

export interface StarRewardDefinition {
  stars: number;
  cosmeticId: string;
}

// HARD is Troll Golf's hook. During the authored reboot it should appear inside the first batch,
// not after the player has exhausted Classic.
export const TROLL_UNLOCK_STARS = 12;
export const TROLL_UNLOCK_CLASSIC_COMPLETIONS = 5;

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
