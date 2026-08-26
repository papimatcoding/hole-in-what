import type { CosmeticsSave, EquippedCosmetics, LevelRecord, SaveData, SaveDataV1 } from "../types";

const STORAGE_KEY = "troll-golf-save-v1";

const DEFAULT_EQUIPPED: EquippedCosmetics = {
  ball: "ball-classic",
  trail: "trail-none",
  holeEffect: "hole-default"
};

const DEFAULT_OWNED = [
  "ball-classic",
  "ball-midnight",
  "ball-spirit",
  "trail-none",
  "trail-mist",
  "trail-petals",
  "hole-default",
  "hole-pulse",
  "hole-bloom"
];

const emptyRecord = (): LevelRecord => ({
  completed: false,
  stars: 0,
  bestStrokes: null,
  bestTimeMs: null
});

const defaultCosmetics = (): CosmeticsSave => ({
  owned: [...DEFAULT_OWNED],
  equipped: { ...DEFAULT_EQUIPPED }
});

const emptySave = (): SaveData => ({
  version: 2,
  levels: {},
  cosmetics: defaultCosmetics()
});

function migrate(parsed: SaveData | SaveDataV1): SaveData {
  if (parsed.version === 2) {
    return {
      version: 2,
      levels: parsed.levels ?? {},
      cosmetics: parsed.cosmetics ?? defaultCosmetics()
    };
  }

  return {
    version: 2,
    levels: parsed.levels ?? {},
    cosmetics: defaultCosmetics()
  };
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as SaveData | SaveDataV1;
    if ((parsed.version !== 1 && parsed.version !== 2) || typeof parsed.levels !== "object") {
      throw new Error("Invalid save");
    }
    return migrate(parsed);
  } catch {
    return emptySave();
  }
}

function persist(save: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    // Some mobile webviews restrict storage; gameplay should still work.
  }
}

export const SaveSystem = {
  record(levelId: string): LevelRecord {
    const save = load();
    return save.levels[levelId] ?? emptyRecord();
  },

  submit(levelId: string, stars: number, strokes: number, timeMs: number): LevelRecord {
    const save = load();
    const current = save.levels[levelId] ?? emptyRecord();
    const next: LevelRecord = {
      completed: true,
      stars: Math.max(current.stars, stars),
      bestStrokes: current.bestStrokes === null ? strokes : Math.min(current.bestStrokes, strokes),
      bestTimeMs: current.bestTimeMs === null ? timeMs : Math.min(current.bestTimeMs, timeMs)
    };
    save.levels[levelId] = next;
    persist(save);
    return next;
  },

  totalStars(levelIds: string[]): number {
    const save = load();
    return levelIds.reduce((sum, id) => sum + (save.levels[id]?.stars ?? 0), 0);
  },

  cosmetics(): CosmeticsSave {
    return load().cosmetics;
  },

  isOwned(cosmeticId: string): boolean {
    return load().cosmetics.owned.includes(cosmeticId);
  },

  equip(slot: keyof EquippedCosmetics, cosmeticId: string): EquippedCosmetics {
    const save = load();
    if (!save.cosmetics.owned.includes(cosmeticId)) return save.cosmetics.equipped;
    save.cosmetics.equipped[slot] = cosmeticId;
    persist(save);
    return { ...save.cosmetics.equipped };
  },

  reset(): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
  }
};
