import Phaser from "phaser";
import { V8GameScene } from "./V8GameScene";
import { applyV81LevelPatch } from "../data/v81LevelPatches";
import type {
  CurveDef,
  FanDef,
  GameSceneData,
  LevelDefinition,
  MovingBumperDef,
  MovingWallDef,
  PortalPairDef,
  PortalPointDef,
  RectDef,
  TriangleDef
} from "../types";

const FIELD = { x: 28, y: 28, w: 484, h: 904 };
const BALL_R = 13;
const CURVE_BOUNCE = 0.92;
const MOVING_WALL_BOUNCE = 0.94;

interface RuntimeBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  z: number;
  vz: number;
}

export class V81GameScene extends V8GameScene {
  private coursePolishV82!: Phaser.GameObjects.Graphics;
  private mechanicViewV82!: Phaser.GameObjects.Graphics;
  private mechanicPhaseV82 = 0;
  private portalCooldownV82 = 0;
  private bumperKickCooldownV82 = 0;

  init(data: GameSceneData): void {
    super.init(data);
    const current = (this as unknown as { level: LevelDefinition }).level;
    (this as unknown as { level: LevelDefinition }).level = applyV81LevelPatch(current);
  }

  create(): void {
    super.create();
    this.coursePolishV82 = this.add.graphics().setDepth(1);
    this.mechanicViewV82 = this.add.graphics().setDepth(5);
    this.portalCooldownV82 = 0;
    this.bumperKickCooldownV82 = 0;
    this.mechanicPhaseV82 = 0;
    this.drawStaticPolishV82();
    this.drawDynamicMechanicsV82(0);
  }

  update(time: number, deltaMs: number): void {
    super.update(time, deltaMs);
    if (this.tutorialActiveV82()) return;

    const dt = Math.min(deltaMs / 1000, 0.033);
    const seconds = time / 1000;
    this.mechanicPhaseV82 += dt;
    this.portalCooldownV82 = Math.max(0, this.portalCooldownV82 - dt);
    this.bumperKickCooldownV82 = Math.max(0, this.bumperKickCooldownV82 - dt);

    if (!this.mechanicsBlockedV82()) {
      this.applyFansV82(dt);
      this.resolveCurvesAndMoversV82(seconds);
      this.boostStaticBumpersV82();
      this.tryPortalsV82();
      this.syncBallViewV82();
    }

    this.drawDynamicMechanicsV82(seconds);
  }

  private levelV82(): LevelDefinition {
    return (this as unknown as { level: LevelDefinition }).level;
  }

  private ballV82(): RuntimeBall {
    return (this as unknown as { ball: RuntimeBall }).ball;
  }

  private ballViewV82(): Phaser.GameObjects.Container {
    return (this as unknown as { ballView: Phaser.GameObjects.Container }).ballView;
  }

  private tutorialActiveV82(): boolean {
    return Boolean((this as unknown as { tutorialOverlay: Phaser.GameObjects.Container | null }).tutorialOverlay);
  }

  private movingV82(): boolean {
    return Boolean((this as unknown as { moving: boolean }).moving);
  }

  private setMovingV82(value: boolean): void {
    (this as unknown as { moving: boolean }).moving = value;
  }

  private mechanicsBlockedV82(): boolean {
    const state = this as unknown as { sinking: boolean; voidResetting: boolean };
    return state.sinking || state.voidResetting;
  }

  private groundedV82(): boolean {
    const ball = this.ballV82();
    return ball.z <= 0.5 && ball.vz <= 0.5;
  }

  private drawStaticPolishV82(): void {
    const level = this.levelV82();
    const g = this.coursePolishV82;
    g.clear();

    // No fairway rectangles: course geometry itself communicates the route.
    this.drawTeeV82(g, level.ball.x, level.ball.y);
    this.drawGrassFibresV82(g, level);

    for (const wall of level.walls ?? []) this.drawRailDetailV82(g, wall);
    for (const triangle of level.triangles ?? []) this.drawTriangleDetailV82(g, triangle);
    for (const curve of level.curves ?? []) this.drawCurveV82(g, curve, false);
  }

  private drawTeeV82(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
    g.fillStyle(0x15331e, 0.10);
    g.fillEllipse(x + 2, y + 6, 46, 20);
    g.lineStyle(1.2, 0xd8f1d1, 0.13);
    g.strokeCircle(x, y, 20);
  }

