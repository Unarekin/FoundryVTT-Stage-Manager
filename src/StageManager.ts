import { ScreenSpaceCanvasGroup } from './ScreenSpaceCanvasGroup';
import { ActorStageObject, DialogStageObject, ImageStageObject, PanelStageObject, StageObject, TextStageObject } from './stageobjects';
import { PartialWithRequired, SerializedStageObject, StageLayer } from './types';
import { coerceStageObject, coerceUser } from './coercion';
import { StageObjects } from './StageObjectCollection';
import { CannotDeserializeError, CanvasNotInitializedError, InvalidStageObjectError, InvalidUserError, PermissionDeniedError } from './errors';
import * as stageObjectTypes from "./stageobjects";
import { getGlobalObjects, getSceneObjects, getSetting, getUserObjects, setGlobalObjects, setSceneObjects, setSetting } from './Settings';
import { CUSTOM_HOOKS } from './hooks';
import { log, logError, logInfo } from './logging';
import { ActorStageObjectApplication, DialogStageObjectApplication, ImageStageObjectApplication, PanelStageObjectApplication, StageObjectApplication, TextStageObjectApplication } from './applications';
import { SocketManager } from './SocketManager';

const ApplicationHash: Record<string, typeof StageObjectApplication> = {
  "image": ImageStageObjectApplication as typeof StageObjectApplication,
  "actor": ActorStageObjectApplication as unknown as typeof StageObjectApplication,
  "text": TextStageObjectApplication as unknown as typeof StageObjectApplication,
  "panel": PanelStageObjectApplication as unknown as typeof StageObjectApplication,
  dialog: DialogStageObjectApplication as unknown as typeof StageObjectApplication
}

const OpenApplications = new WeakMap<StageObject, StageObjectApplication>();

// #region Classes (1)

/**
 * Core class for Stage Manager
 */
export class StageManager {
  // #region Public Static Getters And Setters (10)

  public static get HighlightedObjects(): StageObject[] { return StageManager.StageObjects.filter(obj => obj.highlighted); }

  public static get ScreenBounds(): { left: number, right: number, top: number, bottom: number, width: number, height: number } {
    return {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight
    }
  }

  public static get SelectedObjects(): StageObject[] { return StageManager.StageObjects.filter(obj => obj.selected); }

  public static get StageObjects() { return stageObjects; }

  public static get VisualBounds(): { left: number, right: number, top: number, bottom: number, width: number, height: number } {
    const left = $("#ui-left").position().left + ($("#ui-left").width() ?? 0);
    const right = $("#ui-right").position().left;
    const top = $("#ui-top").position().top + ($("#ui-top").height() ?? 0);
    const bottom = $("#ui-bottom").position().top;

    return {
      left, right, top, bottom,
      width: right - left,
      height: bottom - top
    }
  }

  public static ShowVisualBounds() {
    StageManager.HideVisualBounds();
    const bounds = new PIXI.Graphics();
    bounds.eventMode = "none";
    bounds.name = "visual-bounds";

    bounds.clear();
    bounds.lineStyle({ width: 2, color: CONFIG.Canvas.dispositionColors.HOSTILE, join: PIXI.LINE_JOIN.MITER })
      .drawShape(new PIXI.Rectangle(
        StageManager.VisualBounds.left,
        StageManager.VisualBounds.top,
        StageManager.VisualBounds.width,
        StageManager.VisualBounds.height
      ));

    StageManager.uiCanvasGroup.addChild(bounds);
    bounds.zIndex = 5000;

  }

  public static HideVisualBounds() {
    const children = StageManager.uiCanvasGroup.children.filter(child => child.name === "visual-bounds");
    for (const child of children) child.destroy();
  }

  public static getCanvasGroup(layer: StageLayer): ScreenSpaceCanvasGroup | undefined {
    return [
      this.backgroundCanvasGroup,
      this.foregroundCanvasGroup,
      this.primaryCanvasGroup,
      this.textCanvasGroup,
      this.uiCanvasGroup
    ].find(item => item.layer === layer);
  }

  public static get backgroundCanvasGroup() { return bgCanvasGroup; }

