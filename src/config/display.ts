import Phaser from "phaser";
import { I18n } from "../systems/I18nSystem";

export const DESIGN_WIDTH = 540;
export const DESIGN_HEIGHT = 960;
export const RENDER_SCALE = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2);

function desktopPresentation(): boolean {
  const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? false;
  const hover = window.matchMedia?.("(hover: hover)").matches ?? false;
  return finePointer && hover && window.innerWidth >= 760;
}

/** Desktop renders a 16:9 viewport around the unchanged portrait course. The extra
 * horizontal world space is intentional input room, not extra playable golf terrain. */
export const VIEW_WIDTH = desktopPresentation() ? Math.round(DESIGN_HEIGHT * 16 / 9) : DESIGN_WIDTH;

/** Presentation-only form factor. Gameplay coordinates/physics stay identical on every device. */
export function isDesktopUI(): boolean {
  return desktopPresentation();
}

export function uiFontSize(basePx:number, desktopBoost=2):string {
  return `${Math.round(basePx + (isDesktopUI()?desktopBoost:0))}px`;
}

export function setupDesignCamera(scene: Phaser.Scene): void {
  const camera = scene.cameras.main;
  camera.setZoom(RENDER_SCALE);
  // Always center on the authored 540px course. A desktop camera simply sees more world left/right.
  camera.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
}

export function sharpenSceneText(scene: Phaser.Scene): void {
  I18n.localizeScene(scene);
  for (const child of scene.children.list) {
    if (child instanceof Phaser.GameObjects.Text) child.setResolution(RENDER_SCALE);
  }
}

export function pointerToDesign(scene: Phaser.Scene, pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
  return scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
}
