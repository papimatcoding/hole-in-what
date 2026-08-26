import Phaser from "phaser";
import { pointerToDesign, setupDesignCamera, sharpenSceneText } from "../config/display";
import { cosmeticById, type CosmeticDefinition } from "../data/cosmetics";
import { levelsForMode } from "../data/levels";
import { drawBall } from "../systems/CosmeticRenderer";
import { SaveSystem } from "../systems/SaveSystem";
import { formatRequirement, starsForRun } from "../systems/StarScoring";
import type {
  BoosterDef,
  GameSceneData,
  LevelDefinition,
  PopBumperDef,
  PopVoidDef,
  PopWallDef,
  RampDef,
  RectDef,
  TrampolineDef,
  TriangleDef,
  Vec2
} from "../types";

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  vz: number;
  r: number;
}

interface RuntimePopWall extends PopWallDef { active: boolean; anim: number; }
interface RuntimePopBumper extends PopBumperDef { active: boolean; anim: number; }
interface RuntimePopVoid extends PopVoidDef { active: boolean; anim: number; }

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  phase: number;
}

const FIELD = { x: 28, y: 28, w: 484, h: 904 };
const BALL_R = 13;
const HOLE_R = 17;
const MAX_PULL = 172;
const DRAG_GAIN = 1.35;
const POWER = 7.4;
const BASE_FRICTION = 0.9875;
const ICE_FRICTION = 0.9982;
const SAND_FRICTION = 0.955;
const AIR_FRICTION = 0.9995;
const WALL_BOUNCE = 0.90;
const STOP_SPEED = 18;
const SINK_SPEED = 430;
const BOOST_FORCE = 650;
const GRAVITY = 980;
const AIR_VISUAL_SCALE = 0.18;

export class GameScene extends Phaser.Scene {
  private mode: GameSceneData["mode"] = "classic";
  private levelIndex = 0;
  private level!: LevelDefinition;
  private ball!: BallState;
  private shotOrigin: Vec2 = { x: 270, y: 820 };
  private popWalls: RuntimePopWall[] = [];
  private popBumpers: RuntimePopBumper[] = [];
  private popVoids: RuntimePopVoid[] = [];
  private course!: Phaser.GameObjects.Graphics;
  private aim!: Phaser.GameObjects.Graphics;
  private trailView!: Phaser.GameObjects.Graphics;
  private shadowView!: Phaser.GameObjects.Graphics;
  private ballView!: Phaser.GameObjects.Container;
  private ballGraphic!: Phaser.GameObjects.Graphics;
  private strokeText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private ballCosmetic!: CosmeticDefinition;
  private trailCosmetic!: CosmeticDefinition;
  private holeCosmetic!: CosmeticDefinition;
  private trailParticles: TrailParticle[] = [];
  private trailAccumulator = 0;
  private strokes = 0;
  private startedAt = 0;
  private dragPointer: Phaser.Input.Pointer | null = null;
  private moving = false;
  private sinking = false;
  private voidResetting = false;
  private launchCooldown = 0;

  constructor() {
    super("game");
  }

  init(data: GameSceneData): void {
    this.mode = data.mode;
    this.levelIndex = data.levelIndex;
    this.level = levelsForMode(this.mode)[this.levelIndex];
  }

  create(): void {
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0b0f14");

    this.ball = {
      x: this.level.ball.x,
      y: this.level.ball.y,
      vx: 0,
      vy: 0,
      z: 0,
      vz: 0,
      r: BALL_R
    };
    this.shotOrigin = { ...this.level.ball };
    this.popWalls = (this.level.popWalls ?? []).map((wall) => ({ ...wall, active: false, anim: 0 }));
    this.popBumpers = (this.level.popBumpers ?? []).map((bumper) => ({ ...bumper, active: false, anim: 0 }));
    this.popVoids = (this.level.popVoids ?? []).map((voidDef) => ({ ...voidDef, active: false, anim: 0 }));
    this.strokes = 0;
    this.startedAt = performance.now();
    this.moving = false;
    this.sinking = false;
    this.voidResetting = false;
    this.launchCooldown = 0;
    this.trailParticles = [];
    this.trailAccumulator = 0;

    const equipped = SaveSystem.cosmetics().equipped;
    this.ballCosmetic = cosmeticById(equipped.ball) ?? cosmeticById("ball-classic")!;
    this.trailCosmetic = cosmeticById(equipped.trail) ?? cosmeticById("trail-none")!;
    this.holeCosmetic = cosmeticById(equipped.holeEffect) ?? cosmeticById("hole-default")!;

    this.course = this.add.graphics().setDepth(0);
    this.trailView = this.add.graphics().setDepth(6);
    this.shadowView = this.add.graphics().setDepth(7);
    this.aim = this.add.graphics().setDepth(15);
    this.ballGraphic = this.add.graphics();
    drawBall(this.ballGraphic, this.ballCosmetic, 0, 0, BALL_R);
    this.ballView = this.add.container(this.ball.x, this.ball.y, [this.ballGraphic]).setDepth(10);

    this.add.rectangle(270, 69, 286, 48, 0x0a0f14, 0.78)
      .setStrokeStyle(1, 0x26323d, 0.82)
      .setDepth(18);

    this.strokeText = this.add.text(42, 42, "Golpes 0", {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#f5f7fa"
    }).setDepth(20);
    this.timeText = this.add.text(498, 42, "0.0 s", {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", color: "#f5f7fa"
    }).setOrigin(1, 0).setDepth(20);

    this.add.text(270, 59, `3★  ${formatRequirement(this.level.threeStar)}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "10px", fontStyle: "bold", color: "#f0d37e"
    }).setOrigin(0.5).setDepth(20);
    this.add.text(270, 78, `2★  ${formatRequirement(this.level.twoStar)}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "9px", color: "#aebbc7"
    }).setOrigin(0.5).setDepth(20);

