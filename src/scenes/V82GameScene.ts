import { V81GameScene } from "./V81GameScene";
import { finalizeV82Level } from "../data/v82Course";
import type { GameSceneData, LevelDefinition } from "../types";

export class V82GameScene extends V81GameScene {
  init(data: GameSceneData): void {
    super.init(data);
    const current = (this as unknown as { level: LevelDefinition }).level;
    (this as unknown as { level: LevelDefinition }).level = finalizeV82Level(current);
  }
}
