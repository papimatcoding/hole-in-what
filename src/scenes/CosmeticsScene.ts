import Phaser from "phaser";
import { cosmeticsByCategory, type CosmeticCategory, type CosmeticDefinition } from "../data/cosmetics";
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

export class CosmeticsScene extends Phaser.Scene {
  private category: CosmeticCategory = "ball";
  private selectedIndex = 0;
  private preview!: Phaser.GameObjects.Graphics;
  private cards!: Phaser.GameObjects.Container;
  private equippedText!: Phaser.GameObjects.Text;

  constructor() {
    super("cosmetics");
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#0d1117");

    this.add.text(42, 64, "‹", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "38px",
      color: "#f5f7fa"
    }).setInteractive({ useHandCursor: true })
      .on("pointerup", () => this.scene.start("menu"));

    this.add.text(270, 82, "PERSONALIZAR", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0.5);

    this.add.text(270, 116, "Todo es procedural por ahora", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      color: "#728091"
    }).setOrigin(0.5);

    this.preview = this.add.graphics();
    this.equippedText = this.add.text(270, 370, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      color: "#9eabb9"
    }).setOrigin(0.5);

    this.makeTabs();
    this.cards = this.add.container(0, 0);
    this.renderCategory();
  }

  private makeTabs(): void {
    const cats: CosmeticCategory[] = ["ball", "trail", "holeEffect"];
    cats.forEach((category, index) => {
      const x = 112 + index * 158;
      const bg = this.add.rectangle(x, 430, 134, 52, 0x18212a)
        .setStrokeStyle(1, 0x2d3a47)
        .setInteractive({ useHandCursor: true });
      const text = this.add.text(x, 430, CATEGORY_LABELS[category], {
        fontFamily: "system-ui, sans-serif",
        fontSize: "13px",
        fontStyle: "bold",
        color: "#c8d2dc"
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      const open = (): void => {
        this.category = category;
        this.selectedIndex = 0;
        this.renderCategory();
      };
      bg.on("pointerup", open);
      text.on("pointerup", open);
    });
  }

  private renderCategory(): void {
    this.cards.removeAll(true);
    const items = cosmeticsByCategory(this.category);
    const equipped = SaveSystem.cosmetics().equipped[CATEGORY_TO_SLOT[this.category]];

    items.forEach((item, index) => {
      const y = 520 + index * 112;
      const isEquipped = item.id === equipped;
      const card = this.add.rectangle(270, y, 420, 90, isEquipped ? 0x243341 : 0x171f28)
        .setStrokeStyle(isEquipped ? 2 : 1, isEquipped ? 0x7fa1bd : 0x2b3744)
        .setInteractive({ useHandCursor: true });

      const icon = this.add.graphics();
      this.drawSmallIcon(icon, item, 92, y);

      const name = this.add.text(135, y - 13, item.name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "17px",
        fontStyle: "bold",
        color: "#f4f7fa"
      }).setOrigin(0, 0.5);

      const desc = this.add.text(135, y + 15, item.description, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "11px",
        color: "#8593a2"
      }).setOrigin(0, 0.5);

      const status = this.add.text(445, y, isEquipped ? "EQUIPADO" : "EQUIPAR", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: isEquipped ? "#dcecff" : "#98a7b7"
      }).setOrigin(1, 0.5);

      const select = (): void => {
        this.selectedIndex = index;
        SaveSystem.equip(CATEGORY_TO_SLOT[this.category], item.id);
        this.renderCategory();
      };
      card.on("pointerup", select);
      status.setInteractive({ useHandCursor: true }).on("pointerup", select);

      this.cards.add([card, icon, name, desc, status]);
    });

    const selected = items[Math.min(this.selectedIndex, items.length - 1)] ?? items[0];
    if (selected) this.drawPreview(selected);
  }

  private drawPreview(item: CosmeticDefinition): void {
    this.preview.clear();
    const cx = 270;
    const cy = 255;

    this.preview.fillStyle(0x111820, 1);
    this.preview.fillRoundedRect(85, 160, 370, 175, 24);

    if (item.category === "ball") {
      this.preview.fillStyle(0x000000, 0.18);
      this.preview.fillEllipse(cx + 5, cy + 11, 86, 48);
      this.preview.fillStyle(item.primary, 1);
      this.preview.fillCircle(cx, cy, 45);
      this.preview.lineStyle(5, item.secondary ?? 0xbac4ce, 1);
      this.preview.strokeCircle(cx, cy, 45);
      if (item.id === "ball-spirit") {
        this.preview.lineStyle(3, item.secondary ?? 0xe9c7ff, 0.8);
        this.preview.strokeCircle(cx, cy, 25);
        this.preview.fillStyle(item.secondary ?? 0xe9c7ff, 0.7);
        for (let i = 0; i < 6; i += 1) {
          const angle = i * Math.PI / 3;
          this.preview.fillCircle(cx + Math.cos(angle) * 20, cy + Math.sin(angle) * 20, 8);
        }
      }
    } else if (item.category === "trail") {
      this.preview.fillStyle(0xfbfefe, 1);
      this.preview.fillCircle(360, cy, 19);
      if (item.id !== "trail-none") {
        for (let i = 0; i < 9; i += 1) {
          const x = 320 - i * 26;
          const alpha = 0.75 - i * 0.07;
          this.preview.fillStyle(i % 2 === 0 ? item.primary : (item.secondary ?? item.primary), alpha);
          if (item.id === "trail-petals") {
            this.preview.fillEllipse(x, cy + Math.sin(i) * 16, 17, 9);
          } else {
            this.preview.fillCircle(x, cy + Math.sin(i * 1.4) * 8, 8 - i * 0.45);
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
        this.preview.fillStyle(item.primary, 0.8);
        for (let i = 0; i < 8; i += 1) {
          const angle = i * Math.PI / 4;
          this.preview.fillEllipse(cx + Math.cos(angle) * 43, cy + 18 + Math.sin(angle) * 43, 28, 13);
        }
        this.preview.lineStyle(3, item.secondary ?? item.primary, 0.65);
        this.preview.strokeCircle(cx, cy + 18, 62);
      }
    }

    this.equippedText.setText(`${item.name} · ${item.rarity.toUpperCase()}`);
  }

  private drawSmallIcon(g: Phaser.GameObjects.Graphics, item: CosmeticDefinition, x: number, y: number): void {
    if (item.category === "ball") {
      g.fillStyle(item.primary, 1);
      g.fillCircle(x, y, 24);
      g.lineStyle(3, item.secondary ?? 0xbac4ce, 1);
      g.strokeCircle(x, y, 24);
      return;
    }

    if (item.category === "trail") {
      g.fillStyle(0xfbfefe, 1);
      g.fillCircle(x + 20, y, 8);
      if (item.id !== "trail-none") {
        for (let i = 0; i < 4; i += 1) {
          g.fillStyle(i % 2 === 0 ? item.primary : (item.secondary ?? item.primary), 0.7 - i * 0.12);
          g.fillCircle(x + 5 - i * 12, y + Math.sin(i) * 5, 6 - i * 0.8);
        }
      }
      return;
    }

    g.fillStyle(0x11171b, 1);
    g.fillCircle(x, y + 5, 12);
    if (item.id !== "hole-default") {
      g.lineStyle(3, item.primary, 0.75);
      g.strokeCircle(x, y + 5, 24);
    }
  }
}
