import Phaser from "phaser";
import { V8GameScene } from "./V8GameScene";
import { applyV81LevelPatch } from "../data/v81LevelPatches";
import type {
  GameSceneData,
  LevelDefinition,
  PortalPairDef,
  PortalPointDef,
  RectDef,
  TriangleDef,
  WindDef
} from "../types";

const FIELD = { x: 28, y: 28, w: 484, h: 904 };
const BALL_R = 13;

interface RuntimeBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  vz: number;
}

export class V81GameScene extends V8GameScene {
  private coursePolish!: Phaser.GameObjects.Graphics;
  private mechanicView!: Phaser.GameObjects.Graphics;
  private mechanicPhase = 0;
  private portalCooldown = 0;

  init(data: GameSceneData): void {
    super.init(data);
    const current = (this as unknown as { level: LevelDefinition }).level;
    (this as unknown as { level: LevelDefinition }).level = applyV81LevelPatch(current);
  }

  create(): void {
    super.create();
    this.coursePolish = this.add.graphics().setDepth(1);
    this.mechanicView = this.add.graphics().setDepth(4);
    this.portalCooldown = 0;
    this.mechanicPhase = 0;
    this.drawCoursePolish();
    this.drawMechanics();
  }

  update(time: number, deltaMs: number): void {
    super.update(time, deltaMs);

    if (this.tutorialActive()) return;

    const dt = Math.min(deltaMs / 1000, 0.033);
    this.mechanicPhase += dt;
    this.portalCooldown = Math.max(0, this.portalCooldown - dt);

    this.applyWind(dt);
    this.tryPortals();
    this.drawMechanics();
  }

  private courseLevel(): LevelDefinition {
    return (this as unknown as { level: LevelDefinition }).level;
  }

  private ballRef(): RuntimeBall {
    return (this as unknown as { ball: RuntimeBall }).ball;
  }

  private ballViewRef(): Phaser.GameObjects.Container {
    return (this as unknown as { ballView: Phaser.GameObjects.Container }).ballView;
  }

  private tutorialActive(): boolean {
    return Boolean((this as unknown as { tutorialOverlay: Phaser.GameObjects.Container | null }).tutorialOverlay);
  }

  private isMoving(): boolean {
    return Boolean((this as unknown as { moving: boolean }).moving);
  }

  private mechanicsBlocked(): boolean {
    const state = this as unknown as { sinking: boolean; voidResetting: boolean };
    return state.sinking || state.voidResetting;
  }

  private drawCoursePolish(): void {
    const level = this.courseLevel();
    const g = this.coursePolish;
    g.clear();

    // Fairways remain data for level composition, but the old pale rectangles are deliberately not rendered.
    // The route should be communicated by walls and obstacle placement, not UI-like boxes.
    this.drawTee(g, level.ball.x, level.ball.y);
    this.drawGrassFibres(g, level);

    for (const wall of level.walls ?? []) this.drawRailDetail(g, wall);
    for (const triangle of level.triangles ?? []) this.drawTriangleDetail(g, triangle);
  }

