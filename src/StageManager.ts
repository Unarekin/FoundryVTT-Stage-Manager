import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';

let canvasGroup: ScreenSpaceCanvasGroup | null = null;

/**
 * Core class for Stage Manager
 */
export class StageManager {

  public static get CanvasGroup() { return canvasGroup; }

  /** Handles any initiatlization */
  public static init() {
    if (canvas?.stage) {
      canvasGroup = new ScreenSpaceCanvasGroup();
      canvas.stage.addChild(canvasGroup);
    }
  }


}