  public static get foregroundCanvasGroup() { return fgCanvasGroup; }

  public static get primaryCanvasGroup() { return primaryCanvasGroup; }

  public static get textCanvasGroup() { return textCanvasGroup; }

  public static get uiCanvasGroup() { return uiCanvasGroup; }

  // #endregion Public Static Getters And Setters (10)

  // #region Public Static Methods (16)

  public static DeselectAll() {
    StageManager.StageObjects.forEach(child => child.selected = false)
  }

  public static ScaleStageObjects() {
    StageManager.StageObjects.forEach(item => { item.scaleToScreen(); });
  }

  public static StageObjectsAtPoint(x: number, y: number): StageObject[] {
    return StageManager.StageObjects.filter(obj => obj.bounds.contains(x, y));
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
  public static addImage(path: string, x?: number, y?: number, name?: string, layer: StageLayer = "primary"): ImageStageObject | undefined {
    try {
      if (!StageManager.canAddStageObjects(game.user?.id ?? "")) throw new PermissionDeniedError();
      const obj = new ImageStageObject(path, name);
      obj.x = typeof x === "number" ? x : window.innerWidth / 2;
      obj.y = typeof y === "number" ? y : window.innerHeight / 2;

      StageManager.addStageObject(obj, layer);
      return obj;
    } catch (err) {
      logError(err as Error);
    }
  }

  public static addDialog(text: string, background: string, vertical: number, horizontal: number, style?: PIXI.HTMLTextStyle, layer?: StageLayer): DialogStageObject | undefined
  public static addDialog(text: string, background: string, left: number, right: number, top: number, bottom: number, style?: PIXI.HTMLTextStyle, layer?: StageLayer): DialogStageObject | undefined
  public static addDialog(text: string, background: string, ...args: (number | PIXI.HTMLTextStyle | StageLayer)[]): DialogStageObject | undefined {
    try {
      const left = args[0] as number;
      const right = (args.length >= 4 ? args[1] : args[0]) as number;
      const top = (args.length >= 4 ? args[2] : args[1]) as number;
      const bottom = (args.length >= 4 ? args[3] : args[1]) as number;
      const style = (args[args.length - 1] instanceof PIXI.HTMLTextStyle ? args[args.length - 1] : args[args.length - 2] instanceof PIXI.HTMLTextStyle ? args[args.length - 2] : PIXI.HTMLTextStyle.defaultStyle) as PIXI.HTMLTextStyle;
      const layer = typeof args[args.length - 1] === "string" ? args[args.length - 1] as StageLayer : "primary"

      const obj = new DialogStageObject(text, background, left, right, top, bottom, style);
      StageManager.addStageObject(obj, layer);
      return obj;
    } catch (err) {
      logError(err as Error);
    }
  }

  public static addPanel(path: string, left: number, right: number, top: number, bottom: number, layer?: StageLayer): PanelStageObject | undefined
  public static addPanel(path: string, horizontal: number, vertical: number, layer?: StageLayer): PanelStageObject | undefined
  public static addPanel(path: string, ...args: (number | StageLayer)[]): PanelStageObject | undefined {
    try {
      const left = args[0] as number;
      const right = ((args.length === 2 || args.length === 3) ? args[0] : args[1]) as number;
      const top = ((args.length === 2 || args.length === 3) ? args[1] : args[2]) as number;
      const bottom = ((args.length === 2 || args.length === 3) ? args[1] : args[3]) as number;

      const layer = (args.length === 5 ? args[4] : args.length === 3 ? args[2] : "primary") as StageLayer;

      const panel = new PanelStageObject(path, left, right, top, bottom);
      StageManager.addStageObject(panel, layer);
      return panel;
    } catch (err) {
      logError(err as Error);
    }
  }

  public static addText(text: string, style?: PIXI.HTMLTextStyle, x?: number, y?: number, name?: string, layer: StageLayer = "text"): TextStageObject | undefined {
    try {
      if (!StageManager.canAddStageObjects(game.user?.id ?? "")) throw new PermissionDeniedError();
      const obj = new TextStageObject(text, style);
      obj.x = typeof x === "number" ? x : window.innerWidth / 2;
      obj.y = typeof y === "number" ? y : window.innerHeight / 2;
      StageManager.addStageObject(obj, layer);
      return obj;
    } catch (err) {
      logError(err as Error);
    }
  }

  public static addActor(actor: Actor, x?: number, y?: number, layer: StageLayer = "primary"): ActorStageObject | undefined {
    try {
      if (!StageManager.canAddStageObjects(game.user?.id ?? "")) throw new PermissionDeniedError();
      const obj = new ActorStageObject(actor);
      obj.x = typeof x === "number" ? x : window.innerWidth / 2;
      obj.y = typeof y === "number" ? y : window.innerHeight / 2;
      StageManager.addStageObject(obj, layer);
      return obj;
    } catch (err) {
      logError(err as Error);
    }
  }

  public static async CreateStageObject<t extends StageObject = StageObject>(serialized: PartialWithRequired<SerializedStageObject, "type">): Promise<t | undefined> {
    if (!ApplicationHash[serialized.type]) throw new InvalidStageObjectError(serialized.type);

    const obj = StageManager.deserialize(serialized as SerializedStageObject);
    if (!(obj instanceof StageObject)) throw new InvalidStageObjectError(serialized.type);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const app = (new (ApplicationHash[serialized.type] as any)(obj) as StageObjectApplication);
    void app.render(true);
    return app.closed
      .then(data => {
        if (data) return StageManager.deserialize(data) as t;
      })
  }

  public static async EditStageObject(id: string): Promise<SerializedStageObject | undefined>
  public static async EditStageObject(name: string): Promise<SerializedStageObject | undefined>
  public static async EditStageObject(stageObject: StageObject): Promise<SerializedStageObject | undefined>
  public static async EditStageObject(arg: unknown): Promise<SerializedStageObject | undefined> {
    const obj = coerceStageObject(arg);
    if (!(obj instanceof StageObject)) throw new InvalidStageObjectError(arg);
    if (OpenApplications.has(obj)) {
      const app = OpenApplications.get(obj);
      if (!app) throw new InvalidStageObjectError(arg);
      app.bringToFront();
    } else {
      return new Promise<SerializedStageObject | undefined>((resolve, reject) => {
        try {
          const appClass = ApplicationHash[obj.type];
          if (!appClass) throw new InvalidStageObjectError(obj.type);

          const layer = obj.layer;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          const app = new (appClass as any)(obj, { layer: obj.layer ?? "primary" }) as StageObjectApplication;
          OpenApplications.set(obj, app);
          app.render(true).catch(reject);
          app.closed
            .then(data => {
              if (data?.layer && StageManager.layers[data.layer]) StageManager.layers[data.layer].addChild(obj.displayObject);
              else if (layer && StageManager.layers[layer]) StageManager.layers[layer].addChild(obj.displayObject);
              OpenApplications.delete(obj);
              resolve(data);
            })
            .catch((err: Error) => {
              logError(err);
              reject(err);
              if (layer && StageManager.layers[layer]) StageManager.layers[layer].addChild(obj.displayObject);
            })
        } catch (err) {
          OpenApplications.delete(obj);
          reject(err as Error);
        }
      });
    }
  }

  public static HydrateStageObjects(user?: User) {
    if (!canvas?.scene) throw new CanvasNotInitializedError();
    if (!game.user) throw new InvalidUserError(game.user);

    if (user && !user.canUserModify(game.user, "update")) throw new PermissionDeniedError();

    const objects = [
      ...getGlobalObjects(),
      ...getSceneObjects(canvas.scene),
      ...getUserObjects(user ?? game.user)
    ];


    const objIds = objects.map(obj => obj.id);
    const toRemove = StageManager.StageObjects.filter(obj => !objIds.includes(obj.id));
    for (const obj of toRemove)
      obj.destroy();

    for (const obj of objects) {
      if (!StageManager.StageObjects.has(obj.id)) {
        const deserialized = StageManager.deserialize(obj);
        if (!deserialized) throw new CannotDeserializeError(obj);
        StageManager.StageObjects.set(deserialized.id, deserialized);
        StageManager.setStageObjectLayer(deserialized, obj.layer);
        deserialized.dirty = false;
      }
    }
  }

  public static async PersistStageObjects() {
    try {
      if (!canvas?.scene) throw new CanvasNotInitializedError();
      if (!(game.user instanceof User)) throw new InvalidUserError(game.user);

      const promises: Promise<any>[] = [];

      // Global
      if (game.user.can("SETTINGS_MODIFY"))
        promises.push(setGlobalObjects(StageManager.StageObjects.global));

      // Scene
      if (canvas.scene.canUserModify(game.user, "update"))
        promises.push(setSceneObjects(canvas.scene, StageManager.StageObjects.scene));

      // Users
      for (const user of game.users ?? []) {
        promises.push(SocketManager.persistUserObjects((user as User).id));
      }

      await Promise.all(promises);
    } catch (err) {
      logError(err as Error);
    }
  }

  /**
   * Adds a set of user IDs to the list of owners for a given {@link StageObject}
   * @param {string} objId - ID of the {@link StageObject}
   * @param {string[]} owners 
   */
  public static async addOwners(objId: string, owners: string[]): Promise<string[] | undefined> {
    try {
      if (!game.user) throw new PermissionDeniedError();
      if (!StageManager.canModifyStageObject(game.user.id, objId)) throw new PermissionDeniedError();
      if (!coerceStageObject(objId)) throw new InvalidStageObjectError(objId);
      const current = StageManager.getOwners(objId);
      const setting = getSetting<object>("objectOwnership") ?? {};

      await setSetting("objectOwnership", foundry.utils.mergeObject(
        setting,
        {
          [objId]: [
            ...current,
            ...owners
          ]
        }
      ));
      return StageManager.getOwners(objId);
    } catch (err) {
      if (err instanceof Error) {
        logError(err);
      }
    }
  }

  /**
   * Add an existing {@link StageObject} to the stage.
   * @param {StageObject} stageObject - {@link StageObject} to be added.
   * @param {StageLayer} layer - {@link StageLayer} to which to add the object.
   */
  public static addStageObject(stageObject: StageObject, layer: StageLayer = "primary"): StageObject | undefined {
    try {
      if (!(stageObject instanceof StageObject)) throw new InvalidStageObjectError(stageObject);
      if (!StageManager.canAddStageObjects(game.user?.id ?? "")) throw new PermissionDeniedError();
      StageManager.StageObjects.set(stageObject.id, stageObject);
      StageManager.setStageObjectLayer(stageObject, layer);
      return stageObject;
    } catch (err) {
      logError(err as Error);
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return newType.deserialize(serialized as any);
    } catch (err) {
      logError(err as Error);
    }
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

  public static layers: Record<string, ScreenSpaceCanvasGroup> = {};

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

      // Insert BT canvas group here, if it's available
      if (game?.modules?.get("battle-transitions")?.active) {
        logInfo("Battle Transitions active, checking for canvas group...");
        for (const obj of canvas.stage.children) {
          if (obj.name === "BattleTransitions") {
            logInfo("Found BattleTransitions canvas group, reordering.");
            canvas.stage.addChild(obj);
          }
        }
      }

      canvas.stage.addChild(fgCanvasGroup);
      canvas.stage.addChild(textCanvasGroup);
      canvas.stage.addChild(uiCanvasGroup);

      const layers = {
        background: bgCanvasGroup,
        primary: primaryCanvasGroup,
        foreground: fgCanvasGroup,
        text: textCanvasGroup,
        ui: uiCanvasGroup,

        bg: bgCanvasGroup,
        fg: bgCanvasGroup
      };

      StageManager.layers = layers;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (canvas.stage as any).stagemanager = layers;
      if (canvas.app?.renderer) canvas.app.renderer.addListener("prerender", () => { sizeObjectInterfaceContainers(); });

      StageManager.ViewingAs = game.user as User;
    }
    const menuContainer = document.createElement("section");
    menuContainer.id = "sm-menu-container";
    menuContainer.style.position = "absolute";
    menuContainer.style.pointerEvents = "none";
    menuContainer.style.top = "0";
    menuContainer.style.left = "0";
    menuContainer.style.width = "100%";
    menuContainer.style.height = "100%";
    document.body.appendChild(menuContainer);

    // Sizing hooks
    Hooks.on("collapseSidebar", () => {
      StageManager.ScaleStageObjects();
    });

    window.addEventListener("resize", () => {
      StageManager.ScaleStageObjects();
    });

    Hooks.on(CUSTOM_HOOKS.SYNC_END, () => {
      void StageManager.PersistStageObjects();
    });

    Hooks.on(CUSTOM_HOOKS.REMOTE_ADDED, (item: SerializedStageObject) => {
      const deserialized = StageManager.deserialize(item);
      if (!deserialized) throw new CannotDeserializeError(item.type);

      StageManager.StageObjects.set(deserialized.id, deserialized);
      StageManager.setStageObjectLayer(deserialized, item.layer);
      deserialized.dirty = false;
    });

    Hooks.on("collapseSidebar", () => {
      if (StageManager.uiCanvasGroup.children.some(child => child.name === "visual-bounds")) {
        StageManager.HideVisualBounds();
        StageManager.ShowVisualBounds();
      }

    });

    Hooks.on(CUSTOM_HOOKS.REMOTE_REMOVED, (id: string) => {
      const obj = StageManager.StageObjects.get(id);
      if (!obj) throw new InvalidStageObjectError(id);
      obj.destroy();
    });
  }

