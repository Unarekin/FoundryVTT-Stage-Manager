import { localize } from "functions";
import { defaultEffect, deserializeEffect, getEffectHandler, getEffectTemplate } from '../lib/effects';
import effects from "./effects.json";
import { SerializedEffect } from "types";
import { confirm } from "functions";
import { LocalizedError } from "errors";

export async function addEffect(parent: HTMLElement) {
  const selected = await selectEffectDialog();
  if (!selected) return;

  const handler = getEffectHandler(selected);
  if (!handler) return;

  const effect = defaultEffect(selected);
  if (!effect) return;

  effect.id = foundry.utils.randomID();

  const filter = deserializeEffect(effect);
  if (!(filter instanceof PIXI.Filter)) return;

  const selectList = parent.querySelector(`select[name="effectsList"]`);
  if (!(selectList instanceof HTMLSelectElement)) return;

  const option = document.createElement("option");
  option.setAttribute("value", effect.id);
  option.dataset.type = effect.type;
  option.dataset.serialized = JSON.stringify(effect);
  option.innerText = localize(`STAGEMANAGER.EDITDIALOG.EFFECTS.${handler.label}`);
  selectList.add(option);
  selectList.value = effect.id;

  await selectEffect(parent, effect.id);
}

export async function selectEffect(parent: HTMLElement, id: string) {
  const section = parent.querySelector(`[data-role="effect-config"]`);
  if (!(section instanceof HTMLElement)) return;

  section.innerHTML = "";
  const option = parent.querySelector(`select[name="effectsList"] option[value="${id}"]`);
  if (option instanceof HTMLOptionElement) {
    if (typeof option.dataset.serialized !== "string") return;
    const deserialized = JSON.parse(option.dataset.serialized) as SerializedEffect;
    const template = getEffectTemplate(deserialized.type);
    if (!template) return;

    const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/effects/${template}`, {
      ...deserialized,
      serialized: option.dataset.serialized,
      bgTypeSelect: {
        image: "STAGEMANAGER.EDITDIALOG.BGTYPES.IMAGE",
        color: "STAGEMANAGER.EDITDIALOG.BGTYPES.COLOR"
      }
    });

    section.innerHTML = content;
    setBgSelectorConfig(parent);
    const bgSelector = section.querySelector(`[name="effect.backgroundType"]`);
    if (bgSelector instanceof HTMLSelectElement) {
      bgSelector.addEventListener("change", () => { setBgSelectorConfig(parent); });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ColorPicker.install();

    const deleteButton = parent.querySelector(`button[data-action="deleteEffect"]`);
    if (deleteButton instanceof HTMLButtonElement) deleteButton.disabled = false;
  } else {
    const deleteButton = parent.querySelector(`button[data-action="deleteEffect"]`);
    if (deleteButton instanceof HTMLButtonElement) deleteButton.disabled = true;
  }
}

export async function deleteEffect(parent: HTMLElement) {
  const idElem = parent.querySelector(`input[name="effect.id"]`);
  if (!(idElem instanceof HTMLInputElement)) return;
  const id = idElem.value;
  const option = parent.querySelector(`select#effectsList option[value="${id}"]`);
  if (!(option instanceof HTMLOptionElement)) return;

  const confirmed = await confirm(
    localize("STAGEMANAGER.EDITDIALOG.DELETEEFFECT.TITLE", { type: option.dataset.type ?? "" }),
    localize("STAGEMANAGER.EDITDIALOG.DELETEEFFECT.MESSAGE").replaceAll("\n", "<br>")
  )

  if (!confirmed) return;

  option.remove();
  await selectEffect(parent, "");
}

function setBgSelectorConfig(parent: HTMLElement) {
  const selector = parent.querySelector(`[name="effect.backgroundType"]`);
  const configs = parent.querySelectorAll(`[data-background-type]`);

  for (const config of configs)
    (config as HTMLElement).style.display = "none";

  if (selector instanceof HTMLSelectElement) {
    const config = parent.querySelector(`[data-background-type="${selector.value}"]`);
    if (config instanceof HTMLElement) config.style.display = "block";
  }
}


async function selectEffectDialog(): Promise<string | undefined> {
  const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/addEffect.hbs`, {
    effects: effects.sort((a, b) => localize(a.label).localeCompare(localize(b.label)))
  });
  const selection = await new Promise<string | undefined>(resolve => {
    void foundry.applications.api.DialogV2.wait({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window: ({ title: "STAGEMANAGER.EDITDIALOG.EFFECTS.ADD" } as any),
      content,
      rejectCLose: false,
      actions: {
        select: (e, elem) => { resolve(elem.dataset.effect); }
      },
      buttons: [
        {
          action: "cancel",
          label: `<i class="fas fa-times"></i> ${localize("Cancel")}`,
        }
      ]
    }).then(val => {
      resolve(val ?? undefined);
    })
  });
  return selection === "cancel" ? undefined : selection ?? undefined;
}

export function parseEffectList(form: HTMLFormElement): SerializedEffect[] {
  const options = Array.from(form.querySelectorAll(`select[name="effectsList"] option`).values()) as HTMLElement[];
  return options.reduce((prev, curr) => {
    if (!curr.dataset.serialized) return prev;
    return [
      ...prev,
      JSON.parse(curr.dataset.serialized) as SerializedEffect
    ];
  }, [] as SerializedEffect[]);
}

export function parseEffectFormData(form: HTMLFormElement): SerializedEffect | undefined {
  const configElem = form.querySelector(`[data-role="effect-config"]`);
  if (!(configElem instanceof HTMLElement)) return;

  const typeElem = configElem.querySelector(`[name="effect.type"]`);
  const effectType = typeElem instanceof HTMLInputElement ? typeElem.value : "";
  const handler = getEffectHandler(effectType);
  if (handler)
    return handler.fromForm(configElem);
}


export function setEffectOption(parent: HTMLElement, effect: SerializedEffect) {
  if (!effect.id) return;
  const select = parent.querySelector(`select[name="effectsList"]`);
  if (!(select instanceof HTMLSelectElement)) throw new LocalizedError("NOEFFECTELEMENT");

  const handler = getEffectHandler(effect.type);
  if (!handler) return;

  const option: HTMLOptionElement = select.querySelector(`option[value="${effect.id}"]`) ?? document.createElement("option");
  option.value = effect.id;
  option.dataset.type = effect.type;
  option.dataset.serialized = JSON.stringify(effect);
  option.innerText = localize(`STAGEMANAGER.EDITDIALOG.EFFECTS.${handler.label}`);

  if (option.parentElement !== select) select.appendChild(option);
}