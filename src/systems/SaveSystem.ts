import type {
  CosmeticsSave,
  EquippedCosmetics,
  LevelRecord,
  SaveData,
  SaveDataV1,
  SaveDataV2,
  SubmitResult,
  WalletSave
} from "../types";

const STORAGE_KEY = "troll-golf-save-v1";
const FRESH_START_COINS = 80;
const LEGACY_DEV_GRANT = 250;

const DEFAULT_EQUIPPED: EquippedCosmetics = {
  ball: "ball-classic",
  trail: "trail-none",
  holeEffect: "hole-default"
};

const DEFAULT_OWNED = [
  "ball-classic",
  "trail-none",
  "hole-default"
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

const defaultWallet = (coins = FRESH_START_COINS): WalletSave => ({ coins });

const emptySave = (): SaveData => ({
  version: 3,
  levels: {},
  cosmetics: defaultCosmetics(),
  wallet: defaultWallet()
});

function migrate(parsed: SaveData | SaveDataV2 | SaveDataV1): SaveData {
  if (parsed.version === 3) {
    return {
      version: 3,
      levels: parsed.levels ?? {},
      cosmetics: parsed.cosmetics ?? defaultCosmetics(),
      wallet: parsed.wallet ?? defaultWallet()
    };
  }

  if (parsed.version === 2) {
    return {
      version: 3,
      levels: parsed.levels ?? {},
      cosmetics: parsed.cosmetics ?? defaultCosmetics(),
      wallet: defaultWallet(LEGACY_DEV_GRANT)
    };
  }

  return {
    version: 3,
    levels: parsed.levels ?? {},
    cosmetics: defaultCosmetics(),
    wallet: defaultWallet(LEGACY_DEV_GRANT)
  };
}

function load(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as SaveData | SaveDataV2 | SaveDataV1;
    if (![1, 2, 3].includes(parsed.version) || typeof parsed.levels !== "object") {
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

  submit(levelId: string, stars: number, strokes: number, timeMs: number): SubmitResult {
    const save = load();
    const current = save.levels[levelId] ?? emptyRecord();
    const nextStars = Math.max(current.stars, stars);
    const gainedStars = Math.max(0, nextStars - current.stars);
    const firstClearBonus = current.completed ? 0 : 10;
    const coinsEarned = firstClearBonus + gainedStars * 20;

    const next: LevelRecord = {
      completed: true,
      stars: nextStars,
      bestStrokes: current.bestStrokes === null ? strokes : Math.min(current.bestStrokes, strokes),
      bestTimeMs: current.bestTimeMs === null ? timeMs : Math.min(current.bestTimeMs, timeMs)
    };

    save.levels[levelId] = next;
    save.wallet.coins += coinsEarned;
    persist(save);

    return {
      record: next,
      coinsEarned,
      totalCoins: save.wallet.coins
    };
  },

  totalStars(levelIds: string[]): number {
    const save = load();
    return levelIds.reduce((sum, id) => sum + (save.levels[id]?.stars ?? 0), 0);
  },

  coins(): number {
    return load().wallet.coins;
  },

  cosmetics(): CosmeticsSave {
    return load().cosmetics;
  },

  isOwned(cosmeticId: string): boolean {
    return load().cosmetics.owned.includes(cosmeticId);
  },

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

  reset(): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
  }
};