  private drawGrassFibresV82(g: Phaser.GameObjects.Graphics, level: LevelDefinition): void {
    g.lineStyle(1, 0xe1f4dc, 0.035);
    for (let i = 0; i < 62; i += 1) {
      const x = FIELD.x + 18 + ((i * 83) % 446);
      const y = FIELD.y + 108 + ((i * 157) % 786);
      if (this.pointBusyV82(level, x, y)) continue;
      const lean = (i % 3) - 1;
      g.beginPath();
      g.moveTo(x, y + 3);
      g.lineTo(x + lean * 2, y - 3);
      g.strokePath();
    }
  }

  private pointBusyV82(level: LevelDefinition, x: number, y: number): boolean {
    const rectLists: Array<RectDef[] | undefined> = [
      level.walls, level.sand, level.ice, level.boosters, level.fans, level.ramps, level.voids
    ];
    for (const list of rectLists) {
      for (const rect of list ?? []) {
        if (x > rect.x - 8 && x < rect.x + rect.w + 8 && y > rect.y - 8 && y < rect.y + rect.h + 8) return true;
      }
    }
    return false;
  }

  private drawRailDetailV82(g: Phaser.GameObjects.Graphics, wall: RectDef): void {
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
  }

  private drawTriangleDetailV82(g: Phaser.GameObjects.Graphics, triangle: TriangleDef): void {
    g.lineStyle(1, 0xe1edf3, 0.11);
    g.beginPath();
    g.moveTo(triangle.a.x, triangle.a.y);
    g.lineTo(triangle.b.x, triangle.b.y);
    g.lineTo(triangle.c.x, triangle.c.y);
    g.closePath();
    g.strokePath();
  }

  private allFansV82(): FanDef[] {
    const level = this.levelV82();
    return [...(level.fans ?? []), ...(level.winds ?? [])];
  }

  private applyFansV82(dt: number): void {
    if (!this.movingV82()) return;
    const ball = this.ballV82();

    for (const zone of this.allFansV82()) {
      if (!this.pointInRectV82(ball, zone)) continue;
      const len = Math.hypot(zone.dx, zone.dy) || 1;
      const strength = zone.strength ?? 300;
      const airFactor = ball.z > 0.5 ? 0.82 : 1;
      ball.vx += zone.dx / len * strength * airFactor * dt;
      ball.vy += zone.dy / len * strength * airFactor * dt;
    }
  }

  private resolveCurvesAndMoversV82(seconds: number): void {
    if (!this.groundedV82()) return;

    for (const curve of this.levelV82().curves ?? []) this.resolveCurveV82(curve);

    for (const wall of this.levelV82().movingWalls ?? []) {
      const rect = this.movingWallRectV82(wall, seconds);
      const velocity = this.movingVelocityV82(wall.axis, wall.amplitude, wall.speed ?? 1.15, wall.phase ?? 0, seconds);
      this.resolveMovingWallV82(rect, wall.axis, velocity);
    }

    for (const bumper of this.levelV82().movingBumpers ?? []) {
      const point = this.movingBumperPointV82(bumper, seconds);
      const velocity = this.movingVelocityV82(bumper.axis, bumper.amplitude, bumper.speed ?? 1.3, bumper.phase ?? 0, seconds);
      this.resolveMovingBumperV82(point.x, point.y, bumper.r, bumper.axis, velocity);
    }
  }

  private resolveCurveV82(curve: CurveDef): void {
    const ball = this.ballV82();
    const dx = ball.x - curve.x;
    const dy = ball.y - curve.y;
    const distance = Math.hypot(dx, dy) || 0.001;
    const angle = this.normalizeAngleV82(Math.atan2(dy, dx));
    if (!this.angleInArcV82(angle, curve.startAngle, curve.endAngle)) return;

    const thickness = curve.thickness ?? 22;
    const half = thickness / 2 + BALL_R;
    const radialDelta = distance - curve.r;
    if (Math.abs(radialDelta) >= half) return;

    const nxBase = dx / distance;
    const nyBase = dy / distance;
    const side = radialDelta >= 0 ? 1 : -1;
    const nx = nxBase * side;
    const ny = nyBase * side;
    const targetRadius = curve.r + side * (half + 0.7);
    ball.x = curve.x + nxBase * targetRadius;
    ball.y = curve.y + nyBase * targetRadius;

    const dot = ball.vx * nx + ball.vy * ny;
    if (dot < 0) {
      ball.vx -= (1 + CURVE_BOUNCE) * dot * nx;
      ball.vy -= (1 + CURVE_BOUNCE) * dot * ny;
      this.cameras.main.shake(24, 0.00055);
    }
  }

