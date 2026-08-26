export type GameMode = "classic" | "troll";

export interface Vec2 {
  x: number;
  y: number;
}

export interface RectDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BumperDef {
  x: number;
  y: number;
  r: number;
}

export interface PopWallDef extends RectDef {
  triggerX: number;
  triggerY: number;
  triggerRadius: number;
}

export interface PopBumperDef extends BumperDef {
  triggerX: number;
  triggerY: number;
  triggerRadius: number;
}

export interface LevelDefinition {
  id: string;
  mode: GameMode;
  group: number;
  ball: Vec2;
  hole: Vec2;
  threeStars: number;
  twoStars: number;
  walls?: RectDef[];
  sand?: RectDef[];
  bumpers?: BumperDef[];
  popWalls?: PopWallDef[];
  popBumpers?: PopBumperDef[];
}

export interface LevelRecord {
  completed: boolean;
  stars: number;
  bestStrokes: number | null;
  bestTimeMs: number | null;
}

export interface EquippedCosmetics {
  ball: string;
  trail: string;
  holeEffect: string;
}

export interface CosmeticsSave {
  owned: string[];
  equipped: EquippedCosmetics;
}

export interface WalletSave {
  coins: number;
  gems: number;
}

export interface SaveDataV1 {
  version: 1;
  levels: Record<string, LevelRecord>;
}

export interface SaveDataV2 {
  version: 2;
  levels: Record<string, LevelRecord>;
  cosmetics: CosmeticsSave;
}

export interface SaveDataV3 {
  version: 3;
  levels: Record<string, LevelRecord>;
  cosmetics: CosmeticsSave;
  wallet: { coins: number };
}

export interface SaveData {
  version: 4;
  levels: Record<string, LevelRecord>;
  cosmetics: CosmeticsSave;
  wallet: WalletSave;
}

export interface SubmitResult {
  record: LevelRecord;
  coinsEarned: number;
  totalCoins: number;
  totalGems: number;
  newlyUnlockedCosmetics: string[];
}

export interface GameSceneData {
  mode: GameMode;
  levelIndex: number;
}

export interface ResultsSceneData extends GameSceneData {
  levelId: string;
  strokes: number;
  timeMs: number;
  stars: number;
}
