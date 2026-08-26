import Phaser from "phaser";
import { V8GameScene } from "./V8GameScene";
import type { LevelDefinition, RectDef, TriangleDef } from "../types";

const FIELD = { x: 28, y: 28, w: 484, h: 904 };

export class V81GameScene extends V8GameScene {
  private coursePolish!: Phaser.GameObjects.Graphics;

  create(): void {
    super.create();
    this.coursePolish = this.add.graphics().setDepth(1);
    this.drawCoursePolish();
  }

  private levelRef(): LevelDefinition {
    return (this as unknown as { level: LevelDefinition }).level;
  }

  private drawCoursePolish(): void {
    const level = this.levelRef();
    const g = this.coursePolish;
    g.clear();

    this.drawFairways(g, level.fairways ?? []);
    this.drawTee(g, level.ball.x, level.ball.y);
    this.drawGrassFibres(g, level);

    for (const wall of level.walls ?? []) this.drawRailDetail(g, wall);
    for (const triangle of level.triangles ?? []) this.drawTriangleDetail(g, triangle);
  }

  private drawFairways(g: Phaser.GameObjects.Graphics, fairways: RectDef[]): void {
    for (const lane of fairways) {
      const radius = Math.min(22, lane.w * 0.18, lane.h * 0.18);

      g.fillStyle(0xbfe6ae, 0.055);
      g.fillRoundedRect(lane.x, lane.y, lane.w, lane.h, radius);
      g.lineStyle(1, 0xd9efce, 0.10);
      g.strokeRoundedRect(lane.x + 1, lane.y + 1, lane.w - 2, lane.h - 2, Math.max(2, radius - 1));

      const horizontal = lane.w > lane.h * 1.4;
      const vertical = lane.h > lane.w * 1.4;
      g.lineStyle(1, 0xffffff, 0.032);

      if (horizontal) {
        const y = lane.y + lane.h / 2;
        for (let x = lane.x + 18; x < lane.x + lane.w - 10; x += 38) {
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(Math.min(x + 15, lane.x + lane.w - 10), y);
          g.strokePath();
        }
      } else if (vertical) {
        const x = lane.x + lane.w / 2;
        for (let y = lane.y + 18; y < lane.y + lane.h - 10; y += 38) {
          g.beginPath();
          g.moveTo(x, y);
          g.lineTo(x, Math.min(y + 15, lane.y + lane.h - 10));
          g.strokePath();
        }
      }
    }
  }

  private drawTee(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x17331f, 0.16);
    g.fillEllipse(x + 2, y + 6, 48, 22);
    g.lineStyle(2, 0xdaf2d3, 0.20);
    g.strokeCircle(x, y, 22);
    g.lineStyle(1, 0xffffff, 0.08);
    g.strokeCircle(x, y, 16);
  }

  private drawGrassFibres(g: Phaser.GameObjects.Graphics, level: LevelDefinition): void {
    g.lineStyle(1, 0xd8f2cf, 0.055);

    for (let i = 0; i < 48; i += 1) {
      const x = FIELD.x + 22 + ((i * 83) % 438);
      const y = FIELD.y + 115 + ((i * 157) % 770);
      if (this.pointBusy(level, x, y)) continue;

      const lean = (i % 3) - 1;
      g.beginPath();
      g.moveTo(x, y + 3);
      g.lineTo(x + lean * 2, y - 3);
      g.strokePath();
    }
  }

  private pointBusy(level: LevelDefinition, x: number, y: number): boolean {
    const rectLists: Array<RectDef[] | undefined> = [
      level.walls,
      level.sand,
      level.ice,
      level.boosters,
      level.ramps,
      level.voids
    ];

    for (const list of rectLists) {
      for (const rect of list ?? []) {
        if (x > rect.x - 8 && x < rect.x + rect.w + 8 && y > rect.y - 8 && y < rect.y + rect.h + 8) return true;
      }
    }

    for (const bumper of level.bumpers ?? []) {
      if (Phaser.Math.Distance.Between(x, y, bumper.x, bumper.y) < bumper.r + 10) return true;
    }

    for (const trampoline of level.trampolines ?? []) {
      if (Phaser.Math.Distance.Between(x, y, trampoline.x, trampoline.y) < trampoline.r + 10) return true;
    }

    return false;
  }

  private drawRailDetail(g: Phaser.GameObjects.Graphics, wall: RectDef): void {
    const horizontal = wall.w >= wall.h;

    g.lineStyle(2, 0xd4e3ed, 0.16);
    g.beginPath();
    if (horizontal) {
      g.moveTo(wall.x + 7, wall.y + 4);
      g.lineTo(wall.x + wall.w - 7, wall.y + 4);
    } else {
      g.moveTo(wall.x + 4, wall.y + 7);
      g.lineTo(wall.x + 4, wall.y + wall.h - 7);
    }
    g.strokePath();

    g.fillStyle(0xe6f0f5, 0.18);
    const length = horizontal ? wall.w : wall.h;
    for (let offset = 18; offset < length - 10; offset += 54) {
      const x = horizontal ? wall.x + offset : wall.x + wall.w / 2;
      const y = horizontal ? wall.y + wall.h / 2 : wall.y + offset;
      g.fillCircle(x, y, 1.4);
    }
  }

  private drawTriangleDetail(g: Phaser.GameObjects.Graphics, triangle: TriangleDef): void {
    g.lineStyle(1, 0xe1edf3, 0.15);
    g.beginPath();
    g.moveTo(triangle.a.x, triangle.a.y);
    g.lineTo(triangle.b.x, triangle.b.y);
    g.lineTo(triangle.c.x, triangle.c.y);
    g.closePath();
    g.strokePath();
  }
}
