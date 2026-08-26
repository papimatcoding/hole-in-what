import Phaser from "phaser";
import { DESIGN_HEIGHT, DESIGN_WIDTH, setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelsForMode } from "../data/levels";
import { SaveSystem } from "../systems/SaveSystem";
import type { GameMode } from "../types";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create(): void {
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0d1117");
    SaveSystem.claimEligibleStarRewards();

    const wallet = SaveSystem.wallet();
    this.add.text(DESIGN_WIDTH - 42, 54, `◈ ${wallet.coins}   ◆ ${wallet.gems}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#d9e4ee"
    }).setOrigin(1, 0.5);

    this.add.text(DESIGN_WIDTH / 2, 125, "TROLL GOLF", {
      fontFamily: "system-ui, sans-serif", fontSize: "46px", fontStyle: "bold", color: "#f5f7fa"
    }).setOrigin(0.5);

    this.add.text(DESIGN_WIDTH / 2, 172, "MINIGOLF · 3 ESTRELLAS", {
      fontFamily: "system-ui, sans-serif", fontSize: "13px", color: "#8f9dab"
    }).setOrigin(0.5);

    this.makeModeButton("CLASSIC", "classic", 285);
    this.makeModeButton("TROLL", "troll", 400);
    this.makeSimpleButton("PERSONALIZAR", 520, () => this.scene.start("cosmetics"));
    this.makeSimpleButton("TIENDA", 595, () => this.scene.start("shop"));
    this.makeSimpleButton("RECOMPENSAS", 670, () => this.scene.start("rewards"));

    const equipped = SaveSystem.cosmetics().equipped;
    this.add.text(DESIGN_WIDTH / 2, 748, `● ${equipped.ball.replace("ball-", "")}   ·   ─ ${equipped.trail.replace("trail-", "")}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "11px", color: "#667687"
    }).setOrigin(0.5);

    this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 48, "V6 · content pass", {
      fontFamily: "system-ui, sans-serif", fontSize: "12px", color: "#657282"
    }).setOrigin(0.5);

    sharpenSceneText(this);
  }

  private makeModeButton(label: string, mode: GameMode, y: number): void {
    const levels = levelsForMode(mode);
    const stars = SaveSystem.totalStars(levels.map((level) => level.id));
    const locked = mode === "troll" && !SaveSystem.isTrollUnlocked();

    const bg = this.add.rectangle(270, y, 390, 92, locked ? 0x121820 : 0x18212a)
      .setStrokeStyle(2, locked ? 0x27313b : 0x2d3a47);

    const title = this.add.text(105, y - 12, label, {
      fontFamily: "system-ui, sans-serif", fontSize: "24px", fontStyle: "bold", color: locked ? "#697480" : "#f5f7fa"
    }).setOrigin(0, 0.5);

    if (locked) {
      const progress = SaveSystem.classicProgress();
      this.add.text(435, y - 12, "BLOQUEADO", {
        fontFamily: "system-ui, sans-serif", fontSize: "10px", fontStyle: "bold", color: "#7a8793"
      }).setOrigin(1, 0.5);
      this.add.text(105, y + 22, `Consigue ${progress.requiredStars}★ o completa Classic`, {
        fontFamily: "system-ui, sans-serif", fontSize: "10px", color: "#657282"
      }).setOrigin(0, 0.5);
      this.add.text(435, y + 22, `${progress.stars}/${progress.requiredStars}★`, {
        fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#8d98a3"
      }).setOrigin(1, 0.5);
      return;
    }

    const progress = this.add.text(435, y + 16, `★ ${stars} / ${levels.length * 3}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", color: "#c9d4df"
    }).setOrigin(1, 0.5);

    const open = (): void => { this.scene.start("level-select", { mode }); };
    bg.setInteractive({ useHandCursor: true }).on("pointerup", open);
    title.setInteractive({ useHandCursor: true }).on("pointerup", open);
    progress.setInteractive({ useHandCursor: true }).on("pointerup", open);
    bg.on("pointerover", () => bg.setFillStyle(0x202b36));
    bg.on("pointerout", () => bg.setFillStyle(0x18212a));
  }

  private makeSimpleButton(label: string, y: number, action: () => void): void {
    const bg = this.add.rectangle(270, y, 390, 60, 0x151d25)
      .setStrokeStyle(1, 0x2b3744).setInteractive({ useHandCursor: true });
    const text = this.add.text(270, y, label, {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#d7e0e8"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    bg.on("pointerup", action);
    text.on("pointerup", action);
    bg.on("pointerover", () => bg.setFillStyle(0x1e2934));
    bg.on("pointerout", () => bg.setFillStyle(0x151d25));
  }
}