  /**
   * Removes a {@link StageObject} from the stage, if present.
   * @param {string | StageObject} arg - The id or name of the {@link StageObject} to remove.
   * @returns {boolean}
   */
  public static removeStageObject(arg: unknown): boolean {
    const obj = coerceStageObject(arg);
    if (!obj) throw new InvalidStageObjectError(arg);

    if (!obj.destroyed && !StageManager.canDeleteStageObject(game.user?.id ?? "", obj.id)) throw new PermissionDeniedError();
    if (!obj.destroyed) obj.destroy();
    return StageManager.StageObjects.delete(obj.id);
  }

  /**
   * Overrides the list of user IDs that are considered to have ownership over a given {@link StageObject}
   * @param {string} objId - id of the {@link StageObject}
   * @param {string[]} owners 
   */
  public static async setOwners(objId: string, owners: string[]) {
    try {
      if (!game.user) throw new PermissionDeniedError();
      if (!StageManager.canModifyStageObject(game.user.id, objId)) throw new PermissionDeniedError();

      if (!coerceStageObject(objId)) throw new InvalidStageObjectError(objId);
      await setSetting("objectOwnership", {
        [objId]: owners
      });
    } catch (err) {
      if (err instanceof Error) {
        logError(err);
      }
    }
  }

  public static ViewingAs: User | undefined = undefined;

  public static ViewStageAsUser(user: User) {
    log("Viewing as:", user);
    if (!(user instanceof User)) throw new InvalidUserError(user);
    if (!(game.user instanceof User)) throw new InvalidUserError(game.user);

    if (!user.canUserModify(game.user, "update")) throw new PermissionDeniedError();

    StageManager.ViewingAs = user;
    StageManager.HydrateStageObjects(user);
  }

  public static setStageObjectLayer(stageObject: StageObject, layer: StageLayer) {
    if (stageObject.layer !== layer) {
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
  }

  // #endregion Public Static Methods (16)
}

// #endregion Classes (1)

// #region Functions (1)

function sizeObjectInterfaceContainers() {
  StageManager.StageObjects.forEach(item => {
    item.sizeInterfaceContainer();
  });
}

// #endregion Functions (1)

// #region Variables (6)

let primaryCanvasGroup: ScreenSpaceCanvasGroup;
let bgCanvasGroup: ScreenSpaceCanvasGroup;
let fgCanvasGroup: ScreenSpaceCanvasGroup;
let textCanvasGroup: ScreenSpaceCanvasGroup;
let uiCanvasGroup: ScreenSpaceCanvasGroup;
const stageObjects = new StageObjects();

// #endregion Variables (6)
