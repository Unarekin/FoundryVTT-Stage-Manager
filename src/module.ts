/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { StageManager } from "./StageManager"
import { ControlButtonsHandler } from "./ControlButtonsHandler"
import { log } from "./logging";
import { SocketManager } from "./SocketManager";
import { SerializedStageObject } from "./types";

(window as any).StageManager = StageManager;


Hooks.on("canvasReady", () => {
  (window as any).__PIXI_DEVTOOLS__ = {
    stage: canvas?.stage,
    renderer: canvas?.app?.renderer
  };

  StageManager.init();
  if (game) {
    (game as any).StageManager = StageManager;
    (game as any).stageobjects = StageManager.StageObjects;
  }


  log("Initialized.");
});

Hooks.on("getSceneControlButtons", (controls: SceneControl[]) => { ControlButtonsHandler.register(controls); });
Hooks.once("socketlib.ready", () => { SocketManager.init(); })

Hooks.on("init", () => {
  if (game?.settings) {
    game.settings.register(__MODULE_ID__, "currentObjects", {
      name: "Current StageObjects",
      hint: "Serialized list of StageObjects currently present.",
      config: false,
      scope: "world",
      type: Array,
      default: [],
      requiresReload: false
    })
  }
});

Hooks.once("ready", () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const persisted = (game.settings as any).get(__MODULE_ID__, "currentObjects") as SerializedStageObject[] ?? [];
  StageManager.Synchronize(persisted);
})