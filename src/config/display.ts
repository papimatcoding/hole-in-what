import Phaser from "phaser";

export const DESIGN_WIDTH = 540;
export const DESIGN_HEIGHT = 960;
export const RENDER_SCALE = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

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
