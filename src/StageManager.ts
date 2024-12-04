import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';
import { ImageStageObject, StageObject } from './stageobjects/';
import { SerializedStageObject, StageLayer } from './types';
import { coerceStageObject, coerceUser } from './coercion';
import { StageObjects } from './StageObjectCollection';
import { InvalidStageObjectError } from './errors';
import * as stageObjectTypes from "./stageobjects";
import { SocketManager } from './SocketManager';
import { log } from './logging';

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

  // #region Public Static Methods (11)

  public static Synchronize(data: SerializedStageObject[]) {

    for (const stageObject of data) {
      const obj = StageManager.StageObjects.get(stageObject.id);
      // If it isn't in our collection, add it.
      // This shouldn't happen, as it should have been added via
      // addStageObject
      if (!obj) {
        const deserialized = StageManager.deserialize(stageObject);
        if (deserialized) StageManager.addStageObject(deserialized);
      } else {
        obj.deserialize(stageObject);
      }
    }
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

    SYNCHRONIZATION_HASH[stageObject.id] = stageObject.serialize();
    log("Adding:", game?.settings, StageManager.canAddStageObjects(game.user as User));
    if (game?.settings && StageManager.canAddStageObjects(game.user as User)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      void (game.settings as any).set(__MODULE_ID__, "currentObjects", SYNCHRONIZATION_HASH);
    }
  }

  public static canAddStageObjects(user: User): boolean
  public static canAddStageObjects(user: string): boolean
  public static canAddStageObjects(arg: unknown): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const user = coerceUser(arg as any);
    if (user?.isGM) return true;
    return false;
  }

  public static deserialize(serialized: SerializedStageObject): StageObject | undefined {
    try {
      const newType = Object.values(stageObjectTypes).find(item => item.type === serialized.type);
      if (!newType) throw new InvalidStageObjectError(serialized.type);

      return newType.deserialize(serialized);
    } catch (err) {
      ui.notifications?.error((err as Error).message, { console: false });
      console.error(err);
    }
  }

  public static fullSync(data: SerializedStageObject[]) {
    for (const item of data)
      SYNCHRONIZATION_HASH[item.id] = item;
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

      if (canvas.app?.renderer) canvas.app.renderer.addListener("postrender", () => { synchronizeStageObjects(); })
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

  // #endregion Public Static Methods (11)
}

// #endregion Classes (1)

// #region Functions (3)

function onDragEnd() {
  const dragging = StageManager.StageObjects.contents.filter(item => item.dragging);
  for (const item of dragging) {
    item.dragging = false;
    item.synchronize = true;
  }
}

function onDragMove(event: PIXI.FederatedPointerEvent) {
  const dragging = StageManager.StageObjects.contents.filter(item => item.dragging || item.placing);
  for (const item of dragging) {
    item.x = event.screenX;
    item.y = event.screenY;
  }
}

function synchronizeStageObjects() {
  if (StageManager.canAddStageObjects(game?.user as User)) {
    const updates: SerializedStageObject[] = [];

    StageManager.StageObjects.forEach(stageObject => {
      if (!stageObject.synchronize) return;
      const previous = SYNCHRONIZATION_HASH[stageObject.id];
      if (previous) {
        const serialized = stageObject.serialize();

        if (!foundry.utils.objectsEqual(serialized, previous)) {

          updates.push(serialized);
          SYNCHRONIZATION_HASH[stageObject.id] = serialized;
        }
      }
    });

    if (updates.length) SocketManager.syncStageObjects(updates);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (game?.settings) void (game.settings as any).set(__MODULE_ID__, "currentObjects", Object.values(SYNCHRONIZATION_HASH));
  }
}

// #endregion Functions (3)

// #region Variables (6)

let primaryCanvasGroup: ScreenSpaceCanvasGroup;
let bgCanvasGroup: ScreenSpaceCanvasGroup;
let fgCanvasGroup: ScreenSpaceCanvasGroup;
let textCanvasGroup: ScreenSpaceCanvasGroup;
const stageObjects = new StageObjects();
const SYNCHRONIZATION_HASH: Record<string, SerializedStageObject> = {};

// #endregion Variables (6)
