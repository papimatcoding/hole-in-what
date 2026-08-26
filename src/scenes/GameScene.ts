import Phaser from "phaser";
import { levelsForMode } from "../data/levels";
import type { GameSceneData, LevelDefinition, PopBumperDef, PopWallDef, RectDef } from "../types";

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

interface RuntimePopWall extends PopWallDef { active: boolean; anim: number; }
interface RuntimePopBumper extends PopBumperDef { active: boolean; anim: number; }

const FIELD = { x: 28, y: 28, w: 484, h: 904 };
const BALL_R = 13;
const HOLE_R = 17;
const MAX_PULL = 172;
const DRAG_GAIN = 1.35;
const POWER = 7.4;
const BASE_FRICTION = 0.9875;
const WALL_BOUNCE = 0.90;
const STOP_SPEED = 18;
const SINK_SPEED = 430;

export class GameScene extends Phaser.Scene {
  private mode: GameSceneData["mode"] = "classic";
  private levelIndex = 0;
  private level!: LevelDefinition;
  private ball!: BallState;
  private popWalls: RuntimePopWall[] = [];
  private popBumpers: RuntimePopBumper[] = [];
  private course!: Phaser.GameObjects.Graphics;
  private aim!: Phaser.GameObjects.Graphics;
  private ballView!: Phaser.GameObjects.Arc;
  private strokeText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private strokes = 0;
  private startedAt = 0;
  private dragPointer: Phaser.Input.Pointer | null = null;
  private moving = false;
  private sinking = false;

  constructor() {
    super("game");
  }

