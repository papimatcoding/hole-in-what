import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { cosmeticsByCategory, type CosmeticCategory, type CosmeticDefinition } from "../data/cosmetics";
import { starRewardForCosmetic } from "../data/progression";
import { dailyShopIds, dailyShopLabel } from "../data/shopRotation";
import { drawBall } from "../systems/CosmeticRenderer";
import { SaveSystem } from "../systems/SaveSystem";
import type { EquippedCosmetics } from "../types";

const CATEGORY_LABELS: Record<CosmeticCategory, string> = {
  ball: "BOLA",
  trail: "ESTELA",
  holeEffect: "HOYO"
};

const CATEGORY_TO_SLOT: Record<CosmeticCategory, keyof EquippedCosmetics> = {
  ball: "ball",
  trail: "trail",
  holeEffect: "holeEffect"
};

const RARITY_LABEL: Record<CosmeticDefinition["rarity"], string> = {
  common: "COMÚN",
  rare: "RARO",
  epic: "ÉPICO",
  seasonal: "TEMPORADA",
  milestone: "HITO"
};

export class CosmeticsScene extends Phaser.Scene {
  private category: CosmeticCategory = "ball";
  private selectedIndex = 0;
  private preview!: Phaser.GameObjects.Graphics;
  private cards!: Phaser.GameObjects.Container;
  private previewLabel!: Phaser.GameObjects.Text;
  private balanceText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

  constructor() {
    super("cosmetics");
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

    this.add.text(270, 78, "PERSONALIZAR", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0.5);

    this.add.text(270, 112, "COLECCIÓN · TIENDA", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      color: "#728091"
    }).setOrigin(0.5);