    const back = this.add.text(42, 83, "‹", {
      fontFamily: "system-ui, sans-serif", fontSize: "34px", color: "#f5f7fa"
    }).setDepth(20).setInteractive({ useHandCursor: true });
    back.on("pointerup", () => this.scene.start("level-select", { mode: this.mode, page: Math.floor(this.levelIndex / 10) }));

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.onPointerDown(pointer));
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.onPointerMove(pointer));
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.onPointerUp(pointer));

    this.drawCourse();
    this.updateBallRender();
    sharpenSceneText(this);
  }

  update(_time: number, deltaMs: number): void {
    if (!this.level || this.sinking) return;

    this.timeText.setText(`${((performance.now() - this.startedAt) / 1000).toFixed(1)} s`);
    if (this.voidResetting) return;

    const dt = Math.min(deltaMs / 1000, 0.033);
    this.launchCooldown = Math.max(0, this.launchCooldown - dt);
    this.updateTraps(dt);

    if (this.moving) this.stepPhysics(dt);

    this.updateTrail(dt);
    this.updateBallRender();
    this.drawCourse();
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.moving || this.sinking || this.voidResetting || this.isAirborne()) return;
    const point = pointerToDesign(this, pointer);
    if (Phaser.Math.Distance.Between(point.x, point.y, this.ball.x, this.ball.y) <= 60) {
      this.dragPointer = pointer;
      this.drawAim(point.x, point.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.dragPointer || this.moving || this.sinking) return;
    const point = pointerToDesign(this, pointer);
    this.drawAim(point.x, point.y);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.dragPointer || this.moving || this.sinking) return;

    const point = pointerToDesign(this, pointer);
    let dx = this.ball.x - point.x;
    let dy = this.ball.y - point.y;
    const len = Math.hypot(dx, dy);
    this.dragPointer = null;
    this.aim.clear();

    if (len < 12) return;

    const pull = Math.min(len * DRAG_GAIN, MAX_PULL);
    dx /= len;
    dy /= len;

    this.shotOrigin = { x: this.ball.x, y: this.ball.y };
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
    this.aim.lineStyle(4, 0x8bc5ff, 0.95);
    this.aim.beginPath();
    this.aim.moveTo(this.ball.x, this.ball.y);
    this.aim.lineTo(this.ball.x - dx * visualPull, this.ball.y - dy * visualPull);
    this.aim.strokePath();

    this.aim.fillStyle(0xedf7ff, 0.75);
    for (let i = 1; i <= 8; i += 1) {
      const q = i / 8;
      this.aim.fillCircle(
        this.ball.x + dx * pull * (0.55 + q * 0.95),
        this.ball.y + dy * pull * (0.55 + q * 0.95),
        3.3 - q * 1.4
      );
    }
  }

  private updateTraps(dt: number): void {
    for (const wall of this.popWalls) {
      if (!wall.active && Phaser.Math.Distance.Between(this.ball.x, this.ball.y, wall.triggerX, wall.triggerY) < wall.triggerRadius) {
        wall.active = true;
        this.cameras.main.shake(45, 0.0014);
      }
      if (wall.active) wall.anim = Math.min(1, wall.anim + dt * 7);
    }

    for (const bumper of this.popBumpers) {
      if (!bumper.active && Phaser.Math.Distance.Between(this.ball.x, this.ball.y, bumper.triggerX, bumper.triggerY) < bumper.triggerRadius) {
        bumper.active = true;
        this.cameras.main.shake(45, 0.0014);
      }
      if (bumper.active) bumper.anim = Math.min(1, bumper.anim + dt * 7);
    }

    for (const voidDef of this.popVoids) {
      if (!voidDef.active && Phaser.Math.Distance.Between(this.ball.x, this.ball.y, voidDef.triggerX, voidDef.triggerY) < voidDef.triggerRadius) {
        voidDef.active = true;
        this.cameras.main.shake(55, 0.0018);
      }
      if (voidDef.active) voidDef.anim = Math.min(1, voidDef.anim + dt * 6.5);
    }
  }

  private stepPhysics(dt: number): void {
    const wasAirborne = this.isAirborne();

    if (!wasAirborne) {
      this.tryRampLaunch();
      this.tryTrampolineLaunch();
    }

    const airborne = this.isAirborne();
    const onSand = !airborne && this.isInAnyRect(this.level.sand ?? []);
    const onIce = !airborne && this.isInAnyRect(this.level.ice ?? []);
    const friction = airborne ? AIR_FRICTION : onSand ? SAND_FRICTION : onIce ? ICE_FRICTION : BASE_FRICTION;

    if (!airborne) {
      for (const booster of this.level.boosters ?? []) this.applyBooster(booster, dt);
    }

    this.ball.x += this.ball.vx * dt;
    this.ball.y += this.ball.vy * dt;
    const damping = Math.pow(friction, dt * 60);
    this.ball.vx *= damping;
    this.ball.vy *= damping;

    if (airborne) {
      this.ball.z += this.ball.vz * dt;
      this.ball.vz -= GRAVITY * dt;
      if (this.ball.z <= 0 && this.ball.vz < 0) {
        const landingSpeed = Math.abs(this.ball.vz);
        this.ball.z = 0;
        this.ball.vz = 0;
        if (landingSpeed > 250) this.cameras.main.shake(45, 0.0012);
      }
    }

    this.resolveFieldBounds();

    if (!this.isAirborne()) {
      for (const wall of this.level.walls ?? []) this.resolveWall(wall);
      for (const triangle of this.level.triangles ?? []) this.resolveTriangle(triangle);
      for (const wall of this.popWalls) {
        if (wall.active && wall.anim > 0.25) this.resolveWall(this.animatedWallRect(wall));
      }

      for (const bumper of this.level.bumpers ?? []) this.resolveBumper(bumper.x, bumper.y, bumper.r, 1.07);
      for (const bumper of this.popBumpers) {
        if (bumper.active && bumper.anim > 0.25) this.resolveBumper(bumper.x, bumper.y, bumper.r * this.easeOutBack(bumper.anim), 1.09);
      }

      if (this.isOverVoid()) {
        this.fallIntoVoid();
        return;
      }
    }

    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    const holeDistance = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, this.level.hole.x, this.level.hole.y);

    if (!this.isAirborne() && holeDistance < 23 && speed < SINK_SPEED) {
      this.finishHole();
      return;
    }

    if (!this.isAirborne() && speed < STOP_SPEED) {
      this.ball.vx = 0;
      this.ball.vy = 0;
      this.moving = false;
    }
  }

  private tryRampLaunch(): void {
    if (this.launchCooldown > 0) return;
    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    if (speed < 120) return;

    for (const ramp of this.level.ramps ?? []) {
      if (!this.pointInRect(this.ball, ramp)) continue;
      const length = Math.hypot(ramp.dx, ramp.dy) || 1;
      const dx = ramp.dx / length;
      const dy = ramp.dy / length;
      const approach = (this.ball.vx * dx + this.ball.vy * dy) / speed;
      if (approach < 0.18) continue;

      this.ball.vz = ramp.lift ?? 450;
      const horizontalBoost = ramp.boost ?? 110;
      this.ball.vx += dx * horizontalBoost;
      this.ball.vy += dy * horizontalBoost;
      this.launchCooldown = 0.48;
      this.cameras.main.shake(32, 0.0009);
      return;
    }
  }

  private tryTrampolineLaunch(): void {
    if (this.launchCooldown > 0) return;

    for (const trampoline of this.level.trampolines ?? []) {
      const distance = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, trampoline.x, trampoline.y);
      if (distance > trampoline.r + BALL_R * 0.45) continue;
      this.ball.vz = trampoline.power ?? 565;
      this.ball.vx *= 1.045;
      this.ball.vy *= 1.045;
      this.launchCooldown = 0.52;
      this.cameras.main.shake(50, 0.0015);
      return;
    }
  }

  private applyBooster(booster: BoosterDef, dt: number): void {
    if (!this.pointInRect(this.ball, booster)) return;
    const length = Math.hypot(booster.dx, booster.dy) || 1;
    const force = BOOST_FORCE * (booster.power ?? 1);
    this.ball.vx += booster.dx / length * force * dt;
    this.ball.vy += booster.dy / length * force * dt;
  }

  private resolveFieldBounds(): void {
    const left = FIELD.x + BALL_R;
    const right = FIELD.x + FIELD.w - BALL_R;
    const top = FIELD.y + BALL_R;
    const bottom = FIELD.y + FIELD.h - BALL_R;

    if (this.ball.x < left) { this.ball.x = left; this.ball.vx = Math.abs(this.ball.vx) * WALL_BOUNCE; }
    if (this.ball.x > right) { this.ball.x = right; this.ball.vx = -Math.abs(this.ball.vx) * WALL_BOUNCE; }
    if (this.ball.y < top) { this.ball.y = top; this.ball.vy = Math.abs(this.ball.vy) * WALL_BOUNCE; }
    if (this.ball.y > bottom) { this.ball.y = bottom; this.ball.vy = -Math.abs(this.ball.vy) * WALL_BOUNCE; }
  }

  private isAirborne(): boolean {
    return this.ball.z > 0.5 || this.ball.vz > 0.5;
  }

  private isOverVoid(): boolean {
    if ((this.level.voids ?? []).some((rect) => this.pointInRect(this.ball, rect))) return true;
    return this.popVoids.some((voidDef) => voidDef.active && voidDef.anim > 0.56 && this.pointInRect(this.ball, voidDef));
  }

  private fallIntoVoid(): void {
    if (this.voidResetting || this.sinking) return;
    this.voidResetting = true;
    this.moving = false;
    this.dragPointer = null;
    this.aim.clear();
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.vz = 0;
    this.shadowView.clear();

    this.tweens.add({
      targets: this.ballView,
      alpha: 0,
      scale: 0.12,
      y: this.ballView.y + 10,
      duration: 250,
      ease: "Cubic.easeIn",
      onComplete: () => {
        this.ball.x = this.shotOrigin.x;
        this.ball.y = this.shotOrigin.y;
        this.ball.z = 0;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.vz = 0;
        this.ballView.setPosition(this.ball.x, this.ball.y).setScale(1).setAlpha(1);
        this.time.delayedCall(130, () => {
          this.voidResetting = false;
          this.updateBallRender();
          this.drawCourse();
        });
      }
    });
  }

  private updateBallRender(): void {
    const height = Math.max(0, this.ball.z);
    const visualLift = height * AIR_VISUAL_SCALE;
    const scale = 1 + Math.min(0.13, height / 1700);

    this.ballView
      .setPosition(this.ball.x, this.ball.y - visualLift)
      .setScale(scale)
      .setDepth(height > 1 ? 12 : 10);

    this.shadowView.clear();
    const shadowScale = Phaser.Math.Clamp(1 - height / 900, 0.52, 1);
    const shadowAlpha = Phaser.Math.Clamp(0.24 - height / 2600, 0.07, 0.24);
    this.shadowView.fillStyle(0x07100b, shadowAlpha);
    this.shadowView.fillEllipse(this.ball.x + 2, this.ball.y + 5, 28 * shadowScale, 12 * shadowScale);
  }

  private updateTrail(dt: number): void {
    for (let i = this.trailParticles.length - 1; i >= 0; i -= 1) {
      const p = this.trailParticles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.trailParticles.splice(i, 1);
    }

    if (this.moving && this.trailCosmetic.id !== "trail-none") {
      const speed = Math.hypot(this.ball.vx, this.ball.vy);
      if (speed > 70) {
        this.trailAccumulator += dt;
        const interval = this.trailCosmetic.id === "trail-sparks" ? 0.022 : 0.032;
        while (this.trailAccumulator >= interval) {
          this.trailAccumulator -= interval;
          this.spawnTrailParticle();
        }
      }
    } else {
      this.trailAccumulator = 0;
    }

    this.drawTrail();
  }

  private spawnTrailParticle(): void {
    const isPetal = this.trailCosmetic.id === "trail-petals";
    const isSpark = this.trailCosmetic.id === "trail-sparks" || this.trailCosmetic.id === "trail-stardust";
    const isAurora = this.trailCosmetic.id === "trail-aurora";
    const maxLife = isPetal ? 0.62 : isSpark ? 0.34 : isAurora ? 0.58 : 0.50;
    this.trailParticles.push({
      x: this.ball.x + Phaser.Math.FloatBetween(-3, 3),
      y: this.ball.y - this.ball.z * AIR_VISUAL_SCALE + Phaser.Math.FloatBetween(-3, 3),
      vx: Phaser.Math.FloatBetween(-12, 12),
      vy: isPetal ? Phaser.Math.FloatBetween(-6, 18) : Phaser.Math.FloatBetween(-10, 10),
      life: maxLife,
      maxLife,
      size: isSpark ? Phaser.Math.FloatBetween(2, 4) : Phaser.Math.FloatBetween(3, 6),
      phase: Math.random() * Math.PI * 2
    });
    if (this.trailParticles.length > 90) this.trailParticles.shift();
  }

  private drawTrail(): void {
    this.trailView.clear();
    const secondary = this.trailCosmetic.secondary ?? this.trailCosmetic.primary;

    for (let i = 0; i < this.trailParticles.length; i += 1) {
      const p = this.trailParticles[i];
      const life = Math.max(0, p.life / p.maxLife);
      const color = i % 2 === 0 ? this.trailCosmetic.primary : secondary;

      if (this.trailCosmetic.id === "trail-petals") {
        this.trailView.fillStyle(color, life * 0.72);
        const wave = Math.sin(p.phase + p.life * 12) * 3;
        this.trailView.fillTriangle(
          p.x - p.size, p.y + wave,
          p.x + p.size * 0.8, p.y - p.size * 0.65 + wave,
          p.x + p.size, p.y + p.size * 0.55 + wave
        );
      } else if (this.trailCosmetic.id === "trail-sparks" || this.trailCosmetic.id === "trail-stardust") {
        this.trailView.lineStyle(Math.max(1, p.size * 0.45), color, life * 0.85);
        this.trailView.beginPath();
        this.trailView.moveTo(p.x - p.vx * 0.08 - 4, p.y - p.vy * 0.08);
        this.trailView.lineTo(p.x + 4, p.y);
        this.trailView.strokePath();
      } else if (this.trailCosmetic.id === "trail-aurora") {
        this.trailView.lineStyle(Math.max(2, p.size * 0.75), color, life * 0.34);
        this.trailView.beginPath();
        this.trailView.moveTo(p.x - 8, p.y + Math.sin(p.phase + p.life * 10) * 4);
        this.trailView.lineTo(p.x + 7, p.y - Math.sin(p.phase + p.life * 10) * 4);
        this.trailView.strokePath();
      } else {
        this.trailView.fillStyle(color, life * 0.42);
        this.trailView.fillCircle(p.x, p.y, p.size * (0.45 + life * 0.55));
      }
    }
  }

  private finishHole(): void {
    if (this.sinking) return;
    this.sinking = true;
    this.moving = false;
    this.aim.clear();
    this.playHoleEffect();

    const timeMs = Math.round(performance.now() - this.startedAt);
    const stars = starsForRun(this.level, this.strokes, timeMs);

    this.tweens.add({
      targets: this.ballView,
      x: this.level.hole.x,
      y: this.level.hole.y,
      scale: 0.06,
      alpha: 0,
      duration: 390,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.time.delayedCall(120, () => {
          this.scene.start("results", {
            mode: this.mode,
            levelIndex: this.levelIndex,
            levelId: this.level.id,
            strokes: this.strokes,
            timeMs,
            stars
          });
        });
      }
    });
  }

  private playHoleEffect(): void {
    const g = this.add.graphics();
    const fx = this.add.container(this.level.hole.x, this.level.hole.y, [g]).setDepth(14);

    if (this.holeCosmetic.id === "hole-bloom") {
      g.fillStyle(this.holeCosmetic.primary, 0.78);
      for (let i = 0; i < 10; i += 1) {
        const a = i * Math.PI / 5;
        g.fillEllipse(Math.cos(a) * 24, Math.sin(a) * 24, 16, 8);
      }
      g.fillStyle(this.holeCosmetic.secondary ?? this.holeCosmetic.primary, 0.95);
      g.fillCircle(0, 0, 6);
      g.lineStyle(2, this.holeCosmetic.secondary ?? this.holeCosmetic.primary, 0.55);
      g.strokeCircle(0, 0, 34);
      fx.setScale(0.30).setAlpha(0.98);
      this.tweens.add({ targets: fx, scale: 2.35, alpha: 0, angle: 28, duration: 680, ease: "Cubic.easeOut" });
      return;
    }

    if (this.holeCosmetic.id === "hole-nova") {
      g.fillStyle(this.holeCosmetic.secondary ?? 0xffffff, 0.98);
      g.fillCircle(0, 0, 9);
      g.lineStyle(4, this.holeCosmetic.primary, 0.92);
      for (let i = 0; i < 12; i += 1) {
        const a = i * Math.PI / 6;
        g.beginPath();
        g.moveTo(Math.cos(a) * 13, Math.sin(a) * 13);
        g.lineTo(Math.cos(a) * 48, Math.sin(a) * 48);
        g.strokePath();
      }
      g.lineStyle(2, this.holeCosmetic.primary, 0.45);
      g.strokeCircle(0, 0, 30);
      fx.setScale(0.38);
      this.tweens.add({ targets: fx, scale: 2.0, alpha: 0, duration: 540, ease: "Cubic.easeOut" });
      return;
    }

    if (this.holeCosmetic.id === "hole-pulse") {
      g.lineStyle(4, this.holeCosmetic.primary, 0.9);
      g.strokeCircle(0, 0, 18);
      g.lineStyle(2, this.holeCosmetic.primary, 0.48);
      g.strokeCircle(0, 0, 33);
      fx.setScale(0.48);
      this.tweens.add({ targets: fx, scale: 2.45, alpha: 0, duration: 560, ease: "Cubic.easeOut" });
      return;
    }

    g.lineStyle(3, 0xffffff, 0.68);
    g.strokeCircle(0, 0, 19);
    fx.setScale(0.65);
    this.tweens.add({ targets: fx, scale: 1.7, alpha: 0, duration: 360, ease: "Cubic.easeOut" });
  }

  private pointInRect(point: { x:number; y:number }, rect: RectDef): boolean {
    return point.x > rect.x && point.x < rect.x + rect.w && point.y > rect.y && point.y < rect.y + rect.h;
  }

  private isInAnyRect(rects: RectDef[]): boolean {
    return rects.some((rect) => this.pointInRect(this.ball, rect));
  }

  private resolveWall(rect: RectDef): void {
    const closestX = Phaser.Math.Clamp(this.ball.x, rect.x, rect.x + rect.w);
    const closestY = Phaser.Math.Clamp(this.ball.y, rect.y, rect.y + rect.h);
    if (Phaser.Math.Distance.Between(this.ball.x, this.ball.y, closestX, closestY) >= BALL_R) return;

    const left = Math.abs((this.ball.x + BALL_R) - rect.x);
    const right = Math.abs((rect.x + rect.w) - (this.ball.x - BALL_R));
    const top = Math.abs((this.ball.y + BALL_R) - rect.y);
    const bottom = Math.abs((rect.y + rect.h) - (this.ball.y - BALL_R));
    const min = Math.min(left, right, top, bottom);

    if (min === left) { this.ball.x = rect.x - BALL_R; this.ball.vx = -Math.abs(this.ball.vx) * WALL_BOUNCE; }
    else if (min === right) { this.ball.x = rect.x + rect.w + BALL_R; this.ball.vx = Math.abs(this.ball.vx) * WALL_BOUNCE; }
    else if (min === top) { this.ball.y = rect.y - BALL_R; this.ball.vy = -Math.abs(this.ball.vy) * WALL_BOUNCE; }
    else { this.ball.y = rect.y + rect.h + BALL_R; this.ball.vy = Math.abs(this.ball.vy) * WALL_BOUNCE; }

    this.cameras.main.shake(25, 0.0007);
  }

  private resolveTriangle(triangle: TriangleDef): void {
    const point = { x: this.ball.x, y: this.ball.y };
    const inside = this.pointInTriangle(point, triangle);
    const edges: Array<[Vec2, Vec2]> = [[triangle.a, triangle.b], [triangle.b, triangle.c], [triangle.c, triangle.a]];

    let closest = { x: 0, y: 0 };
    let edgeA = triangle.a;
    let edgeB = triangle.b;
    let bestDistSq = Number.POSITIVE_INFINITY;

    for (const [a, b] of edges) {
      const q = this.closestPointOnSegment(point, a, b);
      const dx = point.x - q.x;
      const dy = point.y - q.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        closest = q;
        edgeA = a;
        edgeB = b;
      }
    }

    const distance = Math.sqrt(bestDistSq);
    if (!inside && distance >= BALL_R) return;

    let nx: number;
    let ny: number;
    if (distance > 0.0001) {
      nx = (point.x - closest.x) / distance;
      ny = (point.y - closest.y) / distance;
      if (inside) { nx *= -1; ny *= -1; }
    } else {
      const ex = edgeB.x - edgeA.x;
      const ey = edgeB.y - edgeA.y;
      const len = Math.hypot(ex, ey) || 1;
      nx = -ey / len;
      ny = ex / len;
      const centroid = {
        x: (triangle.a.x + triangle.b.x + triangle.c.x) / 3,
        y: (triangle.a.y + triangle.b.y + triangle.c.y) / 3
      };
      if ((centroid.x - closest.x) * nx + (centroid.y - closest.y) * ny > 0) { nx *= -1; ny *= -1; }
    }

    this.ball.x = closest.x + nx * (BALL_R + 0.5);
    this.ball.y = closest.y + ny * (BALL_R + 0.5);
    const dot = this.ball.vx * nx + this.ball.vy * ny;
    if (dot < 0) {
      this.ball.vx -= (1 + WALL_BOUNCE) * dot * nx;
      this.ball.vy -= (1 + WALL_BOUNCE) * dot * ny;
    }
    this.cameras.main.shake(25, 0.0007);
  }

  private pointInTriangle(p: Vec2, triangle: TriangleDef): boolean {
    const sign = (p1: Vec2, p2: Vec2, p3: Vec2): number =>
      (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
    const d1 = sign(p, triangle.a, triangle.b);
    const d2 = sign(p, triangle.b, triangle.c);
    const d3 = sign(p, triangle.c, triangle.a);
    const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
    const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
    return !(hasNeg && hasPos);
  }

  private closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lengthSq = abx * abx + aby * aby || 1;
    const q = Phaser.Math.Clamp(((p.x - a.x) * abx + (p.y - a.y) * aby) / lengthSq, 0, 1);
    return { x: a.x + abx * q, y: a.y + aby * q };
  }

  private resolveBumper(x: number, y: number, radius: number, multiplier: number): void {
    const d = Phaser.Math.Distance.Between(this.ball.x, this.ball.y, x, y);
    if (d >= BALL_R + radius) return;

    const nx = (this.ball.x - x) / (d || 1);
    const ny = (this.ball.y - y) / (d || 1);
    this.ball.x = x + nx * (BALL_R + radius + 1);
    this.ball.y = y + ny * (BALL_R + radius + 1);
    const dot = this.ball.vx * nx + this.ball.vy * ny;
    this.ball.vx = (this.ball.vx - 2 * dot * nx) * multiplier;
    this.ball.vy = (this.ball.vy - 2 * dot * ny) * multiplier;
    this.cameras.main.shake(42, 0.0015);
  }

  private animatedWallRect(wall: RuntimePopWall): RectDef {
    const q = this.easeOutBack(wall.anim);
    if (wall.w >= wall.h) return { x: wall.x, y: wall.y + wall.h * (1 - q) / 2, w: wall.w, h: wall.h * q };
    return { x: wall.x + wall.w * (1 - q) / 2, y: wall.y, w: wall.w * q, h: wall.h };
  }

  private animatedVoidRect(voidDef: RuntimePopVoid): RectDef {
    const q = Phaser.Math.Clamp(voidDef.anim, 0, 1);
    return {
      x: voidDef.x + voidDef.w * (1 - q) / 2,
      y: voidDef.y + voidDef.h * (1 - q) / 2,
      w: voidDef.w * q,
      h: voidDef.h * q
    };
  }

  private easeOutBack(q: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(q - 1, 3) + c1 * Math.pow(q - 1, 2);
  }

  private drawCourse(): void {
    this.course.clear();

    this.course.fillStyle(0x000000, 0.32);
    this.course.fillRoundedRect(FIELD.x + 4, FIELD.y + 8, FIELD.w, FIELD.h, 24);
    this.course.fillStyle(0x67b965, 1);
    this.course.fillRoundedRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 22);
    this.course.lineStyle(3, 0xa4d79c, 0.28);
    this.course.strokeRoundedRect(FIELD.x, FIELD.y, FIELD.w, FIELD.h, 22);

    this.course.fillStyle(0xffffff, 0.035);
    for (let i = 0; i < 12; i += 2) {
      this.course.fillRect(FIELD.x + i * FIELD.w / 12, FIELD.y + 2, FIELD.w / 12, FIELD.h - 4);
    }
    this.course.fillStyle(0xffffff, 0.055);
    for (let i = 0; i < 18; i += 1) {
      const x = FIELD.x + 22 + ((i * 73) % 440);
      const y = FIELD.y + 125 + ((i * 149) % 750);
      this.course.fillCircle(x, y, 1.2);
    }

    for (const voidDef of this.level.voids ?? []) this.drawVoid(voidDef, 1);
    for (const voidDef of this.popVoids) {
      if (voidDef.active) this.drawVoid(this.animatedVoidRect(voidDef), Math.min(1, voidDef.anim * 1.25));
    }
    for (const ice of this.level.ice ?? []) this.drawIce(ice);
    for (const sand of this.level.sand ?? []) this.drawSand(sand);
    for (const booster of this.level.boosters ?? []) this.drawBooster(booster);
    for (const ramp of this.level.ramps ?? []) this.drawRamp(ramp);
    for (const trampoline of this.level.trampolines ?? []) this.drawTrampoline(trampoline);
    for (const wall of this.level.walls ?? []) this.drawWall(wall);
    for (const triangle of this.level.triangles ?? []) this.drawTriangle(triangle);
    for (const wall of this.popWalls) {
      if (wall.active) this.drawWall(this.animatedWallRect(wall), Math.min(1, wall.anim * 1.5));
    }
    for (const bumper of this.level.bumpers ?? []) this.drawBumper(bumper.x, bumper.y, bumper.r);
    for (const bumper of this.popBumpers) {
      if (bumper.active) this.drawBumper(bumper.x, bumper.y, bumper.r * this.easeOutBack(bumper.anim));
    }

    this.drawHole();
  }

  private drawVoid(rect: RectDef, alpha: number): void {
    if (rect.w < 2 || rect.h < 2) return;
    this.course.fillStyle(0x03080d, 0.92 * alpha);
    this.course.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, Math.min(16, rect.w / 4, rect.h / 4));
    this.course.lineStyle(2, 0x213241, 0.72 * alpha);
    this.course.strokeRoundedRect(rect.x + 2, rect.y + 2, Math.max(1, rect.w - 4), Math.max(1, rect.h - 4), Math.min(14, rect.w / 4, rect.h / 4));
    this.course.fillStyle(0x9dc5d7, 0.16 * alpha);
    for (let i = 0; i < 6; i += 1) {
      const x = rect.x + 14 + ((i * 47) % Math.max(18, rect.w - 24));
      const y = rect.y + 12 + ((i * 31) % Math.max(16, rect.h - 20));
      this.course.fillCircle(x, y, 1.2 + (i % 2) * 0.7);
    }
  }

  private drawIce(rect: RectDef): void {
    this.course.fillStyle(0xa7ddea, 0.73);
    this.course.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 15);
    this.course.lineStyle(2, 0xe8fbff, 0.34);
    this.course.strokeRoundedRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, 14);
    this.course.lineStyle(1, 0xffffff, 0.24);
    for (let x = rect.x + 18; x < rect.x + rect.w - 10; x += 34) {
      this.course.beginPath();
      this.course.moveTo(x, rect.y + 10);
      this.course.lineTo(Math.min(rect.x + rect.w - 8, x + 24), rect.y + rect.h - 10);
      this.course.strokePath();
    }
  }

  private drawSand(rect: RectDef): void {
    this.course.fillStyle(0xd9bd79, 1);
    this.course.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 17);
    this.course.lineStyle(1, 0xf0dca6, 0.38);
    this.course.strokeRoundedRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, 16);
    this.course.fillStyle(0x9f834d, 0.20);
    for (let i = 0; i < 10; i += 1) {
      const x = rect.x + 12 + ((i * 41) % Math.max(18, rect.w - 22));
      const y = rect.y + 10 + ((i * 29) % Math.max(16, rect.h - 18));
      this.course.fillCircle(x, y, 1.4);
    }
  }

  private drawBooster(booster: BoosterDef): void {
    this.course.fillStyle(0x173c2b, 0.24);
    this.course.fillRoundedRect(booster.x + 2, booster.y + 5, booster.w, booster.h, 10);
    this.course.fillStyle(0x3e8b61, 0.96);
    this.course.fillRoundedRect(booster.x, booster.y, booster.w, booster.h, 9);
    this.course.lineStyle(1, 0xa9e8bd, 0.45);
    this.course.strokeRoundedRect(booster.x + 1, booster.y + 1, booster.w - 2, booster.h - 2, 8);
    this.drawDirectionArrow(booster, 0xe8fff0);
  }

  private drawRamp(ramp: RampDef): void {
    this.course.fillStyle(0x13202a, 0.28);
    this.course.fillRoundedRect(ramp.x + 3, ramp.y + 7, ramp.w, ramp.h, 10);
    this.course.fillStyle(0x698da0, 1);
    this.course.fillRoundedRect(ramp.x, ramp.y, ramp.w, ramp.h, 9);
    this.course.fillStyle(0xb9d3de, 0.32);
    this.course.fillRect(ramp.x + 5, ramp.y + 5, Math.max(0, ramp.w - 10), 6);

    const length = Math.hypot(ramp.dx, ramp.dy) || 1;
    const dx = ramp.dx / length;
    const dy = ramp.dy / length;
    const px = -dy;
    const py = dx;
    const cx = ramp.x + ramp.w / 2;
    const cy = ramp.y + ramp.h / 2;
    this.course.lineStyle(2, 0xe9f4f7, 0.38);
    for (let i = -1; i <= 1; i += 1) {
      const offset = i * 15;
      this.course.beginPath();
      this.course.moveTo(cx - dx * 24 + px * offset, cy - dy * 24 + py * offset);
      this.course.lineTo(cx + dx * 18 + px * offset * 0.55, cy + dy * 18 + py * offset * 0.55);
      this.course.strokePath();
    }
    this.drawDirectionArrow(ramp, 0xf4fbff);
  }

  private drawTrampoline(trampoline: TrampolineDef): void {
    this.course.fillStyle(0x101419, 0.28);
    this.course.fillEllipse(trampoline.x + 2, trampoline.y + 7, trampoline.r * 2.15, trampoline.r * 1.55);
    this.course.fillStyle(0x1f5063, 1);
    this.course.fillCircle(trampoline.x, trampoline.y, trampoline.r);
    this.course.lineStyle(5, 0x8de4f1, 0.95);
    this.course.strokeCircle(trampoline.x, trampoline.y, trampoline.r * 0.78);
    this.course.lineStyle(2, 0xe9feff, 0.72);
    this.course.strokeCircle(trampoline.x, trampoline.y, trampoline.r * 0.46);
    this.course.fillStyle(0xd7fbff, 0.75);
    this.course.fillCircle(trampoline.x - trampoline.r * 0.2, trampoline.y - trampoline.r * 0.22, trampoline.r * 0.12);
  }

  private drawDirectionArrow(rect: BoosterDef | RampDef, color: number): void {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const length = Math.hypot(rect.dx, rect.dy) || 1;
    const dx = rect.dx / length;
    const dy = rect.dy / length;
    const px = -dy;
    const py = dx;
    const tipX = cx + dx * 18;
    const tipY = cy + dy * 18;
    const backX = cx - dx * 12;
    const backY = cy - dy * 12;
    this.course.fillStyle(color, 0.88);
    this.course.fillTriangle(
      tipX, tipY,
      backX + px * 10, backY + py * 10,
      backX - px * 10, backY - py * 10
    );
  }

  private drawWall(rect: RectDef, alpha = 1): void {
    this.course.fillStyle(0x16212a, 0.30 * alpha);
    this.course.fillRoundedRect(rect.x + 3, rect.y + 5, rect.w, rect.h, 6);
    this.course.fillStyle(0x344657, alpha);
    this.course.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 5);
    this.course.fillStyle(0x72899b, 0.78 * alpha);
    if (rect.w >= rect.h) this.course.fillRect(rect.x + 4, rect.y + 3, Math.max(0, rect.w - 8), Math.min(5, rect.h / 3));
    else this.course.fillRect(rect.x + 3, rect.y + 4, Math.min(5, rect.w / 3), Math.max(0, rect.h - 8));
  }

  private drawTriangle(triangle: TriangleDef): void {
    this.course.fillStyle(0x152129, 0.28);
    this.course.fillTriangle(
      triangle.a.x + 3, triangle.a.y + 5,
      triangle.b.x + 3, triangle.b.y + 5,
      triangle.c.x + 3, triangle.c.y + 5
    );
    this.course.fillStyle(0x344657, 1);
    this.course.fillTriangle(triangle.a.x, triangle.a.y, triangle.b.x, triangle.b.y, triangle.c.x, triangle.c.y);
    this.course.lineStyle(3, 0x71899b, 0.82);
    this.course.beginPath();
    this.course.moveTo(triangle.a.x, triangle.a.y);
    this.course.lineTo(triangle.b.x, triangle.b.y);
    this.course.lineTo(triangle.c.x, triangle.c.y);
    this.course.lineTo(triangle.a.x, triangle.a.y);
    this.course.strokePath();
  }

  private drawBumper(x: number, y: number, radius: number): void {
    this.course.fillStyle(0x2d1b0d, 0.28);
    this.course.fillCircle(x + 2, y + 5, radius * 1.06);
    this.course.fillStyle(0xe5a347, 1);
    this.course.fillCircle(x, y, radius);
    this.course.lineStyle(3, 0xffd78a, 0.72);
    this.course.strokeCircle(x, y, radius * 0.80);
    this.course.fillStyle(0x5b3818, 1);
    this.course.fillCircle(x, y, radius * 0.42);
    this.course.fillStyle(0xffe0a6, 0.62);
    this.course.fillCircle(x - radius * 0.23, y - radius * 0.25, radius * 0.13);
  }

  private drawHole(): void {
    const x = this.level.hole.x;
    const y = this.level.hole.y;
    this.course.fillStyle(0x0b1014, 0.30);
    this.course.fillEllipse(x + 3, y + 6, HOLE_R * 2.3, HOLE_R * 1.35);
    this.course.fillStyle(0x101519, 1);
    this.course.fillCircle(x, y, HOLE_R);
    this.course.lineStyle(2, 0xcfe2d0, 0.38);
    this.course.strokeCircle(x, y, HOLE_R + 2);

    this.course.lineStyle(3, 0x1c242a, 0.20);
    this.course.beginPath();
    this.course.moveTo(x + 3, y + 2);
    this.course.lineTo(x + 3, y - 56);
    this.course.strokePath();

    this.course.lineStyle(3, 0xf3f3f3, 1);
    this.course.beginPath();
    this.course.moveTo(x, y);
    this.course.lineTo(x, y - 58);
    this.course.strokePath();
    this.course.fillStyle(0xf2f2f2, 1);
    this.course.fillTriangle(x, y - 58, x + 30, y - 46, x, y - 34);
  }
}
