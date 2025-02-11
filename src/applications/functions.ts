import { TriggerAction } from "../triggeractions";
import { FontSettings, SerializedStageObject, SerializedTrigger } from '../types';
import * as tempTriggerActions from "../triggeractions";
import { InvalidTriggerError, UnknownDocumentTypeError } from "../errors";
import { log } from "../logging";
// import { EditTriggerDialogV2 } from "./EditTriggerDialogV2";
import { StageObject } from "../stageobjects";
import { localize } from "../functions";
import { serializeEffect } from "../lib/effects";
import { getTriggerEvents } from "./triggerFunctions";

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


// export function getTriggerFromForm(form: HTMLFormElement) {
//   const triggerSelect = form.querySelector("select#action");
//   if (triggerSelect instanceof HTMLSelectElement) {
//     const triggerType = triggerSelect.value;
//     const triggerClass = getTriggerActionType(triggerType);
//     if (!triggerClass) throw new InvalidTriggerError(triggerType);
//     return triggerClass.fromForm(form);
//   }
// }



export function getLayerContext(): Record<string, string> {
  return {
    primary: "STAGEMANAGER.LAYERS.PRIMARY",
    foreground: "STAGEMANAGER.LAYERS.FOREGROUND",
    background: "STAGEMANAGER.LAYERS.BACKGROUND",
    text: "STAGEMANAGER.LAYERS.TEXT"
  }
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

// export async function addTriggerItem(element: HTMLElement) {
//   const newTrigger = await (foundry.applications.api.DialogV2 ? EditTriggerDialogV2.prompt() : Promise.resolve(undefined));
//   if (!newTrigger) return;

//   const triggerList = element.querySelector(`[data-role="trigger-list"]`);
//   if (!(triggerList instanceof HTMLElement)) throw new LocalizedError("NOTRIGGERLIST");

//   const content = await renderTriggerItemRow(newTrigger);

//   const tr = document.createElement("tr");
//   const td = document.createElement("td");
//   td.innerHTML = content;
//   tr.appendChild(td);

//   triggerList.appendChild(tr);
// }


// export async function editTriggerItem(element: HTMLElement, id: string) {
//   const triggerElem = element.querySelector(`[data-role="trigger-item"][data-id="${id}"]`);
//   if (!triggerElem) throw new LocalizedError("NOTRIGGERELEMENT", { id });
//   const formElem = triggerElem.querySelector(`input[type="hidden"][name="triggers"]`);
//   if (!(formElem instanceof HTMLInputElement)) throw new LocalizedError("NOTRIGGERELEMENT", { id });
//   const serialized = formElem.value;
//   if (!serialized) throw new LocalizedError("NOTRIGGERELEMENT", { id });
//   const deserialized = JSON.parse(serialized) as SerializedTrigger;
//   const edited = await (foundry.applications.api.DialogV2 ? EditTriggerDialogV2.prompt(deserialized) : Promise.resolve(undefined));
//   log("Edited:", edited);
//   if (!edited) return;

//   const content = await renderTriggerItemRow(edited);
//   log("Content:", content);
//   triggerElem.outerHTML = content;
// }

// async function renderTriggerItemRow(trigger: SerializedTrigger): Promise<string> {
//   const actionClass = getTriggerActionType(trigger);
//   if (!actionClass) throw new InvalidTriggerError(trigger.action);
//   return renderTemplate(`modules/${__MODULE_ID__}/templates/editObject/trigger-item.hbs`, {
//     trigger,
//     eventLabel: game.i18n?.localize(`STAGEMANAGER.TRIGGERS.EVENTS.${trigger.event.toUpperCase()}`),
//     actionLabel: actionClass.getDialogLabel(trigger)
//   });
// }

export async function confirm(title: string, content: string) {

  return (foundry.applications.api.DialogV2 ?
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
  )
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

export function getScopeContext(): Record<string, string> {
  return {
    global: "STAGEMANAGER.SCOPES.GLOBAL",
    scene: "STAGEMANAGER.SCOPES.SCENE",
    user: "STAGEMANAGER.SCOPES.USER",
    temp: "STAGEMANAGER.SCOPES.TEMP"
  }
}

export function getScenesContext(obj: StageObject): { label: string, value: string, selected: boolean }[] {
  if (!game.scenes) return [];
  return game.scenes.map((scene: Scene) => ({ label: scene.name, value: scene.uuid, selected: obj.scope === "scene" && obj.scopeOwners.includes(scene.uuid) }));
}


export function getUsersContext(obj: StageObject): { label: string, value: string, selected: boolean }[] {
  if (!game.users) return [];
  return game.users.map((user: User) => ({ label: user.name, value: user.uuid, selected: obj.scope === "user" && obj.scopeOwners.includes(user.uuid) }));
}

function getDocuments(documentName: string, selected?: string): SectionSpec[] {
  if (!(game instanceof Game)) return [];
  const documents: SectionSpec[] = [];

  const collection = game.collections?.get(documentName);
  if (!collection) throw new UnknownDocumentTypeError(documentName);

  // Add non-compendium documents
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  documents.push(...collection.map(item => ({ uuid: item.uuid, name: item.name, pack: "", selected: item.uuid === selected })));

  // Add compendium documents
  if (game?.packs) {
    game.packs.forEach(pack => {
      if (pack.documentName === documentName) {


        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        documents.push(...pack.index.map(item => ({ uuid: item.uuid, name: item.name ?? item.uuid, pack: pack.metadata.label, selected: item.uuid === selected })));
      }
    })
  }

  return documents;
}

export function getEffectsContext(obj: StageObject): Record<string, string> {
  if (!Array.isArray(obj.effects)) return {};


  const serialized = obj.effects.map(effect => serializeEffect(effect)).filter(item => !!item);
  return Object.fromEntries(serialized.map(item => [item.id, `STAGEMANAGER.EDITDIALOG.EFFECTS.${item.label}`]));
}

export async function inputPrompt(content: string, title?: string): Promise<string | undefined> {
  if (foundry.applications.api.DialogV2) {

    const input = await foundry.applications.api.DialogV2.wait({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window: ({ title: game.i18n?.localize(title ?? "") } as any),
      content: `${game.i18n?.localize(content)}`,
      rejectClose: false,
      buttons: [
        {
          label: `<i class="fas fa-check"></i> ${game.i18n?.localize("Confirm")}`,
          action: "confirm",
          default: true,
          callback: (e, button, dialog) => {
            const input = dialog.querySelector("#text");
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (typeof (input as any)?.value === "string") return Promise.resolve((input as any).value as string);
            else return Promise.resolve(undefined);
          }
        },
        {
          label: `<i class="fas fa-times"></i> ${game.i18n?.localize("Cancel")}`,
          action: "cancel"
        }
      ]
    });
    if (input === "cancel" || !input || input === "confirm") return undefined;
    return input;
  } else {
    //empty
  }
  return Promise.resolve(undefined);
}

export async function selectEffectDialog(): Promise<string | undefined> {
  const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/addEffect.hbs`, {
    effects: [
      { value: "outline", label: "STAGEMANAGER.EDITDIALOG.EFFECTS.OUTLINE" },
      { value: "dropshadow", label: "STAGEMANAGER.EDITDIALOG.EFFECTS.DROPSHADOW" },
      { value: "blur", label: "STAGEMANAGER.EDITDIALOG.EFFECTS.BLUR" },
      { value: "pixelate", label: "STAGEMANAGER.EDITDIALOG.EFFECTS.PIXELATE" },
      { value: "glow", label: "STAGEMANAGER.EDITDIALOG.EFFECTS.GLOW" },
      { value: "bevel", label: "STAGEMANAGER.EDITDIALOG.EFFECTS.BEVEL" },
      { value: "chromakey", label: "STAGEMANAGER.EDITDIALOG.EFFECTS.CHROMAKEY" }
    ].sort((a, b) => localize(a.label).localeCompare(localize(b.label)))
  });
  const selection = await new Promise<string | undefined>(resolve => {
    void foundry.applications.api.DialogV2.wait({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window: ({ title: "STAGEMANAGER.EDITDIALOG.EFFECTS.ADD" } as any),
      content,
      rejectClose: false,
      actions: {
        select: (e, elem) => { resolve(elem.dataset.effect); }
      },
      buttons: [
        {
          action: "cancel",
          label: `<i class="fas fa-times"></i> ${localize("Cancel")}`
        }
      ]
    }).then(val => {
      resolve(val ?? undefined);
    });
  })
  return selection === "cancel" ? undefined : selection ?? undefined;
}

