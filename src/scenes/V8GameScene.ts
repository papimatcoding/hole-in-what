import Phaser from "phaser";
import { GameScene } from "./GameScene";
import {
  MECHANIC_TUTORIALS,
  markMechanicSeen,
  unseenMechanics,
  type MechanicId
} from "../systems/MechanicTutorialSystem";
import type { LevelDefinition } from "../types";

interface RuntimeBall {
  x: number;
  y: number;
  z: number;
  vz: number;
}

interface AlphaTarget extends Phaser.GameObjects.GameObject {
  alpha: number;
  setAlpha(alpha: number): this;
}

export class V8GameScene extends GameScene {
  private objectiveTargets: AlphaTarget[] = [];
  private airFx!: Phaser.GameObjects.Graphics;
  private tutorialQueue: MechanicId[] = [];
  private tutorialOverlay: Phaser.GameObjects.Container | null = null;
  private previousZ = 0;

  create(): void {
    super.create();

    this.airFx = this.add.graphics().setDepth(9);
    this.objectiveTargets = this.findObjectiveHud();
    this.tutorialQueue = unseenMechanics(this.levelRef());
    this.previousZ = this.ballRef().z;

    if (this.tutorialQueue.length > 0) {
      this.showNextTutorial();
    }
  }

  update(time: number, deltaMs: number): void {
    if (this.tutorialOverlay) return;

    const beforeZ = this.ballRef().z;
    super.update(time, deltaMs);

    const ball = this.ballRef();
    this.enhanceJump(beforeZ, ball.z);
    this.updateObjectiveVisibility(deltaMs);
    this.previousZ = ball.z;
  }

  private levelRef(): LevelDefinition {
    return (this as unknown as { level: LevelDefinition }).level;
  }

  private ballRef(): RuntimeBall {
    return (this as unknown as { ball: RuntimeBall }).ball;
  }

  private ballViewRef(): Phaser.GameObjects.Container {
    return (this as unknown as { ballView: Phaser.GameObjects.Container }).ballView;
  }

  private setBaseMoving(value: boolean): void {
    (this as unknown as { moving: boolean }).moving = value;
  }

  private restartRunClock(): void {
    (this as unknown as { startedAt: number }).startedAt = performance.now();
    const timeText = (this as unknown as { timeText: Phaser.GameObjects.Text }).timeText;
    timeText?.setText("0.0 s");
  }

  private findObjectiveHud(): AlphaTarget[] {
    return this.children.list.filter((child): child is AlphaTarget => {
      if (child instanceof Phaser.GameObjects.Rectangle) {
        return Math.abs(child.x - 270) < 2 && Math.abs(child.y - 69) < 2 && child.width > 250 && child.width < 320;
      }

      if (child instanceof Phaser.GameObjects.Text) {
        return child.text.startsWith("3★") || child.text.startsWith("2★");
      }

      return false;
    }) as AlphaTarget[];
  }

  private updateObjectiveVisibility(deltaMs: number): void {
    if (this.objectiveTargets.length === 0) return;

    const ballView = this.ballViewRef();
    const overlapsHud = ballView.x > 92 && ballView.x < 448 && ballView.y > 24 && ballView.y < 132;
    const targetAlpha = overlapsHud ? 0.16 : 1;
    const blend = Math.min(1, deltaMs / 90);

    for (const target of this.objectiveTargets) {
      target.setAlpha(Phaser.Math.Linear(target.alpha, targetAlpha, blend));
    }
  }

