import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';
import { StageObject } from './stageobjects';

let canvasGroup: ScreenSpaceCanvasGroup | null = null;

/**
 * Core class for Stage Manager
 */
export class StageManager {

  public static get CanvasGroup() { return canvasGroup; }
  public static get foreground() { return canvas?.primary?.children.find(child => child.name === "foreground"); }
  public static get background() { return canvas?.primary?.children.find(child => child.name === "background"); }

  /** Handles any initiatlization */
  public static init() {
    if (canvas?.stage) {
      canvasGroup = new ScreenSpaceCanvasGroup();
      canvas.stage.addChild(canvasGroup);
    }
  }


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static addStageObject(stageObject: StageObject) {
    // Empty
  }

}