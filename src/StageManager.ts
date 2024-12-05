import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';
import { ImageStageObject, StageObject } from './stageobjects/';
import { SerializedStageObject, StageLayer } from './types';
import { coerceStageObject, coerceUser } from './coercion';
import { StageObjects } from './StageObjectCollection';
import { InvalidStageObjectError, PermissionDeniedError } from './errors';
import * as stageObjectTypes from "./stageobjects";
import { SocketManager } from './SocketManager';
import { getSetting, setSetting } from './Settings';

// #region Classes (1)

/**
 * Core class for Stage Manager
 */
export class StageManager {
  // #region Public Static Getters And Setters (8)

  public static get HighlightedObjects(): StageObject[] { return StageManager.StageObjects.filter(obj => obj.highlighted); }

  public static get SelectedObjects(): StageObject[] { return StageManager.StageObjects.filter(obj => obj.selected); }

  public static get StageObjects() { return stageObjects; }

  public static get backgroundCanvasGroup() { return bgCanvasGroup; }

  public static get foregroundCanvasGroup() { return fgCanvasGroup; }

  public static get primaryCanvasGroup() { return primaryCanvasGroup; }

  public static get textCanvasGroup() { return textCanvasGroup; }

  public static get uiCanvasGroup() { return uiCanvasGroup; }

  // #endregion Public Static Getters And Setters (8)

  // #region Public Static Methods (13)

