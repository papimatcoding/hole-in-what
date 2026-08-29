import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { cosmeticById, type CosmeticDefinition } from "../data/cosmetics";
import { dailyShopIds, dailyShopLabel } from "../data/shopRotation";
import { drawBall } from "../systems/CosmeticRenderer";
import { SaveSystem } from "../systems/SaveSystem";

const CATEGORY_NAME: Record<CosmeticDefinition["category"], string> = {
  ball: "BOLA",
  trail: "ESTELA",
  holeEffect: "EFECTO DE HOYO"
};

export class ShopScene extends Phaser.Scene {
  private content!: Phaser.GameObjects.Container;
  private walletText!: Phaser.GameObjects.Text;
  private feedback!: Phaser.GameObjects.Text;

  constructor() {
    super("shop");
  }

  create(): void {
    setupDesignCamera(this);
    this.cameras.main.setBackgroundColor("#0d1117");

    this.add.text(42, 64, "‹", {
      fontFamily: "system-ui, sans-serif", fontSize: "38px", color: "#f5f7fa"
    }).setInteractive({ useHandCursor: true }).on("pointerup", () => this.scene.start("menu"));

    this.add.text(270, 78, "TIENDA", {
      fontFamily: "system-ui, sans-serif", fontSize: "28px", fontStyle: "bold", color: "#f5f7fa"
    }).setOrigin(0.5);

    this.add.text(270, 112, `ROTACIÓN DIARIA · ${dailyShopLabel()}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "10px", color: "#728091"
    }).setOrigin(0.5);

    this.walletText = this.add.text(492, 70, "", {
      fontFamily: "system-ui, sans-serif", fontSize: "13px", fontStyle: "bold", color: "#d9e4ee"
    }).setOrigin(1, 0.5);

    this.feedback = this.add.text(270, 855, "", {
      fontFamily: "system-ui, sans-serif", fontSize: "11px", color: "#d8c79d"
    }).setOrigin(0.5);

    this.content = this.add.container(0, 0);
    this.render();
    sharpenSceneText(this);
  }

  private render(): void {
    this.content.removeAll(true);
    const owned = new Set(SaveSystem.cosmetics().owned);
    const items = dailyShopIds().map((id) => cosmeticById(id)).filter((item): item is CosmeticDefinition => Boolean(item));

    items.forEach((item, index) => {
      const y = 255 + index * 185;
      const isOwned = owned.has(item.id);

      const card = this.add.rectangle(270, y, 420, 150, isOwned ? 0x18232c : 0x151d25)
        .setStrokeStyle(isOwned ? 2 : 1, isOwned ? 0x587083 : 0x2b3744);

      const icon = this.add.graphics();
      this.drawIcon(icon, item, 132, y);

      const category = this.add.text(205, y - 45, CATEGORY_NAME[item.category], {
        fontFamily: "system-ui, sans-serif", fontSize: "9px", fontStyle: "bold", color: "#738292"
      }).setOrigin(0, 0.5);

      const name = this.add.text(205, y - 18, item.name, {
        fontFamily: "system-ui, sans-serif", fontSize: "18px", fontStyle: "bold", color: "#f4f7fa"
      }).setOrigin(0, 0.5);

      const desc = this.add.text(205, y + 10, item.description, {
        fontFamily: "system-ui, sans-serif", fontSize: "9px", color: "#8492a0", wordWrap: { width: 220 }
      }).setOrigin(0, 0.5);

      const label = isOwned ? "EN TU COLECCIÓN" : `◈ ${item.price ?? 0}`;
      const buy = this.add.rectangle(360, y + 48, 130, 34, isOwned ? 0x1a222a : 0x253441)
        .setStrokeStyle(1, isOwned ? 0x303b45 : 0x486077);
      const buyText = this.add.text(360, y + 48, label, {
        fontFamily: "system-ui, sans-serif", fontSize: "9px", fontStyle: "bold", color: isOwned ? "#71808e" : "#e7eef5"
      }).setOrigin(0.5);

      if (!isOwned && item.price !== undefined) {
        const purchase = (): void => {
          if (!SaveSystem.purchase(item.id, item.price!)) {
            this.feedback.setText("No tienes suficientes monedas");
            this.tweens.add({ targets: this.walletText, alpha: 0.25, yoyo: true, duration: 90, repeat: 1 });
            return;
          }
          this.feedback.setText(`${item.name} añadido a tu colección`);
          this.render();
          sharpenSceneText(this);
        };
        buy.setInteractive({ useHandCursor: true }).on("pointerup", purchase);
        buyText.setInteractive({ useHandCursor: true }).on("pointerup", purchase);
      }

      this.content.add([card, icon, category, name, desc, buy, buyText]);
    });

    const wallet = SaveSystem.wallet();
    this.walletText.setText(`◈ ${wallet.coins}   ◆ ${wallet.gems}`);
  }

  private drawIcon(g: Phaser.GameObjects.Graphics, item: CosmeticDefinition, x: number, y: number): void {
    if (item.category === "ball") {
      drawBall(g, item, x, y, 36);
      return;
    }

    if (item.category === "trail") {
      // Center the complete trail composition on x instead of anchoring the ball on x.
      const ballX = x + 30;
      g.fillStyle(0xfbfefe, 1);
      g.fillCircle(ballX, y, 12);
      for (let i = 0; i < 6; i += 1) {
        const color = i % 2 === 0 ? item.primary : (item.secondary ?? item.primary);
        const particleX = x + 10 - i * 10;
        g.fillStyle(color, 0.82 - i * 0.11);
        if (item.id.includes("petal")) g.fillTriangle(particleX - 7, y, particleX + 1, y - 6, particleX + 2, y + 5);
        else g.fillCircle(particleX, y + Math.sin(i) * 5, Math.max(2, 7 - i * 0.7));
      }
      return;
    }

    g.fillStyle(0x12171b, 1);
    g.fillCircle(x, y, 18);
    g.lineStyle(4, item.primary, 0.85);
    g.strokeCircle(x, y, 38);
    g.lineStyle(2, item.secondary ?? item.primary, 0.4);
    g.strokeCircle(x, y, 52);
  }
}
