/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { StageManager } from "./StageManager"
import { ControlButtonsHandler } from "./ControlButtonsHandler"
import { log } from "./logging";
import { SocketManager } from "./SocketManager";

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

Hooks.on("ready", () => {
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
})