  private resolveMovingWallV82(rect: RectDef, axis: "x"|"y", surfaceVelocity: number): void {
    const ball = this.ballV82();
    const closestX = Phaser.Math.Clamp(ball.x, rect.x, rect.x + rect.w);
    const closestY = Phaser.Math.Clamp(ball.y, rect.y, rect.y + rect.h);
    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    if (Math.hypot(dx, dy) >= BALL_R) return;

    const left = Math.abs((ball.x + BALL_R) - rect.x);
    const right = Math.abs((rect.x + rect.w) - (ball.x - BALL_R));
    const top = Math.abs((ball.y + BALL_R) - rect.y);
    const bottom = Math.abs((rect.y + rect.h) - (ball.y - BALL_R));
    const min = Math.min(left, right, top, bottom);

    if (min === left) { ball.x = rect.x - BALL_R; ball.vx = -Math.abs(ball.vx) * MOVING_WALL_BOUNCE; }
    else if (min === right) { ball.x = rect.x + rect.w + BALL_R; ball.vx = Math.abs(ball.vx) * MOVING_WALL_BOUNCE; }
    else if (min === top) { ball.y = rect.y - BALL_R; ball.vy = -Math.abs(ball.vy) * MOVING_WALL_BOUNCE; }
    else { ball.y = rect.y + rect.h + BALL_R; ball.vy = Math.abs(ball.vy) * MOVING_WALL_BOUNCE; }

    if (axis === "x") ball.vx += surfaceVelocity * 0.34;
    else ball.vy += surfaceVelocity * 0.34;
    this.setMovingV82(true);
    this.cameras.main.shake(28, 0.0007);
  }

  private resolveMovingBumperV82(x: number, y: number, radius: number, axis: "x"|"y", surfaceVelocity: number): void {
    const ball = this.ballV82();
    const d = Phaser.Math.Distance.Between(ball.x, ball.y, x, y);
    if (d >= BALL_R + radius) return;

    const nx = (ball.x - x) / (d || 1);
    const ny = (ball.y - y) / (d || 1);
    ball.x = x + nx * (BALL_R + radius + 1);
    ball.y = y + ny * (BALL_R + radius + 1);
    const dot = ball.vx * nx + ball.vy * ny;
    ball.vx = (ball.vx - 2 * dot * nx) * 1.26;
    ball.vy = (ball.vy - 2 * dot * ny) * 1.26;
    if (axis === "x") ball.vx += surfaceVelocity * 0.28;
    else ball.vy += surfaceVelocity * 0.28;
    this.setMovingV82(true);
    this.cameras.main.shake(40, 0.00125);
  }

  private boostStaticBumpersV82(): void {
    if (this.bumperKickCooldownV82 > 0 || !this.groundedV82()) return;
    const ball = this.ballV82();
    for (const bumper of this.levelV82().bumpers ?? []) {
      const d = Phaser.Math.Distance.Between(ball.x, ball.y, bumper.x, bumper.y);
      if (d > bumper.r + BALL_R + 3) continue;
      const speed = Math.hypot(ball.vx, ball.vy);
      if (speed < 25) continue;
      ball.vx *= 1.14;
      ball.vy *= 1.14;
      this.bumperKickCooldownV82 = 0.11;
      return;
    }
  }

  private tryPortalsV82(): void {
    if (this.portalCooldownV82 > 0 || this.mechanicsBlockedV82() || !this.movingV82()) return;
    const ball = this.ballV82();

    for (const pair of this.levelV82().portals ?? []) {
      if (this.ballInsidePortalV82(ball, pair.a)) { this.teleportV82(pair.a, pair.b); return; }
      if (this.ballInsidePortalV82(ball, pair.b)) { this.teleportV82(pair.b, pair.a); return; }
    }
  }

  private ballInsidePortalV82(ball: RuntimeBall, point: PortalPointDef): boolean {
    return Phaser.Math.Distance.Between(ball.x, ball.y, point.x, point.y) <= (point.r ?? 28) + BALL_R * 0.2;
  }

  private teleportV82(from: PortalPointDef, to: PortalPointDef): void {
    const ball = this.ballV82();
    const speed = Math.hypot(ball.vx, ball.vy);
    let dx = speed > 1 ? ball.vx / speed : to.x - from.x;
    let dy = speed > 1 ? ball.vy / speed : to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;

    this.playPortalBurstV82(from.x, from.y, false);
    const exit = (to.r ?? 28) + BALL_R + 5;
    ball.x = to.x + dx * exit;
    ball.y = to.y + dy * exit;
    this.portalCooldownV82 = 0.38;
    this.playPortalBurstV82(to.x, to.y, true);
    this.cameras.main.shake(32, 0.00075);
  }

