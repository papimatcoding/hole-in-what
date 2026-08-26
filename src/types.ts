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

export interface TriangleDef {
  a: Vec2;
  b: Vec2;
  c: Vec2;
}

export interface BoosterDef extends RectDef {
  dx: number;
  dy: number;
  power?: number;
}

export interface RampDef extends RectDef {
  dx: number;
  dy: number;
  lift?: number;
  boost?: number;
}

export interface TrampolineDef {
  x: number;
  y: number;
  r: number;
  power?: number;
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

export interface PopVoidDef extends RectDef {
  triggerX: number;
  triggerY: number;
  triggerRadius: number;
}

export interface StarRequirement {
  maxStrokes?: number;
  maxTimeMs?: number;
}

export interface LevelDefinition {
  id: string;
  mode: GameMode;
  group: number;
  ball: Vec2;
  hole: Vec2;
  threeStar: StarRequirement;
  twoStar: StarRequirement;
  walls?: RectDef[];
  triangles?: TriangleDef[];
  sand?: RectDef[];
  ice?: RectDef[];
  voids?: RectDef[];
  boosters?: BoosterDef[];
  ramps?: RampDef[];
  trampolines?: TrampolineDef[];
  bumpers?: BumperDef[];
  popWalls?: PopWallDef[];
  popBumpers?: PopBumperDef[];
  popVoids?: PopVoidDef[];
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
