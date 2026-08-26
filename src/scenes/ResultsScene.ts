import Phaser from "phaser";
import { levelsForMode } from "../data/levels";
import { SaveSystem } from "../systems/SaveSystem";
import type { ResultsSceneData } from "../types";

export class ResultsScene extends Phaser.Scene {
  private data!: ResultsSceneData;

  constructor() {
    super("results");
  }

  init(data: ResultsSceneData): void {
    this.data = data;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0d1117");
    SaveSystem.submit(this.data.levelId, this.data.stars, this.data.strokes, this.data.timeMs);

    const stars = "★".repeat(this.data.stars) + "☆".repeat(3 - this.data.stars);
    this.add.text(270, 255, stars, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "56px",
      color: "#f1d07a"
    }).setOrigin(0.5);

    this.add.text(270, 350, `${this.data.strokes} golpes`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0.5);

    this.add.text(270, 392, `${(this.data.timeMs / 1000).toFixed(1)} s`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      color: "#9eabb9"
    }).setOrigin(0.5);

    this.makeButton("REPETIR", 520, () => {
      this.scene.start("game", { mode: this.data.mode, levelIndex: this.data.levelIndex });
    });

    const levels = levelsForMode(this.data.mode);
    if (this.data.levelIndex < levels.length - 1) {
      this.makeButton("SIGUIENTE", 620, () => {
        this.scene.start("game", { mode: this.data.mode, levelIndex: this.data.levelIndex + 1 });
      });
    }

    this.add.text(270, 740, "NIVELES", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#aeb9c5"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.scene.start("level-select", { mode: this.data.mode }));
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
