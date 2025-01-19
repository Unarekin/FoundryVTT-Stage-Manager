import { TriggerAction } from "../triggeractions";
import { FontSettings, SerializedStageObject, SerializedTrigger } from '../types';
import * as tempTriggerActions from "../triggeractions";
import { InvalidTriggerError, LocalizedError, UnknownDocumentTypeError } from "../errors";
import { log } from "../logging";
import { EditTriggerDialogV2 } from "./EditTriggerDialogV2";

const triggerActions = Object.values(tempTriggerActions).filter(item => !!item.type);

export function getTriggerActions() { return triggerActions; }


// const triggerEvents = Object.values(triggerEvents).filter(event => !!event.type);

// export const triggerTypes = Object.values(triggerActions);

export function getTriggerActionType(action: SerializedTrigger | string): typeof TriggerAction | undefined {
  return triggerActions.find(item => item.type === (typeof action === "string" ? action : action.action));
}

export function getTriggerActionSelect(): Record<string, string> {
  if (!game.i18n) return {};

  return Object.fromEntries(
    triggerActions
      .sort((a, b) => game.i18n.localize(`STAGEMANAGER.TRIGGERS.ACTIONS.${a.i18nKey}`).localeCompare(game.i18n.localize(`STAGEMANAGER.TRIGGERS.ACTIONS.${b.i18nKey}`)))
      .map(action => [action.type, `STAGEMANAGER.TRIGGERS.ACTIONS.${action.i18nKey}`])
  )
}

export function setSelectedConfig(element: HTMLElement) {

  const eventSelect = element.querySelector("select#event");
  if (eventSelect instanceof HTMLSelectElement) {
    // Hide all configs
    const all = element.querySelectorAll(`[data-role="event-configs"] [data-type],[data-role="event-configs"] [data-category]`);
    for (const elem of all) {
      if (elem instanceof HTMLElement)
        elem.style.display = "none";
    }

    const selected = eventSelect.value;

    // Event-specific configs
    const config = element.querySelector(`[data-role="event-configs"] [data-event="${selected}"]`);
    if (config instanceof HTMLElement) config.style.display = "block";

    // Event category configs
    const selectedOption = eventSelect.options[eventSelect.selectedIndex];
    const category = selectedOption.dataset.category;
    log("Selected category:", category);
    const categoryConfigs = element.querySelectorAll(`[data-role="event-configs"] [data-category="${category}"]`);
    for (const elem of categoryConfigs) {
      if (elem instanceof HTMLElement) elem.style.display = "block";
    }
  }



  const typeSelect = element.querySelector("select#action");

  if (typeSelect instanceof HTMLSelectElement) {
    const selected = typeSelect.value;
    const config = element.querySelector(`[data-role="action-configs"] [data-type="${selected}"]`);
    if (config instanceof HTMLElement) {
      config.style.display = "block";
    }
    const others = element.querySelectorAll(`[data-role="action-configs"] [data-type]:not([data-type="${selected}"])`);
    for (const elem of others) {
      if (elem instanceof HTMLElement) elem.style.display = "none";
    }

    if (selected === "macro")
      void setMacroArgs(element);
  }
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
  categoryLabel: string;
  addlArgs: { name: string, label: string }[]
}


