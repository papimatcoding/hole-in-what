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

export interface FanDef extends RectDef {
  dx: number;
  dy: number;
  strength?: number;
}

export type WindDef = FanDef;

export interface PortalPointDef {
  x: number;
  y: number;
  r?: number;
}

export interface PortalPairDef {
  a: PortalPointDef;
  b: PortalPointDef;
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

export interface MovingWallDef extends RectDef {
  axis: "x" | "y";
  amplitude: number;
  speed?: number;
  phase?: number;
}

export interface MovingBumperDef extends BumperDef {
  axis: "x" | "y";
  amplitude: number;
  speed?: number;
  phase?: number;
}

export interface CurveDef {
  x: number;
  y: number;
  r: number;
  startAngle: number;
  endAngle: number;
  thickness?: number;
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

export type CourseMechanic =
  | "wall"
  | "bumper"
  | "sand"
  | "ice"
  | "booster"
  | "fan"
  | "curve"
  | "portal"
  | "moving"
  | "void"
  | "ramp"
  | "trampoline";

export type TrollTrapArchetype =
  | "gate-pop"
  | "bumper-ambush"
  | "floor-drop"
  | "cross-gate"
  | "safe-lane-collapse"
  | "rebound-punish"
  | "late-combo";

export interface StarRequirement {
  maxStrokes?: number;
  /** Retained for old saves/data compatibility. Current campaign stars are stroke-only. */
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
  /** Hand-authored courses bypass procedural geometry patches but still use common sanitising/auditing. */
  authored?: boolean;
  /** Intended route used by deterministic generation, auditing and bot research. */
  designPath?: Vec2[];
  /** Mechanic the authored mastery route is expected to engage with. */
  primaryMechanic?: CourseMechanic;
  /** HARD surprise grammar. Pure metadata; gameplay is still expressed by normal primitives. */
  trollArchetype?: TrollTrapArchetype;
  fairways?: RectDef[];
  walls?: RectDef[];
  triangles?: TriangleDef[];
  curves?: CurveDef[];
  movingWalls?: MovingWallDef[];
  movingBumpers?: MovingBumperDef[];
  sand?: RectDef[];
  ice?: RectDef[];
  boosters?: BoosterDef[];
  fans?: FanDef[];
  winds?: WindDef[];
  portals?: PortalPairDef[];
  ramps?: RampDef[];
  trampolines?: TrampolineDef[];
  voids?: RectDef[];
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
  trapsTriggered?: string[];
  mechanicsUsed?: string[];
  voids?: number;
}
