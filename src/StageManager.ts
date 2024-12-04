import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';
import { ImageStageObject, StageObject } from './stageobjects/';
import { SerializedStageObject, StageLayer } from './types';
import { coerceStageObject, coerceUser } from './coercion';
import { StageObjects } from './StageObjectCollection';
import { InvalidStageObjectError } from './errors';

import * as stageObjectTypes from "./stageobjects";

// #region Classes (1)

/**
 * Core class for Stage Manager
 */
export class StageManager {
  // #region Public Static Getters And Setters (5)

  public static get StageObjects() { return stageObjects; }

  public static get backgroundCanvasGroup() { return bgCanvasGroup; }

  public static get foregroundCanvasGroup() { return fgCanvasGroup; }

  public static get primaryCanvasGroup() { return primaryCanvasGroup; }

  public static get textCanvasGroup() { return textCanvasGroup; }

  // #endregion Public Static Getters And Setters (5)

  // #region Public Static Methods (9)

  /**
   * Adds an {@link ImageStageObject} to the Stage.
   * @param {string} path - Path to the image to use as a texture
   * @param {number} x
   * @param {number} y
   * @param {string} [name] - Identifiable name for this object
   * @param {StageLayer} [layer="primary"] - {@link StageLayer} to which to add this object.
   * @returns 
   */
  public static addImage(path: string, x?: number, y?: number, name?: string, layer: StageLayer = "primary"): ImageStageObject {
    if (StageManager.canAddStageObjects(game.user as User)) {
      const obj = new ImageStageObject(path, name);
      obj.x = typeof x === "number" ? x : window.innerWidth / 2;
      obj.y = typeof y === "number" ? y : window.innerHeight / 2;

      StageManager.addStageObject(obj, layer);
      return obj;
    } else {
      throw new Error("");
    }
  }

  public static addStageObject(stageObject: StageObject, layer: StageLayer = "primary") {
    StageManager.StageObjects.set(stageObject.id, stageObject);
    StageManager.setStageObjectLayer(stageObject, layer);
  }

  public static canAddStageObjects(user: User): boolean
  public static canAddStageObjects(user: string): boolean
  public static canAddStageObjects(arg: unknown): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const user = coerceUser(arg as any);
    if (user?.isGM) return true;
    return false;
  }


  public static deserialize(serialized: SerializedStageObject) {
    try {
      const newType = Object.values(stageObjectTypes).find(item => item.type === serialized.type);
      if (!newType) throw new InvalidStageObjectError(serialized.type);

      this.addStageObject(newType.deserialize(serialized), serialized.layer ?? "primary");
    } catch (err) {
      ui.notifications?.error((err as Error).message, { console: false });
      console.error(err);
    }
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

      // Drag events
      canvas.stage.on("pointermove", onDragMove);
      canvas.stage.on("pointerup", onDragEnd);
      canvas.stage.on("pointerupoutside", onDragEnd);
    }
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

  // #endregion Public Static Methods (9)
}

// #endregion Classes (1)

// #region Functions (2)

function onDragEnd() {
  const dragging = StageManager.StageObjects.contents.filter(item => item.dragging);
  for (const item of dragging)
    item.dragging = false;
}

function onDragMove(event: PIXI.FederatedPointerEvent) {
  const dragging = StageManager.StageObjects.contents.filter(item => item.dragging || item.placing);
  for (const item of dragging) {
    item.x = event.screenX;
    item.y = event.screenY;
  }
}

// #endregion Functions (2)

// #region Variables (5)

let primaryCanvasGroup: ScreenSpaceCanvasGroup;
let bgCanvasGroup: ScreenSpaceCanvasGroup;
let fgCanvasGroup: ScreenSpaceCanvasGroup;
let textCanvasGroup: ScreenSpaceCanvasGroup;
const stageObjects = new StageObjects();

// #endregion Variables (5)
