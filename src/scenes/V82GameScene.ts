import { V81GameScene } from "./V81GameScene";
import { finalizeV82Level } from "../data/v82Course";
import type { GameSceneData, LevelDefinition } from "../types";

interface RuntimeBall {
  vx: number;
  vy: number;
  vz: number;
}

const SOFT_SPEED = 1220;
const HARD_SPEED = 1360;
const MAX_VERTICAL_SPEED = 475;

export class V82GameScene extends V81GameScene {
  init(data: GameSceneData): void {
    super.init(data);
    const current = (this as unknown as { level: LevelDefinition }).level;
    (this as unknown as { level: LevelDefinition }).level = finalizeV82Level(current);
  }

  update(time: number, deltaMs: number): void {
    super.update(time, deltaMs);
    this.smoothModifierSpikes();
  }

  private smoothModifierSpikes(): void {
    const ball = (this as unknown as { ball: RuntimeBall }).ball;
    if (!ball) return;

    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed > SOFT_SPEED) {
      // Preserve direction while compressing only the excessive part of the speed curve.
      const excess = speed - SOFT_SPEED;
      const target = Math.min(HARD_SPEED, SOFT_SPEED + excess * 0.32);
      const scale = target / speed;
      ball.vx *= scale;
      ball.vy *= scale;
    }

    if (Math.abs(ball.vz) > MAX_VERTICAL_SPEED) {
      ball.vz = Math.sign(ball.vz) * MAX_VERTICAL_SPEED;
    }
  }
}
