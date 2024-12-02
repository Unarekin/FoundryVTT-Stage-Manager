import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';

const canvasGroup = new ScreenSpaceCanvasGroup();

/**
 * Core class for Stage Manager
 */
export class StageManager {

  public static get CanvasGroup() { return canvasGroup; }

  /** Handles any initiatlization */
  public static init() {
    if (canvas?.stage) canvas.stage.addChild(canvasGroup);
  }


}