  private syncBallViewV82(): void {
    const ball = this.ballV82();
    const view = this.ballViewV82();
    // Base scene will apply its full airborne render on the next frame; this avoids a visible 1-frame lag after custom collisions.
    if (ball.z <= 0.5) view.setPosition(ball.x, ball.y);
  }

  private drawDynamicMechanicsV82(seconds: number): void {
    const g = this.mechanicViewV82;
    g.clear();

    for (const zone of this.allFansV82()) this.drawFanV82(g, zone);
    (this.levelV82().portals ?? []).forEach((pair, index) => this.drawPortalPairV82(g, pair, index));

    for (const wall of this.levelV82().movingWalls ?? []) {
      this.drawMovingWallV82(g, this.movingWallRectV82(wall, seconds));
    }
    for (const bumper of this.levelV82().movingBumpers ?? []) {
      const point = this.movingBumperPointV82(bumper, seconds);
      this.drawMovingBumperV82(g, point.x, point.y, bumper.r);
    }
  }

  private drawFanV82(g: Phaser.GameObjects.Graphics, zone: FanDef): void {
    const len = Math.hypot(zone.dx, zone.dy) || 1;
    const dx = zone.dx / len;
    const dy = zone.dy / len;
    const px = -dy;
    const py = dx;
    const cx = zone.x + zone.w / 2;
    const cy = zone.y + zone.h / 2;
    const along = Math.abs(dx) * zone.w + Math.abs(dy) * zone.h;
    const across = Math.abs(px) * zone.w + Math.abs(py) * zone.h;

    for (let i = 0; i < 8; i += 1) {
      const cross = ((i + 0.5) / 8 - 0.5) * across * 0.72;
      const travel = (((this.mechanicPhaseV82 * 0.72 + i * 0.119) % 1) - 0.5) * along * 0.84;
      const x = cx + px * cross + dx * travel;
      const y = cy + py * cross + dy * travel;
      const streak = 18 + (i % 3) * 5;
      g.lineStyle(i % 2 ? 1.3 : 1.9, 0xe8f7ee, 0.13 + (i % 3) * 0.025);
      g.beginPath();
      g.moveTo(x - dx * streak * 0.6, y - dy * streak * 0.6);
      g.lineTo(x + dx * streak * 0.4, y + dy * streak * 0.4);
      g.strokePath();
    }

    const sourceX = cx - dx * along * 0.42;
    const sourceY = cy - dy * along * 0.42;
    const fanRadius = 19;
    g.fillStyle(0x17232b, 0.96);
    g.fillCircle(sourceX, sourceY, fanRadius + 4);
    g.lineStyle(2.5, 0x718899, 0.9);
    g.strokeCircle(sourceX, sourceY, fanRadius + 1);
    g.fillStyle(0x93adba, 0.72);
    const phase = this.mechanicPhaseV82 * 4.2;
    for (let i = 0; i < 4; i += 1) {
      const a = phase + i * Math.PI / 2;
      const tx = sourceX + Math.cos(a) * 15;
      const ty = sourceY + Math.sin(a) * 15;
      const sx = sourceX + Math.cos(a + 0.75) * 6;
      const sy = sourceY + Math.sin(a + 0.75) * 6;
      g.fillTriangle(sourceX, sourceY, tx, ty, sx, sy);
    }
    g.fillStyle(0xdde8ed, 0.92);
    g.fillCircle(sourceX, sourceY, 4.2);
  }

  private drawPortalPairV82(g: Phaser.GameObjects.Graphics, pair: PortalPairDef, index: number): void {
    const colors = [[0x79c8ff,0xc59aff],[0x88e0c0,0x8aa8ff],[0xf0bb78,0xd888ff]];
    const palette = colors[index % colors.length];
    this.drawPortalV82(g, pair.a, palette[0], this.mechanicPhaseV82 + index * 0.7);
    this.drawPortalV82(g, pair.b, palette[1], -this.mechanicPhaseV82 - index * 0.7);
  }

  private drawPortalV82(g: Phaser.GameObjects.Graphics, point: PortalPointDef, color: number, phase: number): void {
    const radius = point.r ?? 28;
    g.fillStyle(0x071019, 0.42);
    g.fillCircle(point.x + 2, point.y + 4, radius + 4);
    g.lineStyle(4, color, 0.78);
    g.strokeCircle(point.x, point.y, radius);
    g.lineStyle(1.3, 0xf4fbff, 0.22);
    g.strokeCircle(point.x, point.y, radius - 7);
    for (let i = 0; i < 7; i += 1) {
      const a = phase * 1.8 + i * Math.PI * 2 / 7;
      g.fillStyle(color, 0.28 + (i % 3) * 0.07);
      g.fillCircle(point.x + Math.cos(a) * (radius + 6), point.y + Math.sin(a) * (radius + 6), 1.8 + (i % 2) * 0.6);
    }
  }