  private enhanceJump(previousZ: number, currentZ: number): void {
    const ball = this.ballRef();
    const ballView = this.ballViewRef();
    const airborne = currentZ > 0.5 || Math.abs(ball.vz) > 0.5;

    this.airFx.clear();

    if (airborne) {
      const extraLift = currentZ * 0.10;
      ballView.y -= extraLift;

      const baseScale = ballView.scaleX;
      const vertical = Phaser.Math.Clamp(ball.vz / 600, -1, 1);
      const rising = Math.max(0, vertical);
      const falling = Math.max(0, -vertical);
      ballView.setScale(
        baseScale * (1 - rising * 0.035 + falling * 0.025),
        baseScale * (1 + rising * 0.075 - falling * 0.025)
      );

      const heightFactor = Phaser.Math.Clamp(currentZ / 210, 0, 1);
      const ballY = ballView.y;
      const groundY = ball.y;

      this.airFx.lineStyle(2, 0xd8f1ff, 0.07 + heightFactor * 0.13);
      this.airFx.beginPath();
      this.airFx.moveTo(ball.x, groundY - 2);
      this.airFx.lineTo(ballView.x, ballY + 10);
      this.airFx.strokePath();

      this.airFx.fillStyle(0xe9f8ff, 0.035 + heightFactor * 0.055);
      this.airFx.fillCircle(ballView.x, ballY, 18 + heightFactor * 4);
      this.airFx.lineStyle(1.5, 0xeaf8ff, 0.10 + heightFactor * 0.12);
      this.airFx.strokeCircle(ballView.x, ballY, 16 + heightFactor * 3);
    }

    if (previousZ <= 0.5 && currentZ > 0.5) {
      this.playTakeoffFx();
    } else if (previousZ > 0.5 && currentZ <= 0.5) {
      this.playLandingFx();
    }
  }

  private playTakeoffFx(): void {
    const ball = this.ballRef();
    const ring = this.add.ellipse(ball.x, ball.y + 4, 34, 14)
      .setStrokeStyle(2, 0xd9f1ff, 0.55)
      .setDepth(8);

    this.tweens.add({
      targets: ring,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 260,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy()
    });
  }

  private playLandingFx(): void {
    const ball = this.ballRef();
    const ring = this.add.ellipse(ball.x, ball.y + 4, 40, 16)
      .setStrokeStyle(2, 0xf2f7fa, 0.62)
      .setDepth(8);

    const core = this.add.ellipse(ball.x, ball.y + 4, 20, 8, 0xffffff, 0.10).setDepth(8);

    this.tweens.add({
      targets: [ring, core],
      scaleX: 2.15,
      scaleY: 2.15,
      alpha: 0,
      duration: 310,
      ease: "Cubic.easeOut",
      onComplete: () => {
        ring.destroy();
        core.destroy();
      }
    });
  }

  private showNextTutorial(): void {
    const id = this.tutorialQueue[0];
    if (!id) {
      this.tutorialOverlay = null;
      this.setBaseMoving(false);
      this.restartRunClock();
      return;
    }

    this.setBaseMoving(true);
    const tutorial = MECHANIC_TUTORIALS[id];

    const shade = this.add.rectangle(270, 480, 540, 960, 0x05080c, 0.72)
      .setInteractive({ useHandCursor: true });
    const card = this.add.rectangle(270, 478, 424, 326, 0x101820, 0.985)
      .setStrokeStyle(1.5, 0x354758, 0.95)
      .setInteractive({ useHandCursor: true });

    const icon = this.add.graphics();
    this.drawMechanicIcon(icon, id, 270, 350);

    const eyebrow = this.add.text(270, 286, "NUEVA MECÁNICA", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
      color: "#6f8293",
      letterSpacing: 2
    }).setOrigin(0.5);