  init(data: GameSceneData): void {
    this.mode = data.mode;
    this.levelIndex = data.levelIndex;
    this.level = levelsForMode(this.mode)[this.levelIndex];
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0d1117");
    this.ball = { x: this.level.ball.x, y: this.level.ball.y, vx: 0, vy: 0, r: BALL_R };
    this.popWalls = (this.level.popWalls ?? []).map((wall) => ({ ...wall, active: false, anim: 0 }));
    this.popBumpers = (this.level.popBumpers ?? []).map((bumper) => ({ ...bumper, active: false, anim: 0 }));
    this.strokes = 0;
    this.startedAt = performance.now();
    this.moving = false;
    this.sinking = false;

    this.course = this.add.graphics();
    this.aim = this.add.graphics();
    this.ballView = this.add.circle(this.ball.x, this.ball.y, BALL_R, 0xfbfefe).setStrokeStyle(2, 0xbac4ce);

    this.strokeText = this.add.text(42, 43, "Golpes 0", {
      fontFamily: "system-ui, sans-serif", fontSize: "15px", fontStyle: "bold", color: "#f5f7fa"
    }).setDepth(20);
    this.timeText = this.add.text(498, 43, "0.0", {
      fontFamily: "system-ui, sans-serif", fontSize: "15px", color: "#f5f7fa"
    }).setOrigin(1, 0).setDepth(20);

    this.add.text(270, 45, `★ ${this.level.threeStars}   ☆ ${this.level.twoStars}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "12px", color: "#d7dee6"
    }).setOrigin(0.5, 0).setDepth(20);

    const back = this.add.text(42, 82, "‹", {
      fontFamily: "system-ui, sans-serif", fontSize: "36px", color: "#f5f7fa"
    }).setDepth(20).setInteractive({ useHandCursor: true });
    back.on("pointerup", () => this.scene.start("level-select", { mode: this.mode }));

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.onPointerDown(pointer));
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.onPointerMove(pointer));
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.onPointerUp(pointer));

    this.drawCourse();
  }

  update(_time: number, deltaMs: number): void {
    if (!this.level || this.sinking) return;

    this.timeText.setText(((performance.now() - this.startedAt) / 1000).toFixed(1));

    const dt = Math.min(deltaMs / 1000, 0.033);
    this.updateTraps(dt);

    if (this.moving) {
      this.stepPhysics(dt);
    }

    this.ballView.setPosition(this.ball.x, this.ball.y);
    this.drawCourse();
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.moving || this.sinking) return;
    if (Phaser.Math.Distance.Between(pointer.x, pointer.y, this.ball.x, this.ball.y) <= 60) {
      this.dragPointer = pointer;
      this.drawAim(pointer.x, pointer.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.dragPointer || this.moving || this.sinking) return;
    this.drawAim(pointer.x, pointer.y);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.dragPointer || this.moving || this.sinking) return;

    let dx = this.ball.x - pointer.x;
    let dy = this.ball.y - pointer.y;
    const len = Math.hypot(dx, dy);
    this.dragPointer = null;
    this.aim.clear();

    if (len < 12) return;

    const pull = Math.min(len * DRAG_GAIN, MAX_PULL);
    dx /= len;
    dy /= len;

    this.ball.vx = dx * pull * POWER;
    this.ball.vy = dy * pull * POWER;
    this.strokes += 1;
    this.strokeText.setText(`Golpes ${this.strokes}`);
    this.moving = true;
  }

  private drawAim(pointerX: number, pointerY: number): void {
    let dx = this.ball.x - pointerX;
    let dy = this.ball.y - pointerY;
    const len = Math.hypot(dx, dy) || 1;
    const pull = Math.min(len * DRAG_GAIN, MAX_PULL);
    const visualPull = Math.min(len, MAX_PULL / DRAG_GAIN);
    dx /= len;
    dy /= len;

    this.aim.clear();
    this.aim.lineStyle(5, 0x83b9ff, 0.95);
    this.aim.beginPath();
    this.aim.moveTo(this.ball.x, this.ball.y);
    this.aim.lineTo(this.ball.x - dx * visualPull, this.ball.y - dy * visualPull);
    this.aim.strokePath();

    this.aim.fillStyle(0xedf5ff, 0.72);
    for (let i = 1; i <= 8; i += 1) {
      const t = i / 8;
      this.aim.fillCircle(this.ball.x + dx * pull * (0.55 + t * 0.95), this.ball.y + dy * pull * (0.55 + t * 0.95), 3.5 - t * 1.5);
    }
  }

  private updateTraps(dt: number): void {
    for (const wall of this.popWalls) {
      if (!wall.active && Phaser.Math.Distance.Between(this.ball.x, this.ball.y, wall.triggerX, wall.triggerY) < wall.triggerRadius) {
        wall.active = true;
        this.cameras.main.shake(45, 0.0015);
      }
      if (wall.active) wall.anim = Math.min(1, wall.anim + dt * 7);
    }

    for (const bumper of this.popBumpers) {
      if (!bumper.active && Phaser.Math.Distance.Between(this.ball.x, this.ball.y, bumper.triggerX, bumper.triggerY) < bumper.triggerRadius) {
        bumper.active = true;
        this.cameras.main.shake(45, 0.0015);
      }
      if (bumper.active) bumper.anim = Math.min(1, bumper.anim + dt * 7);
    }
  }

  private stepPhysics(dt: number): void {
    const friction = this.isInAnyRect(this.level.sand ?? []) ? 0.955 : BASE_FRICTION;

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    const damping = Math.pow(friction, dt * 60);
    this.ball.vx *= damping;
    this.ball.vy *= damping;

    const left = FIELD.x + BALL_R;
    const right = FIELD.x + FIELD.w - BALL_R;
    const top = FIELD.y + BALL_R;
    const bottom = FIELD.y + FIELD.h - BALL_R;

    if (this.ball.x < left) { this.ball.x = left; this.ball.vx = Math.abs(this.ball.vx) * WALL_BOUNCE; }
    if (this.ball.x > right) { this.ball.x = right; this.ball.vx = -Math.abs(this.ball.vx) * WALL_BOUNCE; }
    if (this.ball.y < top) { this.ball.y = top; this.ball.vy = Math.abs(this.ball.vy) * WALL_BOUNCE; }
    if (this.ball.y > bottom) { this.ball.y = bottom; this.ball.vy = -Math.abs(this.ball.vy) * WALL_BOUNCE; }

    for (const wall of this.level.walls ?? []) this.resolveWall(wall);
    for (const wall of this.popWalls) {
      if (wall.active && wall.anim > 0.25) this.resolveWall(this.animatedWallRect(wall));
    }

    for (const bumper of this.level.bumpers ?? []) this.resolveBumper(bumper.x, bumper.y, bumper.r, 1.07);
    for (const bumper of this.popBumpers) {
      if (bumper.active && bumper.anim > 0.25) this.resolveBumper(bumper.x, bumper.y, bumper.r * this.easeOutBack(bumper.anim), 1.09);
    }

    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    const holeDistance = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.level.hole.x, this.level.hole.y);

    if (holeDistance < 23 && speed < SINK_SPEED) {
      this.finishHole();
      return;
    }

    if (speed < STOP_SPEED) {
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.moving = false;
    }
  }

  private finishHole(): void {
    if (this.sinking) return;
    this.sinking = true;
    this.moving = false;
    this.aim.clear();

    const timeMs = Math.round(performance.now() - this.startedAt);
    const stars = this.strokes <= this.level.threeStars ? 3 : this.strokes <= this.level.twoStars ? 2 : 1;

    this.tweens.add({
      targets: this.ballView,
      x: this.level.hole.x,
      y: this.level.hole.y,
      scale: 0.08,
      alpha: 0,
      duration: 420,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.scene.start("results", {
          mode: this.mode,
          levelIndex: this.levelIndex,
          levelId: this.level.id,
          strokes: this.strokes,
          timeMs,
          stars
        });
      }
    });
  }

  private isInAnyRect(rects: RectDef[]): boolean {
    return rects.some((r) => this.ball.x > r.x && this.ball.x < r.x + r.w && this.ball.y > r.y && this.ball.y < r.y + r.h);
  }

  private resolveWall(r: RectDef): void {
    const closestX = Phaser.Math.Clamp(this.ball.x, r.x, r.x + r.w);
    const closestY = Phaser.Math.Clamp(this.ball.y, r.y, r.y + r.h);
    if (Phaser.Math.Distance.Between(this.ball.x, this.ball.y, closestX, closestY) >= BALL_R) return;

    const left = Math.abs((this.ball.x + BALL_R) - r.x);
    const right = Math.abs((r.x + r.w) - (this.ball.x - BALL_R));
    const top = Math.abs((this.ball.y + BALL_R) - r.y);
    const bottom = Math.abs((r.y + r.h) - (this.ball.y - BALL_R));
    const min = Math.min(left, right, top, bottom);

    if (min === left) { this.ball.x = r.x - BALL_R; this.ball.vx = -Math.abs(this.ball.vx) * WALL_BOUNCE; }
    else if (min === right) { this.ball.x = r.x + r.w + BALL_R; this.ball.vx = Math.abs(this.ball.vx) * WALL_BOUNCE; }
    else if (min === top) { this.ball.y = r.y - BALL_R; this.ball.vy = -Math.abs(this.ball.vy) * WALL_BOUNCE; }
    else { this.ball.y = r.y + r.h + BALL_R; this.ball.vy = Math.abs(this.ball.vy) * WALL_BOUNCE; }

    this.cameras.main.shake(28, 0.0008);
  }

  private resolveBumper(x: number, y: number, r: number, multiplier: number): void {
    const d = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, x, y);
    if (d >= BALL_R + r) return;

    const nx = (this.ball.x - x) / (d || 1);
    const ny = (this.ball.y - y) / (d || 1);
    this.ball.x = x + nx * (BALL_R + r + 1);
    this.ball.y = y + ny * (BALL_R + r + 1);
    const dot = this.ball.vx * nx + this.ball.vy * ny;
    this.ball.vx = (this.ball.vx - 2 * dot * nx) * multiplier;
    this.ball.vy = (this.ball.vy - 2 * dot * ny) * multiplier;
    this.cameras.main.shake(45, 0.0017);
  }

  private animatedWallRect(wall: RuntimePopWall): RectDef {
    const t = this.easeOutBack(wall.anim);
    if (wall.w >= wall.h) {
      return { x: wall.x, y: wall.y + wall.h * (1 - t) / 2, w: wall.w, h: wall.h * t };
    }
    return { x: wall.x + wall.w * (1 - t) / 2, y: wall.y, w: wall.w * t, h: wall.h };
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  private drawCourse(): void {
    this.course.clear();
    this.course.fillStyle(0x70b968, 1);
    this.course.fillRoundedRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 22);

    this.course.fillStyle(0xffffff, 0.045);
    for (let i = 0; i < 10; i += 2) {
      this.course.fillRect(FIELD.x + i * FIELD.w / 10, FIELD.y, FIELD.w / 10, FIELD.h);
    }

    for (const s of this.level.sand ?? []) {
      this.course.fillStyle(0xd9bd79, 1);
      this.course.fillRoundedRect(s.x, s.y, s.w, s.h, 18);
    }

    for (const wall of this.level.walls ?? []) this.drawWall(wall);
    for (const wall of this.popWalls) {
      if (wall.active) this.drawWall(this.animatedWallRect(wall), Math.min(1, wall.anim * 1.5));
    }

    for (const b of this.level.bumpers ?? []) this.drawBumper(b.x, b.y, b.r);
    for (const b of this.popBumpers) {
      if (b.active) this.drawBumper(b.x, b.y, b.r * this.easeOutBack(b.anim));
    }

    this.course.fillStyle(0x14181b, 1);
    this.course.fillCircle(this.level.hole.x, this.level.hole.y, HOLE_R);
    this.course.lineStyle(3, 0xf3f3f3, 1);
    this.course.beginPath();
    this.course.moveTo(this.level.hole.x, this.level.hole.y);
    this.course.lineTo(this.level.hole.x, this.level.hole.y - 58);
    this.course.strokePath();
    this.course.fillStyle(0xf2f2f2, 1);
    this.course.fillTriangle(this.level.hole.x, this.level.hole.y - 58, this.level.hole.x + 30, this.level.hole.y - 46, this.level.hole.x, this.level.hole.y - 34);
  }

  private drawWall(r: RectDef, alpha = 1): void {
    this.course.fillStyle(0x344657, alpha);
    this.course.fillRoundedRect(r.x, r.y, r.w, r.h, 5);
    this.course.fillStyle(0x607689, alpha);
    if (r.w >= r.h) this.course.fillRect(r.x + 4, r.y + 3, Math.max(0, r.w - 8), 4);
    else this.course.fillRect(r.x + 3, r.y + 4, 4, Math.max(0, r.h - 8));
  }

  private drawBumper(x: number, y: number, r: number): void {
    this.course.fillStyle(0xe8a13d, 1);
    this.course.fillCircle(x, y, r);
    this.course.fillStyle(0x5c3817, 1);
    this.course.fillCircle(x, y, r * 0.43);
  }
}
