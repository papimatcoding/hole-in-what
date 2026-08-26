import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { cosmeticById } from "../data/cosmetics";
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
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0d1117");
    const reward = SaveSystem.submit(
      this.resultData.levelId,
      this.resultData.stars,
      this.resultData.strokes,
      this.resultData.timeMs
    );

    this.add.text(498, 54, `◈ ${reward.totalCoins}   ◆ ${reward.totalGems}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#d9e4ee"
    }).setOrigin(1, 0.5);

    const stars = "★".repeat(this.resultData.stars) + "☆".repeat(3 - this.resultData.stars);
    this.add.text(270, 235, stars, {
      fontFamily: "system-ui, sans-serif", fontSize: "56px", color: "#f1d07a"
    }).setOrigin(0.5);

    this.add.text(270, 330, `${this.resultData.strokes} golpes`, {
      fontFamily: "system-ui, sans-serif", fontSize: "28px", fontStyle: "bold", color: "#f5f7fa"
    }).setOrigin(0.5);

    this.add.text(270, 372, `${(this.resultData.timeMs / 1000).toFixed(1)} s`, {
      fontFamily: "system-ui, sans-serif", fontSize: "18px", color: "#9eabb9"
    }).setOrigin(0.5);

    if (reward.coinsEarned > 0) {
      const rewardText = this.add.text(270, 418, `+${reward.coinsEarned} ◈`, {
        fontFamily: "system-ui, sans-serif", fontSize: "16px", fontStyle: "bold", color: "#e4d29d"
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: rewardText, alpha: 1, y: 410, duration: 260, ease: "Cubic.easeOut" });
    }

    if (reward.newlyUnlockedCosmetics.length > 0) {
      const names = reward.newlyUnlockedCosmetics
        .map((id) => cosmeticById(id)?.name)
        .filter((name): name is string => Boolean(name));
      const unlockText = this.add.text(270, 460, `HITO DESBLOQUEADO\n${names.join(" · ")}`, {
        fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", align: "center", color: "#f1d07a"
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: unlockText, alpha: 1, scale: { from: 0.94, to: 1 }, duration: 300, ease: "Back.easeOut" });
    }

    this.makeButton("REPETIR", 545, () => {
      this.scene.start("game", { mode: this.resultData.mode, levelIndex: this.resultData.levelIndex });
    });

    const levels = levelsForMode(this.resultData.mode);
    if (this.resultData.levelIndex < levels.length - 1) {
      this.makeButton("SIGUIENTE", 645, () => {
        this.scene.start("game", { mode: this.resultData.mode, levelIndex: this.resultData.levelIndex + 1 });
      });
    }

    this.add.text(270, 760, "NIVELES", {
      fontFamily: "system-ui, sans-serif", fontSize: "15px", fontStyle: "bold", color: "#aeb9c5"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on("pointerup", () => {
        this.scene.start("level-select", { mode: this.resultData.mode, page: Math.floor(this.resultData.levelIndex / 10) });
      });

    sharpenSceneText(this);
  }

  private makeButton(label: string, y: number, action: () => void): void {
    const bg = this.add.rectangle(270, y, 330, 72, 0x1b2630)
      .setStrokeStyle(2, 0x344454).setInteractive({ useHandCursor: true });
    const text = this.add.text(270, y, label, {
      fontFamily: "system-ui, sans-serif", fontSize: "18px", fontStyle: "bold", color: "#f5f7fa"
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    bg.on("pointerup", action);
    text.on("pointerup", action);
    bg.on("pointerover", () => bg.setFillStyle(0x24313d));
    bg.on("pointerout", () => bg.setFillStyle(0x1b2630));
  }
}