    this.balanceText = this.add.text(492, 70, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#d9e4ee"
    }).setOrigin(1, 0.5);

    this.preview = this.add.graphics();
    this.previewLabel = this.add.text(270, 347, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      color: "#9eabb9"
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(270, 375, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      color: "#d7c6a0"
    }).setOrigin(0.5);

    this.add.text(270, 404, `TIENDA DIARIA · ${dailyShopLabel()}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
      color: "#657585"
    }).setOrigin(0.5);

    this.makeTabs();
    this.cards = this.add.container(0, 0);
    this.updateBalance();
    this.syncSelectedToEquipped();
    this.renderCategory();
    sharpenSceneText(this);
  }

  private makeTabs(): void {
    const cats: CosmeticCategory[] = ["ball", "trail", "holeEffect"];
    cats.forEach((category, index) => {
      const x = 112 + index * 158;
      const bg = this.add.rectangle(x, 438, 134, 44, 0x18212a)
        .setStrokeStyle(1, 0x2d3a47)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(x, 438, CATEGORY_LABELS[category], {
        fontFamily: "system-ui, sans-serif",
        fontSize: "12px",
        fontStyle: "bold",
        color: "#c8d2dc"
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const open = (): void => {
        this.category = category;
        this.feedbackText.setText("");
        this.syncSelectedToEquipped();
        this.renderCategory();
        sharpenSceneText(this);
      };
      bg.on("pointerup", open);
      text.on("pointerup", open);
    });
  }

  private visibleItems(): CosmeticDefinition[] {
    const save = SaveSystem.cosmetics();
    const owned = new Set(save.owned);
    const daily = new Set(dailyShopIds());

    return cosmeticsByCategory(this.category).filter((item) =>
      owned.has(item.id) || item.price === undefined || daily.has(item.id)
    );
  }

  private syncSelectedToEquipped(): void {
    const items = this.visibleItems();
    const equipped = SaveSystem.cosmetics().equipped[CATEGORY_TO_SLOT[this.category]];
    const equippedIndex = items.findIndex((item) => item.id === equipped);
    this.selectedIndex = equippedIndex >= 0 ? equippedIndex : 0;
  }

  private renderCategory(): void {
    this.cards.removeAll(true);
    const items = this.visibleItems();
    const save = SaveSystem.cosmetics();
    const equipped = save.equipped[CATEGORY_TO_SLOT[this.category]];
    const daily = new Set(dailyShopIds());

    items.forEach((item, index) => {
      const y = 500 + index * 62;
      const isOwned = save.owned.includes(item.id);
      const isEquipped = item.id === equipped;
      const isDaily = daily.has(item.id) && !isOwned;
      const reward = starRewardForCosmetic(item.id);
      const fill = isEquipped ? 0x243341 : isOwned ? 0x171f28 : 0x131a21;
      const stroke = isEquipped ? 0x7fa1bd : isDaily ? 0x6b5f3e : 0x2b3744;

      const card = this.add.rectangle(270, y, 420, 52, fill)
        .setStrokeStyle(isEquipped ? 2 : 1, stroke)
        .setInteractive({ useHandCursor: true });

      const icon = this.add.graphics();
      this.drawSmallIcon(icon, item, 92, y);

      const name = this.add.text(130, y - 9, item.name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        color: isOwned ? "#f4f7fa" : "#c2cbd4"
      }).setOrigin(0, 0.5);

      const desc = this.add.text(130, y + 10, item.description, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "8px",
        color: "#7f8d9b"
      }).setOrigin(0, 0.5);

      let statusLabel = "EQUIPAR";
      if (isEquipped) statusLabel = "EQUIPADO";
      else if (!isOwned && isDaily && item.price !== undefined) statusLabel = `◈ ${item.price}`;
      else if (!isOwned && reward) statusLabel = `★ ${reward.stars}`;
      else if (!isOwned && item.rarity === "seasonal") statusLabel = "PASE";

      const status = this.add.text(448, y, statusLabel, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "9px",
        fontStyle: "bold",
        color: isEquipped ? "#dcecff" : isOwned ? "#98a7b7" : reward ? "#e6ce80" : "#d8c79d"
      }).setOrigin(1, 0.5);

      const select = (): void => {
        this.selectedIndex = index;
        this.drawPreview(item);

        if (isOwned) {
          SaveSystem.equip(CATEGORY_TO_SLOT[this.category], item.id);
          this.feedbackText.setText("");
          this.renderCategory();
          sharpenSceneText(this);
          return;
        }

        if (reward) {
          this.feedbackText.setText(`Se desbloquea al llegar a ${reward.stars} estrellas`);
          return;
        }

        if (item.rarity === "seasonal") {
          this.feedbackText.setText("Contenido de temporada");
          return;
        }

        if (!isDaily || item.price === undefined) {
          this.feedbackText.setText("No está disponible hoy");
          return;
        }

        if (!SaveSystem.purchase(item.id, item.price)) {
          this.feedbackText.setText("No tienes suficientes monedas");
          this.tweens.add({ targets: this.balanceText, alpha: 0.25, yoyo: true, duration: 90, repeat: 1 });
          return;
        }

        SaveSystem.equip(CATEGORY_TO_SLOT[this.category], item.id);
        this.feedbackText.setText("Desbloqueado");
        this.updateBalance();
        this.syncSelectedToEquipped();
        this.renderCategory();
        sharpenSceneText(this);
      };

      card.on("pointerup", select);
      status.setInteractive({ useHandCursor: true }).on("pointerup", select);
      this.cards.add([card, icon, name, desc, status]);
    });

    const selected = items[Math.min(this.selectedIndex, items.length - 1)] ?? items[0];
    if (selected) this.drawPreview(selected);
  }

  private updateBalance(): void {
    const wallet = SaveSystem.wallet();
    this.balanceText.setText(`◈ ${wallet.coins}   ◆ ${wallet.gems}`);
  }

  private drawPreview(item: CosmeticDefinition): void {
    this.preview.clear();
    const cx = 270;
    const cy = 238;

    this.preview.fillStyle(0x111820, 1);
    this.preview.fillRoundedRect(85, 145, 370, 166, 24);

    if (item.category === "ball") {
      drawBall(this.preview, item, cx, cy, 46);
    } else if (item.category === "trail") {
      this.preview.fillStyle(0xfbfefe, 1);
      this.preview.fillCircle(365, cy, 19);
      if (item.id !== "trail-none") {
        for (let i = 0; i < 10; i += 1) {
          const x = 326 - i * 24;
          const alpha = Math.max(0.12, 0.82 - i * 0.07);
          const color = i % 2 === 0 ? item.primary : (item.secondary ?? item.primary);
          this.preview.fillStyle(color, alpha);
          if (item.id === "trail-petals") {
            this.preview.fillTriangle(x - 8, cy, x + 5, cy - 6, x + 8, cy + 5);
          } else if (item.id === "trail-sparks") {
            this.preview.fillRect(x, cy + Math.sin(i * 1.7) * 13, 8, 3);
          } else {
            this.preview.fillCircle(x, cy + Math.sin(i * 1.3) * 8, Math.max(2, 7 - i * 0.42));
          }
        }
      }
    } else {
      this.preview.fillStyle(0x12171b, 1);
      this.preview.fillCircle(cx, cy + 18, 22);
      if (item.id === "hole-pulse") {
        this.preview.lineStyle(5, item.primary, 0.8);
        this.preview.strokeCircle(cx, cy + 18, 48);
        this.preview.lineStyle(2, item.primary, 0.35);
        this.preview.strokeCircle(cx, cy + 18, 72);
      } else if (item.id === "hole-bloom") {
        this.preview.fillStyle(item.primary, 0.72);
        for (let i = 0; i < 8; i += 1) {
          const angle = i * Math.PI / 4;
          const px = cx + Math.cos(angle) * 45;
          const py = cy + 18 + Math.sin(angle) * 45;
          this.preview.fillCircle(px, py, 11);
        }
        this.preview.lineStyle(3, item.secondary ?? item.primary, 0.6);
        this.preview.strokeCircle(cx, cy + 18, 62);
      } else if (item.id === "hole-nova") {
        this.preview.lineStyle(4, item.primary, 0.85);
        for (let i = 0; i < 10; i += 1) {
          const angle = i * Math.PI / 5;
          this.preview.beginPath();
          this.preview.moveTo(cx + Math.cos(angle) * 32, cy + 18 + Math.sin(angle) * 32);
          this.preview.lineTo(cx + Math.cos(angle) * 73, cy + 18 + Math.sin(angle) * 73);
          this.preview.strokePath();
        }
      }
    }

    this.previewLabel.setText(`${item.name} · ${RARITY_LABEL[item.rarity]}`);
  }

  private drawSmallIcon(g: Phaser.GameObjects.Graphics, item: CosmeticDefinition, x: number, y: number): void {
    if (item.category === "ball") {
      drawBall(g, item, x, y, 19);
      return;
    }

    if (item.category === "trail") {
      g.fillStyle(0xfbfefe, 1);
      g.fillCircle(x + 18, y, 6);
      if (item.id !== "trail-none") {
        for (let i = 0; i < 4; i += 1) {
          const color = i % 2 === 0 ? item.primary : (item.secondary ?? item.primary);
          g.fillStyle(color, 0.72 - i * 0.12);
          g.fillCircle(x + 3 - i * 11, y + Math.sin(i) * 5, 4.5 - i * 0.6);
        }
      }
      return;
    }

    g.fillStyle(0x11171b, 1);
    g.fillCircle(x, y + 3, 10);
    if (item.id !== "hole-default") {
      g.lineStyle(3, item.primary, 0.75);
      g.strokeCircle(x, y + 3, 21);
    }
  }
}