    const title = this.add.text(270, 405, tutorial.title, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#f4f8fb"
    }).setOrigin(0.5);

    const body = this.add.text(270, 456, tutorial.body, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      color: "#a9b7c4",
      align: "center",
      lineSpacing: 4,
      wordWrap: { width: 342 }
    }).setOrigin(0.5, 0);

    const hint = this.add.text(270, 548, tutorial.hint, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#d7c98f",
      align: "center",
      wordWrap: { width: 330 }
    }).setOrigin(0.5, 0);

    const continueText = this.add.text(270, 608, "TOCA PARA CONTINUAR", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
      color: "#718293",
      letterSpacing: 1
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tutorialOverlay = this.add.container(0, 0, [shade, card, icon, eyebrow, title, body, hint, continueText])
      .setDepth(100)
      .setAlpha(0);

    this.tweens.add({ targets: this.tutorialOverlay, alpha: 1, duration: 170, ease: "Cubic.easeOut" });

    const dismiss = (): void => this.dismissTutorial(id);
    shade.on("pointerup", dismiss);
    card.on("pointerup", dismiss);
    continueText.on("pointerup", dismiss);
  }

  private dismissTutorial(id: MechanicId): void {
    if (!this.tutorialOverlay) return;

    markMechanicSeen(id);
    this.tutorialQueue.shift();
    const oldOverlay = this.tutorialOverlay;
    this.tutorialOverlay = null;
    oldOverlay.destroy(true);

    if (this.tutorialQueue.length > 0) {
      this.showNextTutorial();
      return;
    }

    this.setBaseMoving(false);
    this.restartRunClock();
  }

  private drawMechanicIcon(g: Phaser.GameObjects.Graphics, id: MechanicId, x: number, y: number): void {
    g.fillStyle(0x0b1117, 1);
    g.fillCircle(x, y, 48);
    g.lineStyle(1.5, 0x304150, 0.9);
    g.strokeCircle(x, y, 48);

    if (id === "sand") {
      g.fillStyle(0xd2b775, 1);
      g.fillRoundedRect(x - 34, y - 22, 68, 44, 12);
      g.fillStyle(0x9f8857, 0.55);
      for (let i = 0; i < 10; i += 1) {
        const px = x - 25 + (i % 5) * 13;
        const py = y - 10 + Math.floor(i / 5) * 18;
        g.fillCircle(px, py, 2.1);
      }
      return;
    }

    if (id === "ice") {
      g.fillStyle(0xa9dcea, 0.88);
      g.fillRoundedRect(x - 35, y - 23, 70, 46, 10);
      g.lineStyle(2, 0xe9fbff, 0.62);
      for (let i = -22; i <= 18; i += 20) {
        g.beginPath();
        g.moveTo(x + i - 8, y - 17);
        g.lineTo(x + i + 12, y + 17);
        g.strokePath();
      }
      return;
    }

    if (id === "booster") {
      g.fillStyle(0x397551, 1);
      g.fillRoundedRect(x - 36, y - 23, 72, 46, 10);
      g.fillStyle(0xe5f6e9, 0.95);
      g.fillTriangle(x + 22, y, x - 10, y - 16, x - 10, y + 16);
      g.fillRect(x - 24, y - 6, 27, 12);
      return;
    }

    if (id === "ramp") {
      g.fillStyle(0x526b7e, 1);
      g.fillTriangle(x - 35, y + 22, x + 35, y + 22, x + 35, y - 22);
      g.lineStyle(3, 0xb8d5e7, 0.8);
      g.beginPath();
      g.moveTo(x - 26, y + 14);
      g.lineTo(x + 23, y - 10);
      g.strokePath();
      g.fillStyle(0xe4f4ff, 0.9);
      g.fillTriangle(x + 28, y - 13, x + 12, y - 14, x + 22, y + 1);
      return;
    }

    if (id === "trampoline") {
      g.fillStyle(0x233a4c, 1);
      g.fillCircle(x, y, 31);
      g.lineStyle(5, 0x7fc9e8, 0.9);
      g.strokeCircle(x, y, 29);
      g.lineStyle(2, 0xe7f7ff, 0.75);
      g.strokeCircle(x, y, 16);
      g.fillStyle(0xe7f7ff, 0.9);
      g.fillTriangle(x, y - 25, x - 9, y - 8, x + 9, y - 8);
      return;
    }

    if (id === "void") {
      g.fillStyle(0x020508, 1);
      g.fillRoundedRect(x - 36, y - 25, 72, 50, 9);
      g.lineStyle(2, 0x456278, 0.8);
      g.strokeRoundedRect(x - 36, y - 25, 72, 50, 9);
      g.fillStyle(0x8bb8d4, 0.35);
      g.fillCircle(x - 17, y - 7, 2);
      g.fillCircle(x + 18, y + 10, 1.8);
      g.fillCircle(x + 6, y - 15, 1.4);
      return;
    }

    g.fillStyle(0x344657, 1);
    g.fillRoundedRect(x - 33, y - 10, 66, 20, 5);
    g.fillStyle(0x607689, 1);
    g.fillRect(x - 28, y - 7, 56, 4);
    g.lineStyle(2, 0xd0a35e, 0.9);
    g.beginPath();
    g.moveTo(x - 28, y - 25);
    g.lineTo(x - 19, y - 16);
    g.moveTo(x + 28, y - 25);
    g.lineTo(x + 19, y - 16);
    g.moveTo(x, y - 31);
    g.lineTo(x, y - 18);
    g.strokePath();
  }
}
