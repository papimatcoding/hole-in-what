import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { cosmeticById } from "../data/cosmetics";
import { STAR_REWARDS } from "../data/progression";
import { drawBall } from "../systems/CosmeticRenderer";
import { SaveSystem } from "../systems/SaveSystem";

export class RewardsScene extends Phaser.Scene {
  constructor() {
    super("rewards");
  }

  create(): void {
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0d1117");
    SaveSystem.claimEligibleStarRewards();

    this.add.text(42, 64, "‹", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "38px",
      color: "#f5f7fa"
    }).setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.scene.start("menu"));

    this.add.text(270, 78, "RECOMPENSAS", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0.5);

    const totalStars = SaveSystem.totalStarsAll();
    this.add.text(270, 125, `★ ${totalStars}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: "#f1d07a"
    }).setOrigin(0.5);

    this.add.text(270, 153, "HITOS DE ESTRELLAS", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      color: "#768493"
    }).setOrigin(0.5);

    STAR_REWARDS.forEach((reward, index) => {
      const item = cosmeticById(reward.cosmeticId);
      if (!item) return;

      const unlocked = SaveSystem.isOwned(item.id);
      const y = 245 + index * 135;
      const card = this.add.rectangle(270, y, 420, 104, unlocked ? 0x1e2b34 : 0x151c23)
        .setStrokeStyle(unlocked ? 2 : 1, unlocked ? 0x6e8da5 : 0x2b3744);

      const icon = this.add.graphics();
      if (item.category === "ball") {
        drawBall(icon, item, 105, y, 26);
      } else if (item.category === "trail") {
        icon.fillStyle(item.primary, unlocked ? 0.95 : 0.35);
        for (let i = 0; i < 5; i += 1) {
          icon.fillCircle(82 + i * 12, y + Math.sin(i) * 5, 3 + i * 0.5);
        }
      } else {
        icon.lineStyle(3, item.primary, unlocked ? 0.9 : 0.35);
        icon.strokeCircle(105, y, 22);
      }

      this.add.text(148, y - 20, item.name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "17px",
        fontStyle: "bold",
        color: unlocked ? "#f5f7fa" : "#aab5c0"
      }).setOrigin(0, 0.5);

      this.add.text(148, y + 12, item.description, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "10px",
        color: "#7d8a98"
      }).setOrigin(0, 0.5);

      this.add.text(450, y - 20, `★ ${reward.stars}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color: unlocked ? "#f1d07a" : "#6e7882"
      }).setOrigin(1, 0.5);

      this.add.text(450, y + 18, unlocked ? "DESBLOQUEADO" : `${Math.max(0, reward.stars - totalStars)}★ FALTAN`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "9px",
        fontStyle: "bold",
        color: unlocked ? "#9fc5ae" : "#6e7882"
      }).setOrigin(1, 0.5);

      card.setAlpha(unlocked ? 1 : 0.9);
    });

    this.add.text(270, 820, "SE DESBLOQUEAN AUTOMÁTICAMENTE", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "10px",
      color: "#657282"
    }).setOrigin(0.5);

    sharpenSceneText(this);
  }
}