  private drawTee(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x17331f, 0.11);
    g.fillEllipse(x + 2, y + 6, 46, 20);
    g.lineStyle(1.5, 0xdaf2d3, 0.14);
    g.strokeCircle(x, y, 21);
  }

  private drawGrassFibres(g: Phaser.GameObjects.Graphics, level: LevelDefinition): void {
    g.lineStyle(1, 0xd8f2cf, 0.042);

    for (let i = 0; i < 58; i += 1) {
      const x = FIELD.x + 20 + ((i * 83) % 442);
      const y = FIELD.y + 105 + ((i * 157) % 785);
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
      level.winds,
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

    for (const pair of level.portals ?? []) {
      for (const point of [pair.a, pair.b]) {
        if (Phaser.Math.Distance.Between(x, y, point.x, point.y) < (point.r ?? 28) + 12) return true;
      }
    }

    return false;
  }

  private drawRailDetail(g: Phaser.GameObjects.Graphics, wall: RectDef): void {
    const horizontal = wall.w >= wall.h;

    g.lineStyle(1.5, 0xd4e3ed, 0.13);
    g.beginPath();
    if (horizontal) {
      g.moveTo(wall.x + 7, wall.y + 4);
      g.lineTo(wall.x + wall.w - 7, wall.y + 4);
    } else {
      g.moveTo(wall.x + 4, wall.y + 7);
      g.lineTo(wall.x + 4, wall.y + wall.h - 7);
    }
    g.strokePath();

    g.fillStyle(0xe6f0f5, 0.14);
    const length = horizontal ? wall.w : wall.h;
    for (let offset = 20; offset < length - 10; offset += 58) {
      const x = horizontal ? wall.x + offset : wall.x + wall.w / 2;
      const y = horizontal ? wall.y + wall.h / 2 : wall.y + offset;
      g.fillCircle(x, y, 1.3);
    }
  }

  private drawTriangleDetail(g: Phaser.GameObjects.Graphics, triangle: TriangleDef): void {
    g.lineStyle(1, 0xe1edf3, 0.11);
    g.beginPath();
    g.moveTo(triangle.a.x, triangle.a.y);
    g.lineTo(triangle.b.x, triangle.b.y);
    g.lineTo(triangle.c.x, triangle.c.y);
    g.closePath();
    g.strokePath();
  }

  private applyWind(dt: number): void {
    if (!this.isMoving() || this.mechanicsBlocked()) return;

    const ball = this.ballRef();
    for (const zone of this.courseLevel().winds ?? []) {
      if (!this.pointInRect(ball, zone)) continue;

      const length = Math.hypot(zone.dx, zone.dy) || 1;
      const strength = zone.strength ?? 155;
      const airFactor = ball.z > 0.5 ? 0.68 : 1;
      ball.vx += (zone.dx / length) * strength * airFactor * dt;
      ball.vy += (zone.dy / length) * strength * airFactor * dt;
    }
  }

  private tryPortals(): void {
    if (this.portalCooldown > 0 || this.mechanicsBlocked() || !this.isMoving()) return;

    const ball = this.ballRef();
    for (const pair of this.courseLevel().portals ?? []) {
      if (this.ballInsidePortal(ball, pair.a)) {
        this.teleport(pair.a, pair.b);
        return;
      }
      if (this.ballInsidePortal(ball, pair.b)) {
        this.teleport(pair.b, pair.a);
        return;
      }
    }
  }

  private ballInsidePortal(ball: RuntimeBall, point: PortalPointDef): boolean {
    const radius = point.r ?? 28;
    return Phaser.Math.Distance.Between(ball.x, ball.y, point.x, point.y) <= radius + BALL_R * 0.2;
  }

  private teleport(from: PortalPointDef, to: PortalPointDef): void {
    const ball = this.ballRef();
    const speed = Math.hypot(ball.vx, ball.vy);

    let dx = speed > 1 ? ball.vx / speed : to.x - from.x;
    let dy = speed > 1 ? ball.vy / speed : to.y - from.y;
    const fallbackLength = Math.hypot(dx, dy) || 1;
    dx /= fallbackLength;
    dy /= fallbackLength;

    const exitRadius = (to.r ?? 28) + BALL_R + 4;
    this.playPortalBurst(from.x, from.y, false);

    ball.x = to.x + dx * exitRadius;
    ball.y = to.y + dy * exitRadius;
    this.portalCooldown = 0.34;

    const view = this.ballViewRef();
    view.x = ball.x;
    view.y = ball.y - ball.z * 0.28;

    this.playPortalBurst(to.x, to.y, true);
    this.cameras.main.shake(35, 0.0009);
  }

  private pointInRect(point: {x:number;y:number}, rect: RectDef): boolean {
    return point.x > rect.x && point.x < rect.x + rect.w && point.y > rect.y && point.y < rect.y + rect.h;
  }

  private drawMechanics(): void {
    const g = this.mechanicView;
    g.clear();

    for (const zone of this.courseLevel().winds ?? []) this.drawWind(g, zone);
    (this.courseLevel().portals ?? []).forEach((pair, index) => this.drawPortalPair(g, pair, index));
  }

  private drawWind(g: Phaser.GameObjects.Graphics, zone: WindDef): void {
    const length = Math.hypot(zone.dx, zone.dy) || 1;
    const dx = zone.dx / length;
    const dy = zone.dy / length;
    const px = -dy;
    const py = dx;
    const diagonalSpan = Math.abs(px) * zone.w + Math.abs(py) * zone.h;
    const alongSpan = Math.abs(dx) * zone.w + Math.abs(dy) * zone.h;
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;

    for (let i = 0; i < 7; i += 1) {
      const q = (i + 1) / 8;
      const cross = (q - 0.5) * diagonalSpan * 0.72;
      const travel = (((this.mechanicPhase * 0.42 + i * 0.137) % 1) - 0.5) * alongSpan * 0.82;
      const x = cx + px * cross + dx * travel;
      const y = cy + py * cross + dy * travel;
      const streak = 15 + (i % 3) * 4;

      g.lineStyle(i % 2 === 0 ? 2 : 1.4, 0xe3f4e8, 0.12 + (i % 3) * 0.025);
      g.beginPath();
      g.moveTo(x - dx * streak * 0.55, y - dy * streak * 0.55);
      g.lineTo(x + dx * streak * 0.45, y + dy * streak * 0.45);
      g.strokePath();

      g.fillStyle(0xeaf8ed, 0.16);
      g.fillTriangle(
        x + dx * streak * 0.55,
        y + dy * streak * 0.55,
        x + dx * streak * 0.22 + px * 3.5,
        y + dy * streak * 0.22 + py * 3.5,
        x + dx * streak * 0.22 - px * 3.5,
        y + dy * streak * 0.22 - py * 3.5
      );
    }
  }

  private drawPortalPair(g: Phaser.GameObjects.Graphics, pair: PortalPairDef, index: number): void {
    const palettes = [
      [0x79c8ff, 0xc59aff],
      [0x88e0c0, 0x8aa8ff],
      [0xf0bb78, 0xd888ff]
    ];
    const palette = palettes[index % palettes.length];
    this.drawPortal(g, pair.a, palette[0], this.mechanicPhase + index * 0.7);
    this.drawPortal(g, pair.b, palette[1], -this.mechanicPhase - index * 0.7);
  }

  private drawPortal(g: Phaser.GameObjects.Graphics, point: PortalPointDef, color: number, phase: number): void {
    const radius = point.r ?? 28;

    g.fillStyle(0x071019, 0.38);
    g.fillCircle(point.x + 2, point.y + 4, radius + 4);
    g.lineStyle(4, color, 0.74);
    g.strokeCircle(point.x, point.y, radius);
    g.lineStyle(1.5, 0xf4fbff, 0.22);
    g.strokeCircle(point.x, point.y, radius - 7);

    for (let i = 0; i < 7; i += 1) {
      const angle = phase * 1.7 + i * Math.PI * 2 / 7;
      const orbit = radius + 5 + (i % 2) * 4;
      g.fillStyle(color, 0.28 + (i % 3) * 0.07);
      g.fillCircle(
        point.x + Math.cos(angle) * orbit,
        point.y + Math.sin(angle) * orbit,
        1.7 + (i % 2) * 0.7
      );
    }
  }

  private playPortalBurst(x: number, y: number, arrival: boolean): void {
    const g = this.add.graphics().setDepth(13);
    const color = arrival ? 0xd8eeff : 0xbfa8ff;

    g.lineStyle(2.5, color, 0.72);
    g.strokeCircle(x, y, 18);
    for (let i = 0; i < 8; i += 1) {
      const a = i * Math.PI / 4;
      g.fillStyle(color, 0.72);
      g.fillCircle(x + Math.cos(a) * 24, y + Math.sin(a) * 24, 2.2);
    }

    this.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: arrival ? 1.8 : 0.55,
      scaleY: arrival ? 1.8 : 0.55,
      duration: 260,
      ease: "Cubic.easeOut",
      onComplete: () => g.destroy()
    });
  }
}
