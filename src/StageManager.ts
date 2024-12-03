import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';
import { ImageStageObject, StageObject } from './stageobjects/';
import { StageLayer } from './types';
import { coerceStageObject, coerceUser } from './coercion';
import { StageObjects } from './StageObjectCollection';
import { InvalidStageObjectError } from './errors';

let primaryCanvasGroup: ScreenSpaceCanvasGroup;
let bgCanvasGroup: ScreenSpaceCanvasGroup;
let fgCanvasGroup: ScreenSpaceCanvasGroup;
let textCanvasGroup: ScreenSpaceCanvasGroup;

const stageObjects = new StageObjects();

/**
 * Core class for Stage Manager
 */
export class StageManager {

  public static get StageObjects() { return stageObjects; }

  public static get backgroundCanvasGroup() { return bgCanvasGroup; }
  public static get primaryCanvasGroup() { return primaryCanvasGroup; }
  public static get foregroundCanvasGroup() { return fgCanvasGroup; }
  public static get textCanvasGroup() { return textCanvasGroup; }

  public static canAddStageObjects(user: User): boolean
  public static canAddStageObjects(user: string): boolean
  public static canAddStageObjects(arg: unknown): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const user = coerceUser(arg as any);
    if (user?.isGM) return true;
    return false;
  }

  /** Handles any initiatlization */
  public static init() {
    if (canvas?.stage) {
      bgCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerBackgroundCanvasGroup", "background");
      primaryCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerPrimaryCanvasGroup", "primary");
      fgCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerForegroundCanvasGroup", "foreground");
      textCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerTextCanvasGroup", "text");

      canvas.stage.addChild(bgCanvasGroup);
      canvas.stage.addChild(primaryCanvasGroup);
      canvas.stage.addChild(fgCanvasGroup);
      canvas.stage.addChild(textCanvasGroup);

    }
  }

  public static setStageObjectLayer(stageObject: StageObject, layer: StageLayer) {
    switch (layer) {
      case "background":
        StageManager.backgroundCanvasGroup.addChild(stageObject.displayObject);
        break;
      case "foreground":
        StageManager.foregroundCanvasGroup.addChild(stageObject.displayObject);
        break;
      case "primary":
        StageManager.primaryCanvasGroup.addChild(stageObject.displayObject);
        break;
      case "text":
        StageManager.textCanvasGroup.addChild(stageObject.displayObject);
    }
  }

  public static addStageObject(stageObject: StageObject, layer: StageLayer = "primary") {
    StageManager.StageObjects.set(stageObject.id, stageObject);
    StageManager.setStageObjectLayer(stageObject, layer);
  }

  /**
   * Removes a {@link StageObject} from the stage, if present.
   * @param {string | StageObject} arg - The id or name of the {@link StageObject} to remove.
   * @returns {boolean}
   */
  public static removeStageObject(arg: unknown): boolean {
    const obj = coerceStageObject(arg);
    if (!obj) throw new InvalidStageObjectError(arg);
    return StageManager.StageObjects.delete(obj.id);
  }

  /**
   * Adds an {@link ImageStageObject} to the Stage.
   * @param {string} path - Path to the image to use as a texture
   * @param {number} x
   * @param {number} y
   * @param {string} [name] - Identifiable name for this object
   * @param {StageLayer} [layer="primary"] - {@link StageLayer} to which to add this object.
   * @returns 
   */
  public static addImage(path: string, x: number = window.innerWidth / 2, y: number = window.innerHeight / 2, name?: string, layer: StageLayer = "primary"): ImageStageObject {
    if (StageManager.canAddStageObjects(game.user as User)) {
      const obj = new ImageStageObject(path, name);
      obj.x = x + (obj.width / 2);
      obj.y = y + (obj.height / 2);

      StageManager.addStageObject(obj, layer);
      return obj;
    } else {
      throw new Error("");
    }
  }
}
