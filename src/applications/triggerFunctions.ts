import { InvalidTriggerError, LocalizedError } from "../errors";
import { localize } from "../functions";
import * as tempTriggerActions from "../triggeractions";
import { TriggerAction } from "../triggeractions";
import { SerializedTrigger } from "../types";
import { confirm } from "./functions";
import triggerEvents from "./triggerEvents.json";

export interface EventSpec {
  addlArgs: { name: string, label: string }[]
  category: string;
  categoryLabel: string;
  label: string;
  value: string;
}

function getTriggerActions() { return triggerActions; }

function getTriggerLabel(trigger: SerializedTrigger): string {
  const triggerClass = getTriggerActionType(trigger.action);
  if (!triggerClass) return "";
  return triggerClass.getDialogLabel(trigger);
}

async function injectTriggerForm(parent: HTMLElement, trigger?: SerializedTrigger) {
  const section = parent.querySelector(`[data-role="trigger-config"]`);
  if (!(section instanceof HTMLElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  section.innerHTML = "";
  const deleteButton = parent.querySelector(`button[data-action="deleteTrigger"]`);
  if (deleteButton instanceof HTMLButtonElement) deleteButton.setAttribute("disabled", "disabled");

  const context = {
    triggerActionSelect: getTriggerActionSelect(),
    triggerEventSelect: getTriggerEvents(trigger),
    trigger
  };

  const triggerActions = getTriggerActions();
  for (const action of triggerActions)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    foundry.utils.mergeObject(context, action.prepareContext(trigger as any));

  const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/edit-trigger.hbs`, context);
  section.innerHTML = content;
  if (deleteButton instanceof HTMLButtonElement) deleteButton.removeAttribute("disabled");

  setEventListeners(parent);
  setSelectedConfig(parent);
}


function selectedTrigger(parent: HTMLElement): SerializedTrigger | undefined {
  const option = selectedTriggerOption(parent);
  if (!(option instanceof HTMLOptionElement)) return;
  if (!option.dataset.serialized) return;

  return JSON.parse(option.dataset.serialized) as SerializedTrigger;
}

function selectedTriggerOption(parent: HTMLElement): HTMLOptionElement | undefined {
  const selectList = parent.querySelector(`select[name="triggerList"]`)
  if (!(selectList instanceof HTMLSelectElement)) return;
  const option = selectList.options[selectList.selectedIndex];
  return option;
}

async function setMacroArgs(parent: HTMLElement) {
  const eventElem = parent.querySelector("#event");
  if (!(eventElem instanceof HTMLSelectElement)) return;

  const selected = eventElem.value;
  const events = getTriggerEvents();
  const event = events.find(elem => elem.value === selected);

  if (!event) return;

  const container = parent.querySelector(`[data-role="autoArguments"]`);
  if (!(container instanceof HTMLElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  container.replaceChildren();
  if (Array.isArray(event.addlArgs)) {
    for (const arg of event.addlArgs) {
      const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/editObject/additional-arg.hbs`, arg);
      const elem = document.createElement("section");
      elem.innerHTML = content;
      container.appendChild(elem);
    }
  }
}

