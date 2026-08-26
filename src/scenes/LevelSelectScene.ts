import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelsForMode } from "../data/levels";
import { SaveSystem } from "../systems/SaveSystem";
import type { GameMode } from "../types";

interface LevelSelectData { mode: GameMode; }

export class LevelSelectScene extends Phaser.Scene {
  private mode: GameMode = "classic";

  constructor() {
    super("level-select");
  }

  init(data: LevelSelectData): void {
    this.mode = data.mode;
  }

  create(): void {
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0d1117");

    if (this.mode === "troll" && !SaveSystem.isTrollUnlocked()) {
      this.scene.start("menu");
      return;
    }

    const levels = levelsForMode(this.mode);

    this.add.text(34, 44, "‹", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "40px",
      color: "#f5f7fa"
    }).setInteractive({ useHandCursor: true }).on("pointerup", () => this.scene.start("menu"));

    this.add.text(270, 62, this.mode.toUpperCase(), {
      fontFamily: "system-ui, sans-serif",
      fontSize: "30px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0.5);

    const totalStars = SaveSystem.totalStars(levels.map((level) => level.id));
    this.add.text(270, 102, `★ ${totalStars} / ${levels.length * 3}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "15px",
      color: "#9eabb9"
    }).setOrigin(0.5);

    const cols = 2;
    const cardW = 210;
    const cardH = 112;
    const gapX = 18;
    const gapY = 22;
    const startX = 270 - (cardW + gapX) / 2;
    const startY = 190;

    levels.forEach((level, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const record = SaveSystem.record(level.id);

      const card = this.add.rectangle(x, y, cardW, cardH, 0x18212a)
        .setStrokeStyle(2, record.completed ? 0x4a6274 : 0x2d3a47)
        .setInteractive({ useHandCursor: true });

      this.add.text(x, y - 20, String(index + 1), {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        fontStyle: "bold",
        color: "#f5f7fa"
      }).setOrigin(0.5);

      const stars = "★".repeat(record.stars) + "☆".repeat(3 - record.stars);
      this.add.text(x, y + 22, stars, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        color: record.stars > 0 ? "#f1d07a" : "#566473"
      }).setOrigin(0.5);

      card.on("pointerup", () => this.scene.start("game", { mode: this.mode, levelIndex: index }));
      card.on("pointerover", () => card.setFillStyle(0x202b36));
      card.on("pointerout", () => card.setFillStyle(0x18212a));
    });

    sharpenSceneText(this);
  }
}
