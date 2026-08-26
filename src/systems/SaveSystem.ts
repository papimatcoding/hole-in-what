import type { LevelRecord, SaveData } from "../types";

const STORAGE_KEY = "troll-golf-save-v1";

const emptyRecord = (): LevelRecord => ({
  completed: false,
  stars: 0,
  bestStrokes: null,
  bestTimeMs: null
});

function load(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, levels: {} };
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== 1 || typeof parsed.levels !== "object") throw new Error("Invalid save");
    return parsed;
  } catch {
    return { version: 1, levels: {} };
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

  reset(): void {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
  }
};