  private drawMovingWallV82(g: Phaser.GameObjects.Graphics, rect: RectDef): void {
    g.fillStyle(0x101820, 0.28);
    g.fillRoundedRect(rect.x + 3, rect.y + 5, rect.w, rect.h, 6);
    g.fillStyle(0x40566a, 1);
    g.fillRoundedRect(rect.x, rect.y, rect.w, rect.h, 5);
    g.lineStyle(2, 0x9bb3c4, 0.55);
    g.strokeRoundedRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2, 4);
    g.fillStyle(0xd9e6ee, 0.45);
    g.fillCircle(rect.x + rect.w / 2, rect.y + rect.h / 2, 2.4);
  }

  private drawMovingBumperV82(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number): void {
    g.fillStyle(0x1b1108, 0.28);
    g.fillCircle(x + 2, y + 5, radius + 3);
    g.fillStyle(0xe5a347, 1);
    g.fillCircle(x, y, radius);
    g.lineStyle(3, 0xffe0a0, 0.8);
    g.strokeCircle(x, y, radius * 0.78);
    g.fillStyle(0x5b3818, 1);
    g.fillCircle(x, y, radius * 0.38);
  }

  private drawCurveV82(g: Phaser.GameObjects.Graphics, curve: CurveDef, dynamic: boolean): void {
    const thickness = curve.thickness ?? 22;
    g.lineStyle(thickness + 7, 0x14202a, dynamic ? 0.34 : 0.24);
    g.beginPath();
    g.arc(curve.x + 3, curve.y + 5, curve.r, curve.startAngle, curve.endAngle, false);
    g.strokePath();
    g.lineStyle(thickness, 0x344657, 1);
    g.beginPath();
    g.arc(curve.x, curve.y, curve.r, curve.startAngle, curve.endAngle, false);
    g.strokePath();
    g.lineStyle(2, 0x9cb0bf, 0.45);
    g.beginPath();
    g.arc(curve.x, curve.y, curve.r - thickness * 0.28, curve.startAngle, curve.endAngle, false);
    g.strokePath();
  }

  private movingWallRectV82(wall: MovingWallDef, seconds: number): RectDef {
    const q = Math.sin(seconds * (wall.speed ?? 1.15) + (wall.phase ?? 0)) * wall.amplitude;
    return {x:wall.x + (wall.axis === "x" ? q : 0), y:wall.y + (wall.axis === "y" ? q : 0), w:wall.w, h:wall.h};
  }

  private movingBumperPointV82(bumper: MovingBumperDef, seconds: number): {x:number;y:number} {
    const q = Math.sin(seconds * (bumper.speed ?? 1.3) + (bumper.phase ?? 0)) * bumper.amplitude;
    return {x:bumper.x + (bumper.axis === "x" ? q : 0), y:bumper.y + (bumper.axis === "y" ? q : 0)};
  }

  private movingVelocityV82(axis: "x"|"y", amplitude: number, speed: number, phase: number, seconds: number): number {
    void axis;
    return Math.cos(seconds * speed + phase) * amplitude * speed;
  }

  private pointInRectV82(point: {x:number;y:number}, rect: RectDef): boolean {
    return point.x > rect.x && point.x < rect.x + rect.w && point.y > rect.y && point.y < rect.y + rect.h;
  }

  private normalizeAngleV82(angle: number): number {
    const twoPi = Math.PI * 2;
    return ((angle % twoPi) + twoPi) % twoPi;
  }

  private angleInArcV82(angle: number, start: number, end: number): boolean {
    const a = this.normalizeAngleV82(angle);
    const s = this.normalizeAngleV82(start);
    const e = this.normalizeAngleV82(end);
    return s <= e ? a >= s && a <= e : a >= s || a <= e;
  }

  private playPortalBurstV82(x: number, y: number, arrival: boolean): void {
    const g = this.add.graphics().setDepth(13);
    const color = arrival ? 0xd8eeff : 0xbfa8ff;
    g.lineStyle(2.5, color, 0.72);
    g.strokeCircle(x, y, 18);
    for (let i = 0; i < 8; i += 1) {
      const a = i * Math.PI / 4;
      g.fillStyle(color, 0.72);
      g.fillCircle(x + Math.cos(a) * 24, y + Math.sin(a) * 24, 2.2);
    }
    this.tweens.add({targets:g,alpha:0,scaleX:arrival?1.8:0.55,scaleY:arrival?1.8:0.55,duration:260,ease:"Cubic.easeOut",onComplete:()=>g.destroy()});
  }
}
