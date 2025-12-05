import { log } from "./logging";
import { SocketManager } from "./SocketManager";
import { StageObject } from "./StageObjects";
import { LocalizedError } from "./errors";
import { SerializedStageObject, StageObjectType, DeepPartial, StageLayer } from "types";
import { ScreenSpaceCanvasGroup } from "ScreenSpaceCanvasGroup";
import { StageObjectCollection } from "StageObjectCollection"

export class StageManager {
  public readonly version = __MODULE_VERSION__;
  public readonly sockets = new SocketManager();
  public readonly objectClasses: Record<StageObjectType, typeof StageObject> = {};

  public readonly baseObjectClass: typeof StageObject = StageObject;

  public readonly stageObjects = new StageObjectCollection();

  public readonly layers: Record<StageLayer, ScreenSpaceCanvasGroup> = {
    foreground: new ScreenSpaceCanvasGroup(),
    background: new ScreenSpaceCanvasGroup()
  };

  private canvasReady() {
    if (!canvas) return;

    // Make sure stage layers are configured
    if (!canvas.stageLayers) canvas.stageLayers = {};
    canvas.stageLayers.foreground ??= this.layers.foreground;
    canvas.stageLayers.background ??= this.layers.background;


  }

  public registerStageObject(name: StageObjectType, objectClass: typeof StageObject) {
    if (this.objectClasses[name]) throw new LocalizedError("OBJECTALREADYREGISTERED", { type: name });

    this.objectClasses[name] = objectClass;
    Hooks.callAll(`${__MODULE_ID__}.stageObjectRegistered`, name, objectClass);
  }

  public unregisterStageObject(name: StageObjectType) {
    const objClass = this.objectClasses[name];
    delete this.objectClasses[name];
    if (objClass)
      Hooks.callAll(`${__MODULE_ID__}.stageObjectUnregistered`, objClass);
  }

  public add<t extends StageObject = StageObject>(objectType: StageObjectType, serialized: DeepPartial<SerializedStageObject>): t {
    const objClass = this.objectClasses[objectType] as (typeof StageObject | undefined);
    if (!objClass) throw new LocalizedError("OBJECTTYPENOTREGISTERED", { type: objectType });
    return objClass.deserialize(serialized) as t;
  }

  public constructor() {

    if (canvas)
      this.canvasReady();

    Hooks.on("canvasReady", () => { this.canvasReady(); });

    Hooks.callAll(`${__MODULE_ID__}.initialize`, this);
    log("Initialized");
  }
}

Hooks.once("canvasReady", () => {
  if (game)
    game.StageManager = new StageManager();
})