/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { StageManager } from "./StageManager";
import { ControlButtonsHandler } from "./ControlButtonsHandler";
import { log } from "./logging";
import { SocketManager } from "./SocketManager";
//import { SerializedStageObject } from "./types";
import { /* getSetting ,*/ registerSettings } from './Settings';
import { InputManager } from './InputManager';
import { SynchronizationManager } from './SynchronizationManager';
import { coerceStageObject } from "./coercion";
import { hitTestFn } from "./lib/hitTest";

import groupBy from "./lib/groupBy";
import "./triggerHooks";

groupBy.register(Handlebars);

Handlebars.registerHelper("json", function (context) { return JSON.stringify(context); });

(window as any).StageManager = StageManager;


Hooks.once("canvasReady", () => {
  if (__DEV__) {
    (window as any).__PIXI_DEVTOOLS__ = {
      stage: canvas?.stage,
      renderer: canvas?.app?.renderer
    };
  }

  StageManager.init();
  if (game) {
    (game as any).StageManager = StageManager;
    (game as any).stageobjects = StageManager.StageObjects;
  }

  InputManager.init();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-function-type
  libWrapper.register(__MODULE_ID__, "CONFIG.Macro.documentClass.prototype.execute", function (this: Macro, wrapped: Function, scope: Record<string, any> = {}, ...args: unknown[]) {
    let shouldHydrate = false;

    if (game?.modules?.get("advanced-macros")?.active) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const specificUser = (this.getFlag as any)("advanced-macros", "runForSpecificUser");
      if (!specificUser || (specificUser && specificUser === game.user?.id))
        shouldHydrate = true;
    } else {
      shouldHydrate = true;
    }

    if (shouldHydrate && scope.stageObject)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      scope.stageObject = coerceStageObject(scope.stageObject?.id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return wrapped(scope, ...args);
  });


  log("Initialized.");
});


Hooks.on("canvasReady", () => {

  if (canvas?.app?.renderer?.events?.rootBoundary) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    libWrapper.register(__MODULE_ID__, "canvas.app.renderer.events.rootBoundary.hitTestFn", hitTestFn);
  }

  StageManager.HydrateStageObjects();

})

Hooks.on("getSceneControlButtons", (controls: SceneControl[]) => { ControlButtonsHandler.register(controls); });
Hooks.on("renderSceneControls", (controls: SceneControls) => {
  const smTools = controls.controls.find(control => control.name === "stage-manager");
  if (smTools) {
    const viewAs = smTools.tools.find(tool => tool.name === "view-as");
    if (viewAs) {
      if (StageManager.ViewingAs !== game.user) viewAs.icon = "fas fa-eye-slash";
      else viewAs.icon = "fas fa-eye";
    }
  }
});

Hooks.once("socketlib.ready", () => { SocketManager.init(); })

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", () => {
  SynchronizationManager.init();

  void loadTemplates([
    `modules/${__MODULE_ID__}/templates/editObject/trigger-item.hbs`,
    `modules/${__MODULE_ID__}/templates/triggers/macro.hbs`,
    `modules/${__MODULE_ID__}/templates/editObject/additional-arg.hbs`,
    `modules/${__MODULE_ID__}/templates/events/actor.hbs`,
    `modules/${__MODULE_ID__}/templates/viewAsUser.hbs`,
    `modules/${__MODULE_ID__}/templates/editObject/text.hbs`,
    `modules/${__MODULE_ID__}/templates/editObject/font.hbs`,
    `modules/${__MODULE_ID__}/templates/editObject/customArgument.hbs`,
    `modules/${__MODULE_ID__}/templates/textInput.hbs`,
    `modules/${__MODULE_ID__}/templates/effects/background-select.hbs`,
    `modules/${__MODULE_ID__}/templates/speakers/common.hbs`
  ])
});

Hooks.on("deactivateStageManagerControlsLayer", () => {
  StageManager.DeselectAll();
});