function setSelectedConfig(parent: HTMLElement) {
  const eventSelect = parent.querySelector(`select[name="trigger.event"]`);
  if (!(eventSelect instanceof HTMLSelectElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  const all = parent.querySelectorAll(`[data-role="event-configs"] [data-type], [data-role="event-configs"] [data-category]`)
  for (const elem of all) {
    if (elem instanceof HTMLElement) elem.style.display = "none";
  }

  const selectedEvent = eventSelect.value;

  // Event-specific configurations
  const eventConfig = parent.querySelector(`[data-role="event-configs"] [data-event="${selectedEvent}"]`);
  if (eventConfig instanceof HTMLElement) eventConfig.style.display = "block";

  // Category-specific configurations
  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const category = selectedOption.dataset.category;
  const categoryConfigs = parent.querySelectorAll(`[data-role="event-configs"] [data-category="${category}"]`);
  for (const elem of categoryConfigs) {
    if (elem instanceof HTMLElement) elem.style.display = "block";
  }

  const typeSelect = parent.querySelector(`select[name="trigger.action"]`);
  if (!(typeSelect instanceof HTMLSelectElement)) throw new LocalizedError("NOTRIGGERELEMENT");


  const selectedAction = typeSelect.value;
  const actionConfig = parent.querySelector(`[data-role="action-configs"] [data-type="${selectedAction}"]`);
  if (actionConfig instanceof HTMLElement) actionConfig.style.display = "block";

  const others = parent.querySelectorAll(`[data-role="action-configs"] [data-type]:not([data-type="${selectedAction}"])`);
  for (const elem of others) {
    if (elem instanceof HTMLElement) elem.style.display = "none";
  }

  if (selectedAction === "macro")
    void setMacroArgs(parent);
}



export function parseTriggerFormData(data: Record<string, unknown>): SerializedTrigger | undefined {
  if (!data.trigger) return;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const triggerClass = getTriggerActionType((data.trigger as any).action as string);
  if (!triggerClass) return

  return triggerClass.fromFormData(data.trigger as Record<string, unknown>);
}

export function setTriggerOption(parent: HTMLElement, trigger: SerializedTrigger) {
  const select = parent.querySelector(`select[name="triggerList"]`)
  if (!(select instanceof HTMLSelectElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  const triggerClass = getTriggerActionType(trigger);
  if (!triggerClass) throw new InvalidTriggerError(trigger.event);


  // const option = select.querySelector(`option[value="${trigger.id}]`);
  const option = parent.querySelector(`select[name="triggerList"] option[value="${trigger.id}"]`);
  if (option instanceof HTMLOptionElement) {
    option.dataset.event = trigger.event;
    option.dataset.serialized = JSON.stringify(trigger);
    option.value = trigger.id;
    option.innerText = triggerClass.getDialogLabel(trigger);
    addTriggerOptionToGroup(parent, option);
  } else {
    const newOption = document.createElement("option");
    newOption.value = trigger.id;
    newOption.dataset.event = trigger.event;
    newOption.dataset.serialized = JSON.stringify(trigger);
    newOption.innerText = triggerClass.getDialogLabel(trigger);

    addTriggerOptionToGroup(parent, newOption);
  }
}

function addTriggerOptionToGroup(parent: HTMLElement, option: HTMLOptionElement) {
  const select = parent.querySelector(`select[name="triggerList"]`)
  if (!(select instanceof HTMLSelectElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  const trigger = JSON.parse(option.dataset.serialized ?? "") as SerializedTrigger;
  if (!trigger) throw new InvalidTriggerError(typeof trigger);

  const event = triggerEvents.find(item => item.value === trigger.event);
  if (!event) throw new InvalidTriggerError(trigger.event);

  const optGroup = parent.querySelector(`select[name="triggerList"] optgroup[data-category="${trigger.event}"]`);
  if (!(optGroup instanceof HTMLOptGroupElement)) {
    const group = document.createElement("optgroup");
    group.dataset.category = trigger.event;
    group.label = localize(event.label);
    group.appendChild(option);
    select.appendChild(group);
  } else {
    optGroup.appendChild(option);
  }
}

export async function addTrigger(parent: HTMLElement) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  await injectTriggerForm(parent, { id: foundry.utils.randomID() } as any);
}

export async function editTrigger(parent: HTMLElement) {
  const section = parent.querySelector(`[data-role="trigger-config"]`);
  if (!(section instanceof HTMLElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  section.innerHTML = "";

  const trigger = selectedTrigger(parent);
  if (!trigger) return;
  await injectTriggerForm(parent, trigger);
}

export function getTriggerActionSelect(): Record<string, string> {
  if (!game.i18n) return {};

  return Object.fromEntries(
    triggerActions
      .sort((a, b) => game.i18n.localize(`STAGEMANAGER.TRIGGERS.ACTIONS.${a.i18nKey}`).localeCompare(game.i18n.localize(`STAGEMANAGER.TRIGGERS.ACTIONS.${b.i18nKey}`)))
      .map(action => [action.type, `STAGEMANAGER.TRIGGERS.ACTIONS.${action.i18nKey}`])
  )
}

export function getTriggerActionType(action: SerializedTrigger | string): typeof TriggerAction | undefined {
  return triggerActions.find(item => item.type === (typeof action === "string" ? action : action.action));
}

export function getTriggerEvents(trigger?: SerializedTrigger): EventSpec[] {
  return triggerEvents
    .map(item => ({
      ...item,
      label: game.i18n?.localize(item.label) ?? "",
      categoryLabel: game.i18n?.localize(item.categoryLabel) ?? "",
      selected: trigger?.event === item.value
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export async function deleteTrigger(parent: HTMLElement) {
  const trigger = selectedTrigger(parent);
  if (!trigger) throw new LocalizedError("NOTRIGGERELEMENT");

  const remove = await confirm(
    localize("STAGEMANAGER.CONFIRMREMOVETRIGGER.TITLE"),
    localize("STAGEMANAGER.CONFIRMREMOVETRIGGER.MESSAGE", { name: getTriggerLabel(trigger) })
  );

  if (!remove) return;
  const option = selectedTriggerOption(parent);
  if (!(option instanceof HTMLOptionElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  const group = option.parentElement;
  option.remove();

  if (group instanceof HTMLOptGroupElement) {
    if (group.childElementCount === 0)
      group.remove();
  }

  const section = parent.querySelector(`[data-role="trigger-config"]`);
  if (section instanceof HTMLElement) section.innerHTML = "";

}

const triggerActions = Object.values(tempTriggerActions).filter(item => !!item.type);

export function setEventListeners(parent: HTMLElement) {
  const selectors = parent.querySelectorAll(`select[name="trigger.action"], select[name="trigger.event"]`);
  for (const selector of selectors)
    selector.addEventListener("change", () => { setSelectedConfig(parent); });

}

