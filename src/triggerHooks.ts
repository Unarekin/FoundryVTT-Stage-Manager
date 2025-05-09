// StageObject trigger hooks

import { coerceActor } from "./coercion";
import { StageManager } from "./StageManager";
import { ActorStageObject, StageObject } from "./stageobjects";
import { TriggerEventSignatures } from "./types";
import { CUSTOM_HOOKS } from "./hooks";

export function triggerEvent<k extends keyof TriggerEventSignatures>(event: k, arg: TriggerEventSignatures[k]) {
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
    const combatant = combat.combatants.get(prev.combatantId);
    if (combatant instanceof Combatant && combatant.actor instanceof Actor)

      triggerEvent("combatTurnEnd", { combat, actor: combatant.actor, combatant, token: combatant.token?.object ?? undefined });
  }

  if (curr.combatantId) {
    const combatant = combat.combatants.get(curr.combatantId);
    if (combatant instanceof Combatant && combatant.actor instanceof Actor)
      triggerEvent("combatTurnStart", { combat, actor: combatant.actor, combatant, token: combatant.token?.object ?? undefined });
  }
});

Hooks.on("updateScene", (scene: Scene, delta: Partial<Scene>) => {
  if (delta.active) void triggerEvent("sceneChange", { scene });
});

Hooks.on("userConnected", (user, connected) => {
  if (connected)
    triggerEvent("userConnected", { user });
  else
    triggerEvent("userDisconnected", { user });
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
        void obj.triggerEvent("addStatusEffect", { actor: effect.parent, status });
    }
  }
});

Hooks.on("deleteActiveEffect", (effect: ActiveEffect) => {
  if (effect.parent instanceof Actor) {
    const objs = ActorStageObject.GetActorObjects(effect.parent);
    for (const obj of objs) {
      void obj.triggerEvent("removeActiveEffect", { actor: effect.parent, effect });
      for (const status of effect.statuses)
        void obj.triggerEvent("removeStatusEffect", { actor: effect.parent, status });
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
          void obj.triggerEvent("removeStatusEffect", { actor: effect.parent, status });
      } else {
        void obj.triggerEvent("addActiveEffect", { actor: effect.parent, effect });
        for (const status of effect.statuses)
          void obj.triggerEvent("addStatusEffect", { actor: effect.parent, status });
      }
    }
  }
});

Hooks.on("applyTokenStatusEffect", (token: Token, status: string, applied: boolean) => {
  // triggerEvent("addStatusEffect", { actor: token.actor, effect, status: })
  if (applied)
    triggerEvent("addStatusEffect", { actor: token.actor!, status });
  else
    triggerEvent("removeStatusEffect", { actor: token.actor!, status });
})

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
  const objs: StageObject[] = ActorStageObject.GetActorObjects(actor);
  StageManager.StageObjects.forEach(obj => {
    const triggers = Object.values(obj.triggers).flat();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (triggers.some(trigger => (trigger as any).actor === actor.uuid))
      objs.push(obj);
  });

  const filtered = objs.filter((obj, i, arr) => arr.indexOf(obj) === i);

  for (const obj of filtered)
    void obj.triggerEvent("actorChange", { actor });
});

Hooks.on("pauseGame", paused => {
  if (paused)
    triggerEvent("pause", undefined);
  else
    triggerEvent("unpause", undefined);
});

Hooks.on(CUSTOM_HOOKS.ITEM_ROLLED, (actor: Actor, item: Item, rollData: Record<string, unknown>) => {
  triggerEvent("itemRoll", { actor, item, rollData });
});

// // Set up item roll hooks
// if (triggerHooks.itemRoll) {
//   const itemRoll = triggerHooks.itemRoll as Record<string, { hook: () => void }>;
//   Hooks.on("ready", () => {
//     if (itemRoll[game.system?.id ?? ""]) {
//       log("Hooking item roll event.");
//       itemRoll[game.system?.id ?? ""].hook();
//     } else {
//       log(localize("STAGEMANAGER.WARNINGS.UNABLETOHOOKROLL", { system: game.system?.id ?? typeof undefined }));
//     }
//   })
// }


// Hooks.on(CUSTOM_HOOKS.PREHOOK, (hook: string, args: unknown[]) => {
//   triggerEvent("preHook", { hook, hookArgs: args });
// });

// Hooks.on(CUSTOM_HOOKS.POSTHOOK, (hook: string, args: unknown[]) => {
//   triggerEvent("postHook", { hook, hookArgs: args });
// });