/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { StageManager } from "./StageManager";
import { ControlButtonsHandler } from "./ControlButtonsHandler";
import { log } from "./logging";
import { SocketManager } from "./SocketManager";
//import { SerializedStageObject } from "./types";
import { /* getSetting ,*/ registerSettings } from './Settings';
import { InputManager } from './InputManager';
import { SynchronizationManager } from './SynchronizationManager';
import { coerceActor, coerceStageObject } from "./coercion";
import { TriggerEventSignatures } from "./types";
import { ActorStageObject } from "./stageobjects";
import { hitTestFn } from "./lib/hitTest"

import groupBy from "./lib/groupBy";

groupBy.register(Handlebars);

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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const specificUser = (this.getFlag as any)("advanced-macros", "runForSpecificUser");
    if (!specificUser || (specificUser && specificUser === game.user?.id))
      shouldHydrate = true;

    if (shouldHydrate && scope.stageObject)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      scope.stageObject = coerceStageObject(scope.stageObject?.id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return wrapped(scope, ...args);
  });

  if (canvas?.app?.renderer?.events?.rootBoundary) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    libWrapper.register(__MODULE_ID__, "canvas.app.renderer.events.rootBoundary.hitTestFn", hitTestFn);
  }

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

  void loadTemplates([
    `modules/${__MODULE_ID__}/templates/editObject/trigger-item.hbs`,
    `modules/${__MODULE_ID__}/templates/triggers/macro.hbs`,
    `modules/${__MODULE_ID__}/templates/editObject/additional-arg.hbs`
  ])
});

Hooks.on("deactivateStageManagerControlsLayer", () => {
  StageManager.DeselectAll();
});

// StageObject trigger hooks

function triggerEvent<k extends keyof TriggerEventSignatures>(event: k, arg: TriggerEventSignatures[k]) {
  StageManager.StageObjects.forEach(obj => void obj.triggerEvent(event, arg));
}

Hooks.on("combatRound", combat => {
  triggerEvent("combatRound", { combat });
});

Hooks.on("combatStart", combat => {
  triggerEvent("combatStart", { combat });
});

Hooks.on("deleteCombat", (combat: Combat) => {
  if (combat.started) triggerEvent("combatEnd", { combat });
});

Hooks.on("updateCombat", (combat: Combat, delta: Partial<Combat>) => {
  if (typeof delta.round !== "undefined")
    triggerEvent("combatRound", { combat });
});

Hooks.on("combatTurnChange", (combat: Combat, prev: Combat.HistoryData, curr: Combat.HistoryData) => {
  if (prev.combatantId) {
    const actor = coerceActor(prev.combatantId);
    if (actor instanceof Actor)
      triggerEvent("combatTurnEnd", { combat, actor });
  }

  if (curr.combatantId) {
    const actor = coerceActor(curr.combatantId);
    if (actor instanceof Actor)
      triggerEvent("combatTurnStart", { combat, actor });
  }
});

Hooks.on("updateScene", (scene: Scene, delta: Partial<Scene>) => {
  if (delta.active) void triggerEvent("sceneChange", { scene });
});

Hooks.on("userConnected", user => {
  triggerEvent("userConnected", { user });
});

// Hooks.on("userDisconnected", user => {
//   triggerEvent("userDisconnected", { user });
// })

// createActiveEffect
Hooks.on("createActiveEffect", (effect: ActiveEffect) => {
  if (effect.parent instanceof Actor && effect.active) {
    const objs = ActorStageObject.GetActorObjects(effect.parent);
    for (const obj of objs) {
      void obj.triggerEvent("addActiveEffect", { actor: effect.parent, effect });
      for (const status of effect.statuses)
        void obj.triggerEvent("addStatusEffect", { actor: effect.parent, effect, status });
    }
  }
});

Hooks.on("deleteActiveEffect", (effect: ActiveEffect) => {
  if (effect.parent instanceof Actor) {
    const objs = ActorStageObject.GetActorObjects(effect.parent);
    for (const obj of objs) {
      void obj.triggerEvent("removeActiveEffect", { actor: effect.parent, effect });
      for (const status of effect.statuses)
        void obj.triggerEvent("removeStatusEffect", { actor: effect.parent, effect, status });
    }
  }
});

Hooks.on("updateActiveEffect", (effect: ActiveEffect, delta: Partial<ActiveEffect>) => {
  if (effect.parent instanceof Actor && typeof delta.disabled !== "undefined") {
    const objs = ActorStageObject.GetActorObjects(effect.parent);
    for (const obj of objs) {
      if (delta.disabled) {
        void obj.triggerEvent("removeActiveEffect", { actor: effect.parent, effect });
        for (const status of effect.statuses)
          void obj.triggerEvent("removeStatusEffect", { actor: effect.parent, effect, status });
      } else {
        void obj.triggerEvent("addActiveEffect", { actor: effect.parent, effect });
        for (const status of effect.statuses)
          void obj.triggerEvent("addStatusEffect", { actor: effect.parent, effect, status });
      }
    }
  }
});

Hooks.on("controlToken", (token: Token, controlled: boolean) => {
  const actor = coerceActor(token);
  if (actor instanceof Actor) {
    if (controlled)
      triggerEvent("selectToken", { token, actor });
    else
      triggerEvent("deselectToken", { token, actor });
  }
});

Hooks.on("targetToken", (user: User, token: Token, targeted) => {
  const actor = coerceActor(token);
  if (actor instanceof Actor) {
    if (targeted)
      triggerEvent("targetToken", { user, token, actor });
    else
      triggerEvent("untargetToken", { actor, token, user });
  }
});

Hooks.on("updateWorldTime", time => {
  triggerEvent("worldTimeChange", { time });
});

Hooks.on("updateActor", (actor: Actor) => {
  const objs = ActorStageObject.GetActorObjects(actor);
  for (const obj of objs)
    void obj.triggerEvent("actorChanged", { actor });
});