  public static DeselectAll() {
    StageManager.StageObjects.forEach(child => child.selected = false)
  }

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
    if (StageManager.canAddStageObjects(game.user?.id ?? "")) {
      const obj = new ImageStageObject(path, name);
      obj.x = typeof x === "number" ? x : window.innerWidth / 2;
      obj.y = typeof y === "number" ? y : window.innerHeight / 2;

      StageManager.addStageObject(obj, layer);
      return obj;
    } else {
      throw new PermissionDeniedError();
    }
  }

  public static addStageObject(stageObject: StageObject, layer: StageLayer = "primary", placing = false) {
    StageManager.StageObjects.set(stageObject.id, stageObject);
    StageManager.setStageObjectLayer(stageObject, layer);

    SYNCHRONIZATION_HASH[stageObject.id] = stageObject.serialize();
    if (StageManager.canAddStageObjects(game.user?.id ?? "")) {
      void setSetting("currentObjects", SYNCHRONIZATION_HASH);
      if (!placing) SocketManager.addStageObject(stageObject);
    }
  }

  public static canAddStageObjects(userId: string): boolean {
    const user = coerceUser(userId);
    if (user?.isGM) return true;
    return false;
  }

  public static canDeleteStageObject(userId: string, objectId: string): boolean {
    const user = coerceUser(userId);
    if (!user) return false;
    if (user.isGM) return true;
    return StageManager.getOwners(objectId).includes(userId);
  }

  public static canModifyStageObject(userId: string, objectId: string): boolean {
    const user = coerceUser(userId);
    if (!user) return false;
    if (user.isGM) return true;
    const owners = StageManager.getOwners(objectId);
    return owners.includes(userId);
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

  /**
   * Returns a list of user IDs that are considered to have ownership over a given {@link StageObject}
   * @param {string} objId - id of the {@link StageObject} for which to get owners
   * @returns {string[]}
   */
  public static getOwners(objId: string): string[] {
    if (!coerceStageObject(objId)) throw new InvalidStageObjectError(objId);
    const owners = getSetting<Record<string, string[]>>("objectOwnership");
    return owners?.[objId] ?? [];
  }

  /** Handles any initiatlization */
  public static init() {
    if (canvas?.stage) {
      bgCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerBackgroundCanvasGroup", "background");
      primaryCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerPrimaryCanvasGroup", "primary");
      fgCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerForegroundCanvasGroup", "foreground");
      textCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerTextCanvasGroup", "text");
      uiCanvasGroup = new ScreenSpaceCanvasGroup("StageManagerUICanvasGroup", "ui");

      canvas.stage.addChild(bgCanvasGroup);
      canvas.stage.addChild(primaryCanvasGroup);
      canvas.stage.addChild(fgCanvasGroup);
      canvas.stage.addChild(textCanvasGroup);
      canvas.stage.addChild(uiCanvasGroup);

      // Drag events
      canvas.stage
        .on("mousemove", onDragMove)
        .on("pointerup", onDragEnd)
        .on("pointerupoutside", onDragEnd)
        .on("pointerdown", onPointerDown)
        ;

      // Wrap the game's handle keyboard event to catch Escape
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      libWrapper.register(__MODULE_ID__, "game.keyboard._handleKeyboardEvent", function (wrapped: Function, ...args: unknown[]) {
        const event = args[0] as KeyboardEvent;

        if (event.key === "Escape" && StageManager.SelectedObjects.length) {
          StageManager.DeselectAll();
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return wrapped(...args);
        }
      });

      // Regular event listener
      document.addEventListener("keydown", onKeyDown);

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
    delete SYNCHRONIZATION_HASH[obj.id];

    if (StageManager.canDeleteStageObject(game.user?.id ?? "", obj.id)) {
      void setSetting("currentObjects", Object.values(SYNCHRONIZATION_HASH))
      SocketManager.removeStageObject(obj);
    }

    if (!obj.destroyed) obj.destroy();
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

  public static StageObjectsAtPoint(x: number, y: number): StageObject[] {
    return StageManager.StageObjects.filter(obj => obj.bounds.contains(x, y));
  }

  // #endregion Public Static Methods (13)
}

// #endregion Classes (1)

// #region Functions (4)


function onDragEnd() {
  StageManager.StageObjects.contents.forEach(item => {
    if (item.dragging) {
      item.dragging = false;
      item.synchronize = true;
    }

    if (item.resizing) {
      item.resizing = false;
      item.synchronize = true;
    }
  })

}

function onDragMove(event: PIXI.FederatedPointerEvent) {
  StageManager.StageObjects.forEach(item => {
    if (item.dragging || item.placing) {
      event.preventDefault();
      item.x = event.screenX;
      item.y = event.screenY;
    }

    if (item.resizing) {
      event.preventDefault();
      if (event.ctrlKey) {
        const desiredWidth = event.screenX - item.left;
        const desiredHeight = event.screenY - item.top;
        const ratio = Math.max(desiredWidth / item.baseWidth, desiredHeight / item.baseHeight);
        item.width = item.baseWidth * ratio;
        item.height = item.baseHeight * ratio;
      } else {
        item.width = event.screenX - item.left;
        item.height = event.screenY - item.top;
      }
    }
  })
}

function onPointerDown(e: PIXI.FederatedMouseEvent) {
  // Deselect if clicked outside
  if (game?.settings?.get("core", "leftClickRelease")) {
    StageManager.SelectedObjects.forEach(obj => {
      if (!obj.interfaceContainer.getBounds().contains(e.clientX, e.clientY)) obj.selected = false;
    });
  }
}

function synchronizeStageObjects() {
  if (StageManager.canAddStageObjects(game?.user?.id ?? "")) {
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
    if (!foundry.utils.objectsEqual({ wrap: getSetting<StageObject[]>("currentObjects") }, { wrap: Object.values(SYNCHRONIZATION_HASH) }))
      void setSetting("currentObjects", Object.values(SYNCHRONIZATION_HASH));
  }
}

// #endregion Functions (4)

// #region Variables (7)

let primaryCanvasGroup: ScreenSpaceCanvasGroup;
let bgCanvasGroup: ScreenSpaceCanvasGroup;
let fgCanvasGroup: ScreenSpaceCanvasGroup;
let textCanvasGroup: ScreenSpaceCanvasGroup;
let uiCanvasGroup: ScreenSpaceCanvasGroup;
const stageObjects = new StageObjects();
const SYNCHRONIZATION_HASH: Record<string, SerializedStageObject> = {};

// #endregion Variables (7)


function onKeyDown(e: KeyboardEvent) {
  // The escape key is caught above
  if (e.key === "Delete") {
    const objs = StageManager.StageObjects.filter(obj => obj.selected);
    for (const obj of objs) obj.destroy();
  }
}