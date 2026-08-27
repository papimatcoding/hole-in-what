import Phaser from "phaser";

export const DESIGN_WIDTH = 540;
export const DESIGN_HEIGHT = 960;
export const RENDER_SCALE = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

/**
 * Presentation-only form factor. Gameplay coordinates/physics stay identical on every device.
 * A fine pointer + hover is a better desktop signal than user-agent sniffing and still behaves
 * sensibly on touchscreen laptops/tablets.
 */
export function isDesktopUI(): boolean {
  const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? false;
  const hover = window.matchMedia?.("(hover: hover)").matches ?? false;
  return finePointer && hover && window.innerWidth >= 760;
}

export function uiFontSize(basePx:number, desktopBoost=2):string {
  return `${Math.round(basePx + (isDesktopUI()?desktopBoost:0))}px`;
}

export function setupDesignCamera(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;
  camera.setZoom(RENDER_SCALE);
  camera.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
}

export function sharpenSceneText(scene: Phaser.Scene): void {
  for (const child of scene.children.list) {
    if (child instanceof Phaser.GameObjects.Text) {
      child.setResolution(RENDER_SCALE);
    }
  }
}

export function pointerToDesign(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
  return scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
}
