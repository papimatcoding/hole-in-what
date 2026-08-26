import { levelsForMode } from "../data/levels";
import { STAR_REWARDS, TROLL_UNLOCK_STARS, totalStarsFromRecords } from "../data/progression";
import type {
  CosmeticsSave,
  EquippedCosmetics,
  LevelRecord,
  SaveData,
  SaveDataV1,
  SaveDataV2,
  SaveDataV3,
  SubmitResult,
  WalletSave
} from "../types";

// V8.3 procedural beta intentionally starts from a clean local save.
const STORAGE_KEY = "troll-golf-save-procedural-v1";
const FRESH_START_COINS = 80;
const LEGACY_DEV_GRANT = 250;

const DEFAULT_EQUIPPED: EquippedCosmetics = {
  ball: "ball-classic",
  trail: "trail-none",
  holeEffect: "hole-default"
};

const DEFAULT_OWNED = ["ball-classic", "trail-none", "hole-default"];

const emptyRecord = (): LevelRecord => ({
  completed: false,
  stars: 0,
  bestStrokes: null,
  bestTimeMs: null
});

const defaultCosmetics = (): CosmeticsSave => ({ owned: [...DEFAULT_OWNED], equipped: { ...DEFAULT_EQUIPPED } });
const defaultWallet = (coins = FRESH_START_COINS, gems = 0): WalletSave => ({ coins, gems });
const emptySave = (): SaveData => ({ version: 4, levels: {}, cosmetics: defaultCosmetics(), wallet: defaultWallet() });

function migrate(parsed: SaveData | SaveDataV3 | SaveDataV2 | SaveDataV1): SaveData {
  if (parsed.version === 4) return { version: 4, levels: parsed.levels ?? {}, cosmetics: parsed.cosmetics ?? defaultCosmetics(), wallet: parsed.wallet ?? defaultWallet() };
  if (parsed.version === 3) return { version: 4, levels: parsed.levels ?? {}, cosmetics: parsed.cosmetics ?? defaultCosmetics(), wallet: defaultWallet(parsed.wallet?.coins ?? FRESH_START_COINS, 0) };
  if (parsed.version === 2) return { version: 4, levels: parsed.levels ?? {}, cosmetics: parsed.cosmetics ?? defaultCosmetics(), wallet: defaultWallet(LEGACY_DEV_GRANT, 0) };
  return { version: 4, levels: parsed.levels ?? {}, cosmetics: defaultCosmetics(), wallet: defaultWallet(LEGACY_DEV_GRANT, 0) };
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as SaveData | SaveDataV3 | SaveDataV2 | SaveDataV1;
    if (![1, 2, 3, 4].includes(parsed.version) || typeof parsed.levels !== "object") throw new Error("Invalid save");
    return migrate(parsed);
  } catch { return emptySave(); }
}

function persist(save: SaveData): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(save)); } catch { /* gameplay can continue */ }
}

function unlockEligibleStarRewards(save: SaveData): string[] {
  const totalStars = totalStarsFromRecords(save.levels);
  const unlocked: string[] = [];
  for (const reward of STAR_REWARDS) {
    if (totalStars < reward.stars || save.cosmetics.owned.includes(reward.cosmeticId)) continue;
    save.cosmetics.owned.push(reward.cosmeticId);
    unlocked.push(reward.cosmeticId);
  }
  return unlocked;
}

export const SaveSystem = {
  record(levelId: string): LevelRecord { return load().levels[levelId] ?? emptyRecord(); },

  submit(levelId: string, stars: number, strokes: number, timeMs: number): SubmitResult {
    const save = load();
    const current = save.levels[levelId] ?? emptyRecord();
    const nextStars = Math.max(current.stars, stars);
    const gainedStars = Math.max(0, nextStars - current.stars);
    const coinsEarned = (current.completed ? 0 : 10) + gainedStars * 20;
    const next: LevelRecord = {
      completed: true,
      stars: nextStars,
      bestStrokes: current.bestStrokes === null ? strokes : Math.min(current.bestStrokes, strokes),
      bestTimeMs: current.bestTimeMs === null ? timeMs : Math.min(current.bestTimeMs, timeMs)
    };
    save.levels[levelId] = next;
    save.wallet.coins += coinsEarned;
    const newlyUnlockedCosmetics = unlockEligibleStarRewards(save);
    persist(save);
    return { record: next, coinsEarned, totalCoins: save.wallet.coins, totalGems: save.wallet.gems, newlyUnlockedCosmetics };
  },

  totalStars(levelIds: string[]): number {
    const save = load();
    return levelIds.reduce((sum, id) => sum + (save.levels[id]?.stars ?? 0), 0);
  },
  totalStarsAll(): number { return totalStarsFromRecords(load().levels); },
  wallet(): WalletSave { return { ...load().wallet }; },
  coins(): number { return load().wallet.coins; },
  gems(): number { return load().wallet.gems; },
  cosmetics(): CosmeticsSave { return load().cosmetics; },

  claimEligibleStarRewards(): string[] {
    const save = load();
    const unlocked = unlockEligibleStarRewards(save);
    if (unlocked.length > 0) persist(save);
    return unlocked;
  },

  classicProgress(): { stars: number; completed: number; total: number; requiredStars: number } {
    const save = load();
    const levels = levelsForMode("classic");
    const stars = levels.reduce((sum, level) => sum + (save.levels[level.id]?.stars ?? 0), 0);
    const completed = levels.reduce((sum, level) => sum + (save.levels[level.id]?.completed ? 1 : 0), 0);
    return { stars, completed, total: levels.length, requiredStars: TROLL_UNLOCK_STARS };
  },
  isTrollUnlocked(): boolean {
    const progress = this.classicProgress();
    return progress.stars >= progress.requiredStars || progress.completed >= progress.total;
  },
  isOwned(cosmeticId: string): boolean { return load().cosmetics.owned.includes(cosmeticId); },

  purchase(cosmeticId: string, price: number): boolean {
    const save = load();
    if (save.cosmetics.owned.includes(cosmeticId)) return true;
    if (price < 0 || save.wallet.coins < price) return false;
    save.wallet.coins -= price;
    save.cosmetics.owned.push(cosmeticId);
    persist(save);
    return true;
  },

  equip(slot: keyof EquippedCosmetics, cosmeticId: string): EquippedCosmetics {
    const save = load();
    if (!save.cosmetics.owned.includes(cosmeticId)) return save.cosmetics.equipped;
    save.cosmetics.equipped[slot] = cosmeticId;
    persist(save);
    return { ...save.cosmetics.equipped };
  },

  reset(): void { try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ } }
};
