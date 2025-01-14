import { TriggerAction } from "../triggeractions";
import { SerializedTrigger } from "../types";
import * as tempTriggerActions from "../triggeractions";
import { InvalidTriggerError } from "../errors";
import { log } from "../logging";

const triggerActions = Object.values(tempTriggerActions).filter(item => !!item.type);



// const triggerEvents = Object.values(triggerEvents).filter(event => !!event.type);

// export const triggerTypes = Object.values(triggerActions);

export function getTriggerActionType(action: SerializedTrigger | string): typeof TriggerAction | undefined {
  return triggerActions.find(item => item.type === (typeof action === "string" ? action : action.type));
}

export function getTriggerActionSelect(): Record<string, string> {
  return Object.fromEntries(
    triggerActions
      .sort((a, b) => game.i18n.localize(`STAGEMANAGER.TRIGGERS.ACTIONS.${a.i18nKey}`).localeCompare(game.i18n.localize(`STAGEMANAGER.TRIGGERS.ACTIONS.${b.i18nKey}`)))
      .map(action => [action.type, `STAGEMANAGER.TRIGGERS.ACTIONS.${action.i18nKey}`])
  )
}


export function setSelectedConfig(element: HTMLElement) {
  const typeSelect = element.querySelector("select#action");

  if (typeSelect instanceof HTMLSelectElement) {
    const selected = typeSelect.value;
    const config = element.querySelector(`[data-role="trigger-configs"] [data-type="${selected}"]`);
    if (config instanceof HTMLElement) {
      config.style.display = "block";
    }
    const others = element.querySelectorAll(`[data-role="trigger-configs"] [data-type]:not([data-type="${selected}"])`);
    for (const elem of others) {
      if (elem instanceof HTMLElement) elem.style.display = "none";
    }

    if (selected === "macro")
      void setMacroArgs(element);
  }
}

export function getMacros(): { uuid: string, name: string, pack: string }[] {
  const macros: { uuid: string, name: string, pack: string }[] = [];
  if (game?.macros)
    macros.push(...game.macros.map((macro: Macro) => ({ uuid: macro.uuid, name: macro.name, pack: "" })));

  if (game?.packs) {
    game.packs.forEach(pack => {
      macros.push(...pack.index.map(item => ({ uuid: item.uuid, name: item.name ?? item.uuid, pack: pack.metadata.label })));
    })
  }

  return macros;
}

export function getTriggerFromForm(form: HTMLFormElement) {
  const triggerSelect = form.querySelector("select#action");
  if (triggerSelect instanceof HTMLSelectElement) {
    const triggerType = triggerSelect.value;
    const triggerClass = getTriggerActionType(triggerType);
    if (!triggerClass) throw new InvalidTriggerError(triggerType);
    return triggerClass.fromForm(form);
  }
}

export interface EventSpec {
  value: string;
  label: string;
  category: string;
  addlArgs: { name: string, label: string }[]
}


export function getTriggerEvents(): EventSpec[] {
  return [
    {
      "value": "hoverIn",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.HOVERIN",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "hoverOut",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.HOVEROUT",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "click",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.CLICK",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "doubleClick",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.DOUBLECLICK",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "rightClick",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.RIGHTCLICK",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "combatStart",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.COMBATSTART",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.COMBAT",
      "addlArgs": [
        { name: "combat", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.COMBAT" }
      ]
    },
    {
      "value": "combatEnd",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.COMBATEND",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.COMBAT",
      "addlArgs": [
        { name: "combat", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.COMBAT" }
      ]
    },
    {
      "value": "combatTurnStart",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.COMBATTURNSTART",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.COMBAT",
      "addlArgs": [
        { name: "combat", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.COMBAT" },
        { name: "combatant", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.COMBATANT" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "combatTurnEnd",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.COMBATTURNEND",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.COMBAT",
      "addlArgs": [
        { name: "combat", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.COMBAT" },
        { name: "combatant", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.COMBATANT" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "sceneChange",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.SCENECHANGE",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "addlArgs": [
        { name: "scene", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.SCENE" }
      ]
    },
    {
      "value": "pause",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.PAUSE",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "addlArgs": []
    },
    {
      "value": "unpause",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.UNPAUSE",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "addlArgs": []
    },
    {
      "value": "userConnected",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.USERCONNECTED",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" }
      ]
    },
    {
      "value": "userDisconnected",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.USERDISCONNECTED",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" }
      ]
    },
    {
      "value": "addActiveEffect",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.ADDACTIVEEFFECT",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.ACTOR",
      "addlArgs": [
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" },
        { name: "activeEffect", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTIVEEFFECT" }
      ]
    },
    {
      "value": "removeActiveEffect",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.REMOVEACTIVEEFFECT",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.ACTOR",
      "addlArgs": [
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" },
        { name: "activeEffect", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTIVEEFFECT" }
      ]
    },
    {
      "value": "addStatusEffect",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.ADDSTATUSEFFECT",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.ACTOR",
      "addlArgs": [
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" },
        { name: "activeEffect", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTIVEEFFECT" },
        { name: "statusEffect", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.STATUSEFFECT" }
      ]
    },
    {
      "value": "selectToken",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.SELECTTOKEN",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.TOKEN",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "deselectToken",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.DESELECTTOKEN",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.TOKEN",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "targetToken",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.TARGETTOKEN",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.TOKEN",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "untargetToken",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.UNTARGETTOKEN",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.TOKEN",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "worldTimeChange",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.WORLDTIMECHANGE",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "addlArgs": [
        { name: "time", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TIME" }
      ]
    },
    {
      "value": "actorChange",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.ACTORCHANGE",
      "category": "STAGEMANAGER.TRIGGERS.CATEGORIES.ACTOR",
      "addlArgs": [
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    }
  ].map(item => ({
    ...item,
    label: game.i18n?.localize(item.label),
    category: game.i18n?.localize(item.category)
  }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export async function setMacroArgs(element: HTMLElement) {
  const eventElem = element.querySelector("#event");
  if (!(eventElem instanceof HTMLSelectElement)) return;

  log(eventElem.value);
  const selected = eventElem.value;
  const events = getTriggerEvents();
  const event = events.find(elem => elem.value === selected);

  if (!event) return;

  const container = element.querySelector(`[data-role="autoArguments"]`);
  if (!(container instanceof HTMLElement)) return;

  container.replaceChildren();

  if (Array.isArray(event.addlArgs)) {
    for (const arg of event.addlArgs) {
      const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/editObject/additional-arg.hbs`, arg)
      const elem = document.createElement("section");
      elem.innerHTML = content;
      container.appendChild(elem);
    }
  }
}