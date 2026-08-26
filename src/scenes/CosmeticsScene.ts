import Phaser from "phaser";
import { cosmeticsByCategory, type CosmeticCategory, type CosmeticDefinition } from "../data/cosmetics";
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
  seasonal: "TEMPORADA"
};

export class CosmeticsScene extends Phaser.Scene {
  private category: CosmeticCategory = "ball";
  private selectedIndex = 0;
  private preview!: Phaser.GameObjects.Graphics;
  private cards!: Phaser.GameObjects.Container;
  private equippedText!: Phaser.GameObjects.Text;
  private balanceText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;

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

    this.add.text(270, 78, "PERSONALIZAR", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "26px",
      fontStyle: "bold",
      color: "#f5f7fa"
    }).setOrigin(0.5);

    this.add.text(270, 112, "BOLAS · ESTELAS · EFECTOS", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      color: "#728091"
    }).setOrigin(0.5);

    this.balanceText = this.add.text(492, 70, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#d9e4ee"
    }).setOrigin(1, 0.5);

    this.preview = this.add.graphics();
    this.equippedText = this.add.text(270, 357, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      color: "#9eabb9"
    }).setOrigin(0.5);

    this.feedbackText = this.add.text(270, 387, "", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "11px",
      color: "#d7c6a0"
    }).setOrigin(0.5);

    this.makeTabs();
    this.cards = this.add.container(0, 0);
    this.updateBalance();
    this.renderCategory();
  }

  private makeTabs(): void {
    const cats: CosmeticCategory[] = ["ball", "trail", "holeEffect"];
    cats.forEach((category, index) => {
      const x = 112 + index * 158;
      const bg = this.add.rectangle(x, 430, 134, 48, 0x18212a)
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
        this.feedbackText.setText("");
        this.renderCategory();
      };
      bg.on("pointerup", open);
      text.on("pointerup", open);
    });
  }

  private renderCategory(): void {
    this.cards.removeAll(true);
    const items = cosmeticsByCategory(this.category);
    const save = SaveSystem.cosmetics();
    const equipped = save.equipped[CATEGORY_TO_SLOT[this.category]];

    items.forEach((item, index) => {
      const y = 500 + index * 88;
      const isOwned = save.owned.includes(item.id);
      const isEquipped = item.id === equipped;
      const fill = isEquipped ? 0x243341 : isOwned ? 0x171f28 : 0x131a21;
      const stroke = isEquipped ? 0x7fa1bd : 0x2b3744;

      const card = this.add.rectangle(270, y, 420, 72, fill)
        .setStrokeStyle(isEquipped ? 2 : 1, stroke)
        .setInteractive({ useHandCursor: true });

      const icon = this.add.graphics();
      this.drawSmallIcon(icon, item, 92, y);

      const name = this.add.text(132, y - 12, item.name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        color: isOwned ? "#f4f7fa" : "#c2cbd4"
      }).setOrigin(0, 0.5);

      const desc = this.add.text(132, y + 12, item.description, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "10px",
        color: "#7f8d9b"
      }).setOrigin(0, 0.5);

      let statusLabel = "EQUIPAR";
      if (isEquipped) statusLabel = "EQUIPADO";
      else if (!isOwned && item.price !== undefined) statusLabel = `◈ ${item.price}`;
      else if (!isOwned) statusLabel = "TEMPORADA";

      const status = this.add.text(448, y, statusLabel, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "10px",
        fontStyle: "bold",
        color: isEquipped ? "#dcecff" : isOwned ? "#98a7b7" : "#d8c79d"
      }).setOrigin(1, 0.5);

      const select = (): void => {
        this.selectedIndex = index;
        this.drawPreview(item);

        if (isOwned) {
          SaveSystem.equip(CATEGORY_TO_SLOT[this.category], item.id);
          this.feedbackText.setText("");
          this.renderCategory();
          return;
        }

        if (item.price === undefined) {
          this.feedbackText.setText("Contenido de temporada");
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
        this.renderCategory();
      };

      card.on("pointerup", select);
      status.setInteractive({ useHandCursor: true }).on("pointerup", select);
      this.cards.add([card, icon, name, desc, status]);
    });

    const selected = items[Math.min(this.selectedIndex, items.length - 1)] ?? items[0];
    if (selected) this.drawPreview(selected);
  }

  private updateBalance(): void {
    this.balanceText.setText(`◈ ${SaveSystem.coins()}`);
  }

  private drawPreview(item: CosmeticDefinition): void {
    this.preview.clear();
    const cx = 270;
    const cy = 246;

    this.preview.fillStyle(0x111820, 1);
    this.preview.fillRoundedRect(85, 150, 370, 174, 24);

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

    this.equippedText.setText(`${item.name} · ${RARITY_LABEL[item.rarity]}`);
  }

  private drawSmallIcon(g: Phaser.GameObjects.Graphics, item: CosmeticDefinition, x: number, y: number): void {
    if (item.category === "ball") {
      drawBall(g, item, x, y, 23);
      return;
    }

    if (item.category === "trail") {
      g.fillStyle(0xfbfefe, 1);
      g.fillCircle(x + 18, y, 7);
      if (item.id !== "trail-none") {
        for (let i = 0; i < 4; i += 1) {
          const color = i % 2 === 0 ? item.primary : (item.secondary ?? item.primary);
          g.fillStyle(color, 0.72 - i * 0.12);
          g.fillCircle(x + 3 - i * 11, y + Math.sin(i) * 5, 5 - i * 0.7);
        }
      }
      return;
    }

    g.fillStyle(0x11171b, 1);
    g.fillCircle(x, y + 3, 11);
    if (item.id !== "hole-default") {
      g.lineStyle(3, item.primary, 0.75);
      g.strokeCircle(x, y + 3, 23);
    }
  }
}
