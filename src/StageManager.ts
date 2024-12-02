import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';
import { ImageStageObject, StageObject } from './stageobjects';
import { CanvasLayer } from './types';

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

  public static canAddStageObjects(user: User): boolean
  public static canAddStageObjects(id: string): boolean
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static canAddStageObjects(arg: unknown): boolean {
    return true;
  }

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


  public static addStageObject(stageObject: StageObject, layer: CanvasLayer = "primary") {
    switch (layer) {
      case "background":
        this.backgroundCanvasGroup.addChild(stageObject.displayObject);
        break;
      case "foreground":
        this.foregroundCanvasGroup.addChild(stageObject.displayObject);
        break;
      case "primary":
        this.primaryCanvasGroup.addChild(stageObject.displayObject);
        break;
      case "text":
        this.textCanvasGroup.addChild(stageObject.displayObject);
    }
  }


  /**
   * Adds an {@link ImageStageObject} to the Stage.
   * @param {string} path - Path to the image to use as a texture
   * @param {string} [name] - Identifiable name for this object
   * @param {CanvasLayer} [layer="primary"] - {@link CanvasLayer} to which to add this object.
   * @returns 
   */
  public static addImage(path: string, name?: string, layer: CanvasLayer = "primary"): ImageStageObject {
    if (game.user && StageManager.canAddStageObjects(game.user as User)) {
      const obj = new ImageStageObject(path, name);
      StageManager.addStageObject(obj, layer);
      return obj;
    } else {
      throw new Error("");
    }
  }
}