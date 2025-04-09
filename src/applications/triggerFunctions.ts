import { SerializedTrigger, TriggerEventSignatures } from '../types';
import { InvalidTriggerError, LocalizedError } from 'errors';
import { getTriggerActionType, triggerActions } from 'triggeractions';
import triggerEvents from "./triggerEvents.json";
import { localize, confirm } from 'functions';
import { StageObject } from 'stageobjects';

const TRIGGER_LIST_SELECTOR = `select[name="triggerList"]`
const TRIGGER_FORM_SELECTOR = `[data-role="trigger-config"]`

interface EventSpec {
  addlArgs: { name: string, label: string }[]
  category: string;
  categoryLabel: string;
  label: string;
  value: string;
}


export function setTriggerOption(parent: HTMLElement, trigger: SerializedTrigger): void {
  const select = parent.querySelector(TRIGGER_LIST_SELECTOR);
  if (!(select instanceof HTMLSelectElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  const triggerClass = getTriggerActionType(trigger);
  if (!triggerClass) throw new InvalidTriggerError(trigger.action);

  const event = triggerEvents.find(item => item.value === trigger.event);
  if (!event) throw new InvalidTriggerError(trigger.event);

  const option: HTMLOptionElement = select.querySelector(`option[value="${trigger.id}"]`) ?? document.createElement("option");

  option.dataset.event = trigger.event;
  option.dataset.serialized = JSON.stringify(trigger);
  option.value = trigger.id;
  option.innerText = triggerClass.getDialogLabel(trigger);

  // Add to group
  const optGroup = select.querySelector(`optgroup[data-category="${trigger.event}"]`);
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

export function parseTriggerList(parent: HTMLElement): Record<string, SerializedTrigger[]> {
  const triggers = Array.from(parent.querySelectorAll(`select[name="triggerList"] option`).values()) as HTMLOptionElement[];
  const data: Record<string, SerializedTrigger[]> = {};
  for (const trigger of triggers) {
    const event = trigger.dataset.event as keyof TriggerEventSignatures;
    if (!event) continue;
    const serialized = trigger.dataset.serialized;
    if (!serialized) continue;
    const deserialized = JSON.parse(serialized) as SerializedTrigger;

    if (!Array.isArray(data[event])) {
      data[event] = [deserialized]
    } else {
      const index = data[event].findIndex(item => item.id === deserialized.id);
      if (index === -1) data[event].push(deserialized);
      else data[event][index] = deserialized;
    }
  }

  return data;
}

export function parseTriggerFormData(data: Record<string, unknown>): SerializedTrigger | undefined {
  try {
    if (!data.trigger) return;

    const triggerClass = getTriggerActionType(data.trigger as SerializedTrigger);
    if (!triggerClass) return;

    return triggerClass.fromFormData(data.trigger as Record<string, unknown>);
  } catch {
    return undefined;
  }
}

export async function addTrigger(parent: HTMLElement, stageObject: StageObject): Promise<void> {
  await injectTriggerForm(parent, undefined, stageObject);
}

async function injectTriggerForm(parent: HTMLElement, trigger?: SerializedTrigger, stageObject?: StageObject): Promise<void> {
  const section = parent.querySelector(TRIGGER_FORM_SELECTOR);
  if (!(section instanceof HTMLElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  section.innerHTML = "";

  const deleteButton = parent.querySelector(`button[data-action="deleteTrigger"]`);
  if (deleteButton instanceof HTMLButtonElement) deleteButton.disabled = true;

  const context = {
    trigger: trigger ? trigger : { id: foundry.utils.randomID() },
    stageObject: stageObject ? stageObject.serialize() : undefined,
    triggerActionSelect: getTriggerActionSelect(),
    triggerEventSelect: getTriggerEventSelect(trigger)
  };

  const actions = Object.values(triggerActions);
  for (const action of actions)
    foundry.utils.mergeObject(context, action.prepareContext(trigger));

  const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/edit-trigger.hbs`, context);
  section.innerHTML = content;

  if (deleteButton instanceof HTMLButtonElement) deleteButton.disabled = false;

  const triggerSelectors = parent.querySelectorAll(`select[name="trigger.action"], select[name="trigger.event"]`);
  for (const selector of triggerSelectors)
    selector.addEventListener("change", () => { setSelectedConfig(parent, stageObject); });

  // Add type-specific
  const autoSection = parent.querySelector(`[data-role="autoArguments"]`);
  if (autoSection instanceof HTMLElement) {
    autoSection.innerHTML = "";

    if (trigger?.action) {
      const actionClass = getTriggerActionType(trigger);
      if (actionClass?.customArgumentTemplate) {
        const customArgs = await renderTemplate(actionClass.customArgumentTemplate, context);
        autoSection.innerHTML = customArgs;
      }
    }
  }

  setSelectedConfig(parent, stageObject);
}

export async function editTrigger(parent: HTMLElement, trigger: SerializedTrigger, stageObject: StageObject) {
  await injectTriggerForm(parent, trigger, stageObject);
}

export async function deleteTrigger(parent: HTMLElement) {
  const select = parent.querySelector(TRIGGER_LIST_SELECTOR);
  if (!(select instanceof HTMLSelectElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  const option = select.options[select.selectedIndex];
  if (!(option instanceof HTMLOptionElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  if (!option.dataset.serialized) return;
  const trigger = JSON.parse(option.dataset.serialized) as SerializedTrigger;

  const remove = await confirm(
    localize("STAGEMANAGER.CONFIRMREMOVETRIGGER.TITLE"),
    localize("STAGEMANAGER.CONFIRMREMOVETRIGGER.MESSAGE", { name: getTriggerLabel(trigger) })
  );

  if (!remove) return;


  const group = option.parentElement;
  option.remove();

  // Remove empty OptGroup
  if (group instanceof HTMLOptGroupElement && group.childElementCount === 0)
    group.remove();

  // Clear form
  const section = parent.querySelector(`[data-role="trigger-config"]`);
  if (section instanceof HTMLElement) section.innerHTML = "";

  // Disable delete button
  const deleteButton = parent.querySelector(`button[data-action="deleteTrigger"]`);
  if (deleteButton instanceof HTMLButtonElement) deleteButton.disabled = true;
}

function getTriggerLabel(trigger: SerializedTrigger): string {
  const triggerClass = getTriggerActionType(trigger);
  if (!triggerClass) return "";

  return triggerClass.getDialogLabel(trigger);
}

function showElements(parent: HTMLElement, selector: string) {
  const elements = parent.querySelectorAll(selector);
  for (const elem of elements)
    if (elem instanceof HTMLElement) elem.style.display = "block";
}

function hideElements(parent: HTMLElement, selector: string) {
  const elements = parent.querySelectorAll(selector);
  for (const elem of elements)
    if (elem instanceof HTMLElement) elem.style.display = "none";
}

function setSelectedConfig(parent: HTMLElement, stageObject?: StageObject) {
  const eventSelect = parent.querySelector(`select[name="trigger.event"]`);
  if (!(eventSelect instanceof HTMLSelectElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  const selectedEvent = eventSelect.value;

  // Hide configuration elements
  hideElements(parent, `[data-role="event-configs"] [data-type], [data-role="event-configs"] [data-category]`);

  // Show event-specific configuration items
  showElements(parent, `[data-role="event-configs"] [data-event="${selectedEvent}"]`);

  // Show category-specific configuration
  const selectedOption = eventSelect.options[eventSelect.selectedIndex];
  const category = selectedOption.dataset.category;
  showElements(parent, `[data-role="event-configs"] [data-category="${category}"]`);

  const typeSelect = parent.querySelector(`select[name="trigger.action"]`);
  if (!(typeSelect instanceof HTMLSelectElement)) throw new LocalizedError("NOTRIGGERELEMENT");

  const selectedAction = typeSelect.value;
  showElements(parent, `[data-role="action-configs"] [data-type="${selectedAction}"]`);

  hideElements(parent, `[data-role="action-configs"] [data-type]:not([data-type="${selectedAction}"])`);

  if (selectedAction === "macro")
    void setMacroArgs(parent, stageObject);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function setMacroArgs(parent: HTMLElement, stageObject?: StageObject) {
  const eventElem = parent.querySelector(`select[name="trigger.event"]`);
  if (!(eventElem instanceof HTMLSelectElement)) return;

  const selected = eventElem.value;
  const events = Object.values(triggerEvents);
  const event = events.find(elem => elem.value === selected);

  if (!event) return;

  const autoArgs = parent.querySelector(`[data-role="autoArguments"]`);
  if (autoArgs instanceof HTMLElement) {

    autoArgs.innerHTML = "";

    const args: { key: string, label: string, value: string }[] = [
      // Object-specific
      ...(stageObject ? stageObject.macroArguments() : []),
      // Event-specific
      ...event.addlArgs.map(arg => ({ key: arg.name, label: arg.name, value: `STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.AUTO` }))
    ]
      .filter((arg, i, arr) => arr.findIndex(elem => elem.key === arg.key) === i)
      .sort((a, b) => a.key.localeCompare(b.key))
      ;

    for (const arg of args) {
      const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/editObject/additional-arg.hbs`, arg);
      autoArgs.innerHTML += content;
    }

    const argElems = parent.querySelectorAll(`[data-role="autoArguments"] input`);
    for (const elem of argElems) {
      if (elem instanceof HTMLInputElement) elem.disabled = true;
    }
  }

  // const customArgs = parent.querySelector(`[data-role="customArguments"]`);
  // if (customArgs instanceof HTMLElement) {
  //   customArgs.innerHTML = "";
  //   if (Array.isArray(event.addlArgs)) {
  //     for (const arg of event.addlArgs) {
  //       const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/editObject/additional-arg.hbs`, arg);
  //       customArgs.innerHTML += content;
  //     }
  //   }
  // }
}

function getTriggerActionSelect(): Record<string, string> {
  return Object.fromEntries(
    Object.values(triggerActions)
      .sort((a, b) => localize(`STAGEMANAGER.TRIGGERS.ACTIONS.${a.i18nKey}`).localeCompare(localize(`STAGEMANAGER.TRIGGERS.ACTIONS.${b.i18nKey}`)))
      .map(action => [action.type, `STAGEMANAGER.TRIGGERS.ACTIONS.${action.i18nKey}`])
  )
}

function getTriggerEventSelect(trigger?: SerializedTrigger): EventSpec[] {
  return triggerEvents.map(item => ({
    ...item,
    label: localize(item.label),
    categoryLabel: localize(item.categoryLabel),
    selected: trigger?.event === item.value
  }))
    .sort((a, b) => a.label.localeCompare(b.label))
}