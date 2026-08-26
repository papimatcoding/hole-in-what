import Phaser from "phaser";
import type { CosmeticDefinition } from "../data/cosmetics";

const DIMPLES = [
  [-0.34, -0.28, 0.10], [0.18, -0.38, 0.08], [0.36, -0.04, 0.09],
  [-0.08, 0.05, 0.08], [-0.35, 0.25, 0.075], [0.20, 0.31, 0.085]
] as const;

export function drawBall(
  g: Phaser.GameObjects.Graphics,
  item: CosmeticDefinition,
  x: number,
  y: number,
  r: number,
  alpha = 1
): void {
  g.fillStyle(0x000000, 0.16 * alpha);
  g.fillEllipse(x + r * 0.12, y + r * 0.28, r * 1.82, r * 1.18);

  if (item.id === "ball-midnight") {
    g.fillStyle(item.primary, alpha);
    g.fillCircle(x, y, r);
    g.lineStyle(Math.max(2, r * 0.11), item.secondary ?? 0x87a4bd, 0.95 * alpha);
    g.strokeCircle(x, y, r * 0.91);

    g.fillStyle(item.secondary ?? 0x87a4bd, 0.34 * alpha);
    g.fillCircle(x - r * 0.18, y - r * 0.18, r * 0.52);
    g.fillStyle(item.primary, alpha);
    g.fillCircle(x + r * 0.03, y - r * 0.27, r * 0.52);
    return;
  }

  if (item.id === "ball-spirit") {
    g.fillStyle(item.primary, 0.92 * alpha);
    g.fillCircle(x, y, r);
    g.lineStyle(Math.max(2, r * 0.09), item.secondary ?? 0xe9c7ff, 0.8 * alpha);
    g.strokeCircle(x, y, r * 0.92);
    g.lineStyle(Math.max(1, r * 0.055), 0xffffff, 0.35 * alpha);
    g.strokeCircle(x, y, r * 0.72);

    const petal = r * 0.24;
    g.fillStyle(item.secondary ?? 0xe9c7ff, 0.62 * alpha);
    for (let i = 0; i < 6; i += 1) {
      const a = i * Math.PI / 3;
      g.fillCircle(x + Math.cos(a) * r * 0.33, y + Math.sin(a) * r * 0.33, petal);
    }
    g.fillStyle(0xffffff, 0.9 * alpha);
    g.fillCircle(x, y, r * 0.15);
    return;
  }

  if (item.id === "ball-orbit") {
    g.fillStyle(item.primary, alpha);
    g.fillCircle(x, y, r);
    g.lineStyle(Math.max(2, r * 0.08), item.secondary ?? 0x83d7ff, 0.9 * alpha);
    g.strokeCircle(x, y, r * 0.88);
    g.lineStyle(Math.max(1, r * 0.07), item.secondary ?? 0x83d7ff, 0.72 * alpha);
    g.strokeEllipse(x, y, r * 2.45, r * 0.82);
    g.fillStyle(0xf4fbff, 0.95 * alpha);
    g.fillCircle(x + r * 0.93, y - r * 0.04, r * 0.13);
    g.fillStyle(item.secondary ?? 0x83d7ff, 0.20 * alpha);
    g.fillCircle(x - r * 0.25, y - r * 0.28, r * 0.38);
    return;
  }

  if (item.id === "ball-ember") {
    g.fillStyle(item.primary, alpha);
    g.fillCircle(x, y, r);
    g.lineStyle(Math.max(2, r * 0.08), item.secondary ?? 0xff9b4a, 0.9 * alpha);
    g.strokeCircle(x, y, r * 0.91);
    g.fillStyle(item.secondary ?? 0xff9b4a, 0.18 * alpha);
    g.fillCircle(x + r * 0.08, y + r * 0.04, r * 0.70);

    g.lineStyle(Math.max(1.5, r * 0.08), item.secondary ?? 0xff9b4a, 0.9 * alpha);
    const cracks = [
      [[-0.62, -0.46], [-0.20, -0.12], [-0.37, 0.18]],
      [[0.55, -0.40], [0.18, -0.08], [0.42, 0.25]],
      [[-0.10, 0.62], [0.05, 0.18], [0.30, 0.02]]
    ];
    for (const crack of cracks) {
      g.beginPath();
      g.moveTo(x + crack[0][0] * r, y + crack[0][1] * r);
      g.lineTo(x + crack[1][0] * r, y + crack[1][1] * r);
      g.lineTo(x + crack[2][0] * r, y + crack[2][1] * r);
      g.strokePath();
    }
    return;
  }

  if (item.id === "ball-ace") {
    const gold = item.secondary ?? 0xe5c66b;
    g.fillStyle(item.primary, alpha);
    g.fillCircle(x, y, r);
    g.lineStyle(Math.max(2, r * 0.10), gold, 0.95 * alpha);
    g.strokeCircle(x, y, r * 0.93);

    g.fillStyle(gold, 0.92 * alpha);
    g.fillTriangle(
      x - r * 0.58, y + r * 0.28,
      x, y - r * 0.58,
      x + r * 0.58, y + r * 0.28
    );
    g.fillStyle(item.primary, alpha);
    g.fillTriangle(
      x - r * 0.32, y + r * 0.18,
      x, y - r * 0.30,
      x + r * 0.32, y + r * 0.18
    );
    g.fillStyle(gold, 0.9 * alpha);
    g.fillCircle(x, y + r * 0.38, r * 0.12);
    return;
  }

  if (item.id === "ball-prism") {
    const violet = item.secondary ?? 0xc8a8ff;
    g.fillStyle(item.primary, alpha);
    g.fillCircle(x, y, r);
    g.lineStyle(Math.max(2, r * 0.09), violet, 0.95 * alpha);
    g.strokeCircle(x, y, r * 0.94);

    const facets = [
      [0, -0.72, 0.62, -0.18, 0.10, 0.08],
      [0.10, 0.08, 0.62, -0.18, 0.52, 0.55],
      [0.10, 0.08, 0.52, 0.55, -0.34, 0.62],
      [0, -0.72, 0.10, 0.08, -0.58, -0.08]
    ] as const;

    facets.forEach((facet, index) => {
      g.fillStyle(index % 2 === 0 ? violet : 0x9edfff, 0.28 * alpha);
      g.fillTriangle(
        x + facet[0] * r, y + facet[1] * r,
        x + facet[2] * r, y + facet[3] * r,
        x + facet[4] * r, y + facet[5] * r
      );
    });
    g.fillStyle(0xffffff, 0.55 * alpha);
    g.fillCircle(x - r * 0.28, y - r * 0.32, r * 0.14);
    return;
  }

  g.fillStyle(item.primary, alpha);
  g.fillCircle(x, y, r);
  g.lineStyle(Math.max(1.5, r * 0.075), item.secondary ?? 0xbac4ce, 0.95 * alpha);
  g.strokeCircle(x, y, r * 0.96);
  g.fillStyle(0xaeb9c4, 0.28 * alpha);
  for (const [dx, dy, size] of DIMPLES) {
    g.fillCircle(x + dx * r, y + dy * r, r * size);
  }
  g.fillStyle(0xffffff, 0.38 * alpha);
  g.fillCircle(x - r * 0.31, y - r * 0.34, r * 0.18);
}
