import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';
import { StageObject } from './stageobjects';

let primaryCanvasGroup: ScreenSpaceCanvasGroup;
let bgCanvasGroup: ScreenSpaceCanvasGroup;
let fgCanvasGroup: ScreenSpaceCanvasGroup;
let textCanvasGroup: ScreenSpaceCanvasGroup;

/**
 * Core class for Stage Manager
 */
export class StageManager {

  public static get backgroundCanvasGroup() { return bgCanvasGroup; }
  public static get primaryCanvasGroup() { return primaryCanvasGroup; }
  public static get foregroundCanvasGroup() { return fgCanvasGroup; }
  public static get textCanvasGroup() { return textCanvasGroup; }


  /** Handles any initiatlization */
  public static init() {
    if (canvas?.stage) {
      bgCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerBackgroundCanvasGroup");
      primaryCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerPrimaryCanvasGroup");
      fgCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerForegroundCanvasGroup");
      textCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerTextCanvasGroup");

      canvas.stage.addChild(bgCanvasGroup);
      canvas.stage.addChild(primaryCanvasGroup);
      canvas.stage.addChild(fgCanvasGroup);
      canvas.stage.addChild(textCanvasGroup);

    }
  }


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static addStageObject(stageObject: StageObject) {
    // Empty
  }

}