export function getTriggerEvents(trigger?: SerializedTrigger): EventSpec[] {
  return [
    {
      "value": "hoverIn",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.HOVERIN",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "category": "mouse",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "hoverOut",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.HOVEROUT",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "category": "mouse",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "click",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.CLICK",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "category": "mouse",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "doubleClick",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.DOUBLECLICK",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "category": "mouse",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "rightClick",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.RIGHTCLICK",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MOUSE",
      "category": "mouse",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "pos", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.POS" },
        { name: "modKeys", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.MODKEYS" }
      ]
    },
    {
      "value": "combatStart",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.COMBATSTART",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.COMBAT",
      "category": "combat",
      "addlArgs": [
        { name: "combat", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.COMBAT" }
      ]
    },
    {
      "value": "combatEnd",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.COMBATEND",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.COMBAT",
      "category": "combat",
      "addlArgs": [
        { name: "combat", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.COMBAT" }
      ]
    },
    {
      "value": "combatTurnStart",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.COMBATTURNSTART",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.COMBAT",
      "category": "combat",
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
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.COMBAT",
      "category": "combat",
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
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "category": "misc",
      "addlArgs": [
        { name: "scene", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.SCENE" }
      ]
    },
    {
      "value": "pause",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.PAUSE",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "category": "misc",
      "addlArgs": []
    },
    {
      "value": "unpause",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.UNPAUSE",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "category": "misc",
      "addlArgs": []
    },
    {
      "value": "userConnected",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.USERCONNECTED",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "category": "misc",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" }
      ]
    },
    {
      "value": "userDisconnected",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.USERDISCONNECTED",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "category": "misc",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" }
      ]
    },
    {
      "value": "addActiveEffect",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.ADDACTIVEEFFECT",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.ACTOR",
      "category": "actor",
      "addlArgs": [
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" },
        { name: "activeEffect", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTIVEEFFECT" }
      ]
    },
    {
      "value": "removeActiveEffect",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.REMOVEACTIVEEFFECT",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.ACTOR",
      "category": "actor",
      "addlArgs": [
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" },
        { name: "activeEffect", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTIVEEFFECT" }
      ]
    },
    {
      "value": "addStatusEffect",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.ADDSTATUSEFFECT",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.ACTOR",
      "category": "actor",
      "addlArgs": [
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" },
        { name: "activeEffect", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTIVEEFFECT" },
        { name: "statusEffect", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.STATUSEFFECT" }
      ]
    },
    {
      "value": "selectToken",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.SELECTTOKEN",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.TOKEN",
      "category": "token",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "deselectToken",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.DESELECTTOKEN",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.TOKEN",
      "category": "token",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "targetToken",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.TARGETTOKEN",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.TOKEN",
      "category": "token",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "untargetToken",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.UNTARGETTOKEN",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.TOKEN",
      "category": "token",
      "addlArgs": [
        { name: "user", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.USER" },
        { name: "token", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TOKEN" },
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    },
    {
      "value": "worldTimeChange",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.WORLDTIMECHANGE",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.MISC",
      "category": "misc",
      "addlArgs": [
        { name: "time", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.TIME" }
      ]
    },
    {
      "value": "actorChange",
      "label": "STAGEMANAGER.TRIGGERS.EVENTS.ACTORCHANGE",
      "categoryLabel": "STAGEMANAGER.TRIGGERS.CATEGORIES.ACTOR",
      "category": "actor",
      "addlArgs": [
        { name: "actor", label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR" }
      ]
    }
  ].map(item => ({
    ...item,
    label: game.i18n?.localize(item.label) ?? "",
    categoryLabel: game.i18n?.localize(item.categoryLabel) ?? "",
    selected: trigger?.event === item.value
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

export async function addTriggerItem(element: HTMLElement) {
  const newTrigger = await (foundry.applications.api.DialogV2 ? EditTriggerDialogV2.prompt() : Promise.resolve(undefined));
  log("New trigger:", newTrigger);
  if (!newTrigger) return;

  const triggerList = element.querySelector(`[data-role="trigger-list"]`);
  if (!(triggerList instanceof HTMLElement)) throw new LocalizedError("NOTRIGGERLIST");

  const content = await renderTriggerItemRow(newTrigger);

  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.innerHTML = content;
  tr.appendChild(td);

  triggerList.appendChild(tr);
}


export async function editTriggerItem(element: HTMLElement, id: string) {
  const triggerElem = element.querySelector(`[data-role="trigger-item"][data-id="${id}"]`);
  if (!triggerElem) throw new LocalizedError("NOTRIGGERELEMENT", { id });
  const formElem = triggerElem.querySelector(`input[type="hidden"][name="triggers"]`);
  if (!(formElem instanceof HTMLInputElement)) throw new LocalizedError("NOTRIGGERELEMENT", { id });
  const serialized = formElem.value;
  if (!serialized) throw new LocalizedError("NOTRIGGERELEMENT", { id });
  const deserialized = JSON.parse(serialized) as SerializedTrigger;
  const edited = await (foundry.applications.api.DialogV2 ? EditTriggerDialogV2.prompt(deserialized) : Promise.resolve(undefined));
  log("Edited:", edited);
  if (!edited) return;

  const content = await renderTriggerItemRow(edited);
  log("Content:", content);
  triggerElem.outerHTML = content;
}

async function renderTriggerItemRow(trigger: SerializedTrigger): Promise<string> {
  const actionClass = getTriggerActionType(trigger);
  if (!actionClass) throw new InvalidTriggerError(trigger.action);
  return renderTemplate(`modules/${__MODULE_ID__}/templates/editObject/trigger-item.hbs`, {
    trigger,
    eventLabel: game.i18n?.localize(`STAGEMANAGER.TRIGGERS.EVENTS.${trigger.event.toUpperCase()}`),
    actionLabel: actionClass.getDialogLabel(trigger)
  });
}


export async function removeTriggerItem(element: HTMLElement, id: string) {
  const item = element.querySelector(`[data-role="trigger-item"][data-id="${id}"]`);
  if (!(item instanceof HTMLElement)) throw new InvalidTriggerError(id);

  const input = item.querySelector(`input[type="hidden"]`);
  if (!(input instanceof HTMLInputElement)) throw new InvalidTriggerError(id);

  const serialized = input.value;
  const deserialized = JSON.parse(serialized) as SerializedTrigger;
  if (!deserialized) throw new InvalidTriggerError(serialized);

  const title = game.i18n?.localize("STAGEMANAGER.CONFIRMREMOVETRIGGER.TITLE") ?? "";
  const content = game.i18n?.format("STAGEMANAGER.CONFIRMREMOVETRIGGER.MESSAGE", { name: getTriggerLabel(deserialized) }) ?? "";

  const confirm = await (foundry.applications.api.DialogV2 ?
    foundry.applications.api.DialogV2.confirm({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window: ({ title } as any),
      content,
      rejectClose: false
    }) :
    Dialog.confirm({
      title,
      content,
      defaultYes: false,
      rejectClose: false
    })
  );

  if (!confirm) return;
  const row = item.closest("tr");
  if (row instanceof HTMLTableRowElement) row.remove();
}

export function getTriggerLabel(trigger: SerializedTrigger): string {
  const triggerClass = getTriggerActionType(trigger.action);
  if (!triggerClass) return "";
  return triggerClass.getDialogLabel(trigger);
}

interface SectionSpec {
  pack: string;
  uuid: string;
  name: string;
  selected: boolean;
}

export function getTriggerContext(trigger?: SerializedTrigger) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    actors: getDocuments("Actor", (trigger as any)?.actor ?? ""),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    macros: getDocuments("Macro", (trigger as any)?.macro ?? ""),
  }
}

export function getFontContext(stageObject: SerializedStageObject) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unused-vars
  const fontSettings = (stageObject as any).font as FontSettings;
  return {
    fontSelect: Object.fromEntries(FontConfig.getAvailableFonts().map(font => [font, font]))
  }
}


function getDocuments(documentName: string, selected?: string): SectionSpec[] {
  const documents: SectionSpec[] = [];
  const collection = game.collections.get(documentName);
  if (!collection) throw new UnknownDocumentTypeError(documentName);

  // Add non-compendium documents
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  documents.push(...collection.map(item => ({ uuid: item.uuid, name: item.name, pack: "", selected: item.uuid === selected })));

  // Add compendium documents
  if (game?.packs) {
    game.packs.forEach(pack => {
      if (pack.documentName === documentName) {

        documents.push(...pack.index.map(item => ({ uuid: item.uuid, name: item.name ?? item.uuid, pack: pack.metadata.label, selected: item.uuid === selected })));
      }
    })
  }

  return documents;
}

export async function inputPrompt(content: string, title?: string): Promise<string | undefined> {
  if (foundry.applications.api.DialogV2) {
    const input = await foundry.applications.api.DialogV2.wait({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window: ({ title: game.i18n?.localize(title ?? "") } as any),
      content: `<p>${game.i18n?.localize(content)}</p><input type="text" name="text" id="text">`,
      rejectClose: false,
      buttons: [
        {
          label: `<i class="fas fa-check"></i> ${game.i18n?.localize("Confirm")}`,
          action: "confirm",
          default: true,
          callback: (e, button, dialog) => {
            const input = dialog.querySelector("input#text");
            if (!(input instanceof HTMLInputElement)) return Promise.resolve(undefined);
            else return Promise.resolve(input.value);
          }
        },
        {
          label: `<i class="fas fa-times"></i> ${game.i18n?.localize("Cancel")}`,
          action: "cancel"
        }
      ]
    });
    if (input === "cancel" || !input) return undefined;
    return input;
  } else {
    //empty
  }
  return Promise.resolve(undefined);
}