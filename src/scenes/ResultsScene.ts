import Phaser from "phaser";
import { levelsForMode } from "../data/levels";
import { SaveSystem } from "../systems/SaveSystem";
import type { ResultsSceneData } from "../types";

export class ResultsScene extends Phaser.Scene {
  private resultData!: ResultsSceneData;

  constructor() {
    super("results");
  }

  init(data: ResultsSceneData): void {
    this.resultData = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0d1117");
    const reward = SaveSystem.submit(
      this.resultData.levelId,
      this.resultData.stars,
      this.resultData.strokes,
      this.resultData.timeMs
    );

    this.add.text(498, 54, `◈ ${reward.totalCoins}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#d9e4ee"
    }).setOrigin(1, 0.5);

    const stars = "★".repeat(this.resultData.stars) + "☆".repeat(3 - this.resultData.stars);
    this.add.text(270, 245, stars, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "56px",
      color: "#f1d07a"
    }).setOrigin(0.5);

    this.add.text(270, 340, `${this.resultData.strokes} golpes`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0.5);

    this.add.text(270, 382, `${(this.resultData.timeMs / 1000).toFixed(1)} s`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      color: "#9eabb9"
    }).setOrigin(0.5);

    if (reward.coinsEarned > 0) {
      const rewardText = this.add.text(270, 430, `+${reward.coinsEarned} ◈`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: "#e4d29d"
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: rewardText, alpha: 1, y: 422, duration: 260, ease: "Cubic.easeOut" });
    }

    this.makeButton("REPETIR", 535, () => {
      this.scene.start("game", {
        mode: this.resultData.mode,
        levelIndex: this.resultData.levelIndex
      });
    });

    const levels = levelsForMode(this.resultData.mode);
    if (this.resultData.levelIndex < levels.length - 1) {
      this.makeButton("SIGUIENTE", 635, () => {
        this.scene.start("game", {
          mode: this.resultData.mode,
          levelIndex: this.resultData.levelIndex + 1
        });
      });
    }

    this.add.text(270, 755, "NIVELES", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#aeb9c5"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on("pointerup", () => {
        this.scene.start("level-select", { mode: this.resultData.mode });
      });
  }

  private makeButton(label: string, y: number, action: () => void): void {
    const bg = this.add.rectangle(270, y, 330, 72, 0x1b2630)
      .setStrokeStyle(2, 0x344454)
      .setInteractive({ useHandCursor: true });

    const text = this.add.text(270, y, label, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    bg.on("pointerup", action);
    text.on("pointerup", action);
    bg.on("pointerover", () => bg.setFillStyle(0x24313d));
    bg.on("pointerout", () => bg.setFillStyle(0x1b2630));
  }
}
