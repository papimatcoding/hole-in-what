import Phaser from "phaser";
import { setupDesignCamera, sharpenSceneText } from "../config/display";
import { levelsForMode } from "../data/levels";
import { SaveSystem } from "../systems/SaveSystem";
import { formatRequirement } from "../systems/StarScoring";
import type { GameMode } from "../types";

interface LevelSelectData { mode: GameMode; page?: number; }

const PAGE_SIZE = 10;

export class LevelSelectScene extends Phaser.Scene {
  private mode: GameMode = "classic";
  private page = 0;

  constructor() {
    super("level-select");
  }

  init(data: LevelSelectData): void {
    this.mode = data.mode;
    this.page = data.page ?? 0;
  }

  create(): void {
    setupDesignCamera(this);
    if (this.mode === "troll" && !SaveSystem.isTrollUnlocked()) {
      this.scene.start("menu");
      return;
    }

    const levels = levelsForMode(this.mode);
    const pageCount = Math.max(1, Math.ceil(levels.length / PAGE_SIZE));
    this.page = Phaser.Math.Clamp(this.page, 0, pageCount - 1);
    const pageStart = this.page * PAGE_SIZE;
    const visible = levels.slice(pageStart, pageStart + PAGE_SIZE);

    this.cameras.main.setBackgroundColor("#0b0f14");

    this.add.text(34, 44, "‹", {
      fontFamily: "system-ui, sans-serif", fontSize: "40px", color: "#f5f7fa"
    }).setInteractive({ useHandCursor: true }).on("pointerup", () => this.scene.start("menu"));

    this.add.text(270, 58, this.mode.toUpperCase(), {
      fontFamily: "system-ui, sans-serif", fontSize: "30px", fontStyle: "bold", color: "#f5f7fa"
    }).setOrigin(0.5);

    const totalStars = SaveSystem.totalStars(levels.map((level) => level.id));
    this.add.text(270, 98, `★ ${totalStars} / ${levels.length * 3}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "15px", color: "#9eabb9"
    }).setOrigin(0.5);

    this.add.text(270, 130, `${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, levels.length)} de ${levels.length}`, {
      fontFamily: "system-ui, sans-serif", fontSize: "10px", color: "#657282"
    }).setOrigin(0.5);

    const cols = 2;
    const cardW = 210;
    const cardH = 104;
    const gapX = 18;
    const gapY = 15;
    const startX = 270 - (cardW + gapX) / 2;
    const startY = 205;

    visible.forEach((level, localIndex) => {
      const index = pageStart + localIndex;
      const col = localIndex % cols;
      const row = Math.floor(localIndex / cols);
      const x = startX + col * (cardW + gapX);
      const y = startY + row * (cardH + gapY);
      const record = SaveSystem.record(level.id);

      const card = this.add.rectangle(x, y, cardW, cardH, 0x172129)
        .setStrokeStyle(2, record.completed ? 0x536c7d : 0x2d3a47)
        .setInteractive({ useHandCursor: true });

      this.add.text(x - 82, y - 34, `G${level.group}`, {
        fontFamily: "system-ui, sans-serif", fontSize: "9px", fontStyle: "bold", color: "#667687"
      }).setOrigin(0, 0.5);

      this.add.text(x, y - 18, String(index + 1), {
        fontFamily: "system-ui, sans-serif", fontSize: "24px", fontStyle: "bold", color: "#f5f7fa"
      }).setOrigin(0.5);

      const stars = "★".repeat(record.stars) + "☆".repeat(3 - record.stars);
      this.add.text(x, y + 15, stars, {
        fontFamily: "system-ui, sans-serif", fontSize: "16px", color: record.stars > 0 ? "#f1d07a" : "#566473"
      }).setOrigin(0.5);

      this.add.text(x, y + 38, `3★ ${formatRequirement(level.threeStar, true)}`, {
        fontFamily: "system-ui, sans-serif", fontSize: "8px", color: "#8292a1"
      }).setOrigin(0.5);

      card.on("pointerup", () => this.scene.start("game", { mode: this.mode, levelIndex: index }));
      card.on("pointerover", () => card.setFillStyle(0x202c36));
      card.on("pointerout", () => card.setFillStyle(0x172129));
    });

    if (pageCount > 1) {
      this.makePageButton(205, 824, "‹", this.page > 0, () => this.scene.restart({ mode: this.mode, page: this.page - 1 }));
      this.add.text(270, 824, `${this.page + 1} / ${pageCount}`, {
        fontFamily: "system-ui, sans-serif", fontSize: "12px", fontStyle: "bold", color: "#8997a5"
      }).setOrigin(0.5);
      this.makePageButton(335, 824, "›", this.page < pageCount - 1, () => this.scene.restart({ mode: this.mode, page: this.page + 1 }));
    }

    sharpenSceneText(this);
  }

  private makePageButton(x: number, y: number, label: string, enabled: boolean, action: () => void): void {
    const bg = this.add.rectangle(x, y, 50, 42, enabled ? 0x1a2530 : 0x12181f)
      .setStrokeStyle(1, enabled ? 0x344454 : 0x252e37);
    const text = this.add.text(x, y - 2, label, {
      fontFamily: "system-ui, sans-serif", fontSize: "28px", color: enabled ? "#e6edf4" : "#46515c"
    }).setOrigin(0.5);
    if (!enabled) return;
    bg.setInteractive({ useHandCursor: true }).on("pointerup", action);
    text.setInteractive({ useHandCursor: true }).on("pointerup", action);
  }
}
