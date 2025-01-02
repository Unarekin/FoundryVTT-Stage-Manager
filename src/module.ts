/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { StageManager } from "./StageManager"
import { ControlButtonsHandler } from "./ControlButtonsHandler"
import { log } from "./logging";
import { SocketManager } from "./SocketManager";
//import { SerializedStageObject } from "./types";
import { /* getSetting ,*/ registerSettings } from './Settings';
import { InputManager } from './InputManager';
import { SynchronizationManager } from './SynchronizationManager';

(window as any).StageManager = StageManager;


Hooks.once("canvasReady", () => {
  (window as any).__PIXI_DEVTOOLS__ = {
    stage: canvas?.stage,
    renderer: canvas?.app?.renderer
  };

  StageManager.init();
  if (game) {
    (game as any).StageManager = StageManager;
    (game as any).stageobjects = StageManager.StageObjects;
  }

  InputManager.init();

  log("Initialized.");
});

Hooks.on("canvasReady", () => {
  StageManager.HydrateStageObjects();
})

Hooks.on("getSceneControlButtons", (controls: SceneControl[]) => { ControlButtonsHandler.register(controls); });
Hooks.once("socketlib.ready", () => { SocketManager.init(); })

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", () => {
  SynchronizationManager.init();
});

Hooks.on("deactivateStageManagerControlsLayer", () => {
  StageManager.DeselectAll();
});