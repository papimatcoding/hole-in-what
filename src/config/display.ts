import Phaser from "phaser";

export const DESIGN_WIDTH = 540;
export const DESIGN_HEIGHT = 960;
export const RENDER_SCALE = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

/**
 * Presentation-only device profile. Physics and authored course coordinates never depend on it.
 * A wide viewport with a precise pointer gets denser desktop affordances; touch/coarse pointers
 * keep the mobile-first presentation.
 */
export const DESKTOP_UI =
  window.innerWidth >= 820 &&
  window.innerHeight >= 600 &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function setupDesignCamera(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;
  camera.setZoom(RENDER_SCALE);
  camera.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
}

export function sharpenSceneText(scene: Phaser.Scene): void {
  for (const child of scene.children.list) {
    if (child instanceof Phaser.GameObjects.Text) {
      child.setResolution(RENDER_SCALE);
      if (DESKTOP_UI) {
        const raw=String(child.style.fontSize ?? "0");
        const size=Number.parseFloat(raw);
        // Several beta labels were authored at 8–11 design px for phones. At desktop viewing
        // distance those are needlessly tiny, so raise only the small-text floor.
        if (Number.isFinite(size) && size > 0 && size < 12) child.setFontSize(size <= 9 ? 11 : 12);
      }
    }
  }
}

export function pointerToDesign(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
  return scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
}
