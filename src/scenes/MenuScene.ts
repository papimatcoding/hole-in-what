import Phaser from "phaser";
import { levelsForMode } from "../data/levels";
import { SaveSystem } from "../systems/SaveSystem";
import type { GameMode } from "../types";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#0d1117");

    this.add.text(width / 2, 150, "TROLL GOLF", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "48px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0.5);

    this.add.text(width / 2, 200, "MINIGOLF · 3 ESTRELLAS · UN POCO DE DESCONFIANZA", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      color: "#8f9dab"
    }).setOrigin(0.5);

    this.makeModeButton("CLASSIC", "classic", 340);
    this.makeModeButton("TROLL", "troll", 460);

    this.add.text(width / 2, height - 70, "V5 · desarrollo", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      color: "#657282"
    }).setOrigin(0.5);
  }

  private makeModeButton(label: string, mode: GameMode, y: number): void {
    const levels = levelsForMode(mode);
    const stars = SaveSystem.totalStars(levels.map((level) => level.id));

    const bg = this.add.rectangle(270, y, 390, 92, 0x18212a)
      .setStrokeStyle(2, 0x2d3a47)
      .setInteractive({ useHandCursor: true });

    const title = this.add.text(105, y - 12, label, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0, 0.5);

    const progress = this.add.text(435, y + 16, `★ ${stars} / ${levels.length * 3}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: "#c9d4df"
    }).setOrigin(1, 0.5);

    const open = (): void => {
      this.scene.start("level-select", { mode });
    };

    bg.on("pointerup", open);
    title.setInteractive({ useHandCursor: true }).on("pointerup", open);
    progress.setInteractive({ useHandCursor: true }).on("pointerup", open);

    bg.on("pointerover", () => bg.setFillStyle(0x202b36));
    bg.on("pointerout", () => bg.setFillStyle(0x18212a));
  }
}
