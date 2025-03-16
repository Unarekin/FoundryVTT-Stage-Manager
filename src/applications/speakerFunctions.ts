import { coerceActor } from "../coercion";
import { InvalidActorError, InvalidSpeakerTypeError, LocalizedError } from "../errors";
import { localize } from "../functions";
import { getActorSettings } from "../Settings";
import { SerializedActorStageObject, SerializedImageStageObject, SerializedSpeaker } from "../types";
import { getDocuments } from "./functions";
import { ActorStageObject, DialogueStageObject, ImageStageObject } from "../stageobjects";
import { DialogueStageObjectApplication } from "./DialogueStageObjectApplication";
import { logError } from "../logging";

export async function addSpeaker(dialogue: DialogueStageObjectApplication) {
  const speakerType = await speakerTypeDialog();
  if (!speakerType) return;

  const slot = dialogue.stageObject.nextSlotPosition();

  await injectEditForm(dialogue, { id: foundry.utils.randomID(), type: speakerType, zIndex: -10, bounds: { x: slot.x, y: slot.y, width: 0, height: 0 } } as SerializedSpeaker);
}

export async function selectSpeaker(dialogue: DialogueStageObjectApplication, speaker: SerializedSpeaker) {
  await injectEditForm(dialogue, speaker);
  // dialogue.stageObject.speakers.forEach(item => {
  //   if (item.id !== speaker.id) {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //     // item.effects = item.effects.filter(effect => !(effect instanceof (PIXI.filters as any).OutlineFilter));
  //     // item.displayObject.tint = new PIXI.Color("gray").toNumber();
  //   } else {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  //     // if (!item.effects.some(effect => effect instanceof (PIXI.filters as any).OutlineFilter)) {
  //     //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
  //     //   item.effects.push(new (PIXI.filters as any).OutlineFilter(2, new PIXI.Color("#007bff").toNumber()))
  //     // }
  //     // item.displayObject.tint = new PIXI.Color("white").toNumber();

  //   }
  // })
}

async function injectEditForm(dialogue: DialogueStageObjectApplication, speaker: SerializedSpeaker) {
  const parent = dialogue.element;
  const container = parent.querySelector(`[data-role="speaker-config"]`);
  if (!(container instanceof HTMLElement)) throw new LocalizedError("NOCONFIGELEMENT");


  const bounds = dialogue.stageObject.actualBounds;
  speaker.bounds = {
    x: speaker.bounds.x * bounds.width,
    y: speaker.bounds.y * bounds.height,
    width: speaker.bounds.width * bounds.width,
    height: speaker.bounds.height * bounds.height
  }

  // const autoPosition = dialogue.element.querySelector(`[data-action="toggleAutoPosition"]`);

  let content = "";
  const context: Record<string, unknown> = {
    actors: getDocuments("Actor", (speaker as SerializedActorStageObject).actor ?? ""),
    // autoPosition: autoPosition instanceof HTMLInputElement ? autoPosition.checked : false,
    speaker
  }

  switch (speaker.type) {
    case "image":
      content = await renderTemplate(`modules/${__MODULE_ID__}/templates/speakers/image.hbs`, context);
      break;
    case "actor":
      content = await renderTemplate(`modules/${__MODULE_ID__}/templates/speakers/actor.hbs`, context);
      break;
    default:
      throw new InvalidSpeakerTypeError(speaker.type);
  }

  container.innerHTML = content;

  const removeButton = dialogue.element.querySelector(`[data-action="deleteSpeaker"]`);
  if (removeButton instanceof HTMLButtonElement) removeButton.removeAttribute("disabled");

  const toolTip = dialogue.element.querySelector(`[data-role="preview-tooltip"]`);
  if (toolTip instanceof HTMLElement && typeof context.src === "string" && context.src) toolTip.dataset.tooltip = `<img src="${context.src}">`;

  addEventListeners(dialogue);
}

export function setSpeakerOption(parent: HTMLElement, speaker: SerializedSpeaker) {
  const select = parent.querySelector(`select[name="speakerList"]`);
  if (!(select instanceof HTMLSelectElement)) throw new LocalizedError("NOCONFIGELEMENT");

  const option = select.querySelector(`option[value="${speaker.id}"]`);
  if (option instanceof HTMLOptionElement) {
    option.dataset.serialized = JSON.stringify(speaker);
    option.innerText = speaker.name;
  } else {
    const option = document.createElement("option");
    option.setAttribute("value", speaker.id);
    option.dataset.serialized = JSON.stringify(speaker);
    option.innerText = speaker.name;
    select.options.add(option);
  }
}

async function speakerTypeDialog(): Promise<string | undefined> {
  const content = await renderTemplate(`modules/${__MODULE_ID__}/templates/simpleSelection.hbs`, {
    items: [
      { value: "image", label: "STAGEMANAGER.EDITDIALOG.SPEAKERS.IMAGE" },
      { value: "actor", label: "STAGEMANAGER.EDITDIALOG.SPEAKERS.ACTOR" }
    ].sort((a, b) => localize(a.label).localeCompare(localize(b.label)))
  });

  const selection = await new Promise<string | undefined>(resolve => {
    void foundry.applications.api.DialogV2.wait({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      window: ({ title: "STAGEMANAGER.EDITDIALOG.SPEAKERS.ADD" } as any),
      content,
      rejectClose: false,
      actions: {
        select: (e, elem) => { resolve(elem.dataset.item); }
      },
      buttons: [
        {
          action: "cancel",
          label: `<i class='fas fa-times'></i> ${localize('Cancel')}`
        }
      ]
    })
      .then(val => {
        resolve(val ?? undefined);
      })
  })
  return selection === "cancel" ? undefined : selection ?? undefined;
}

export function shouldAutoPosition(parent: HTMLElement): boolean {
  const autoPosition = parent.querySelector(`[name="autoPosition"]`)
  return (autoPosition instanceof HTMLInputElement && autoPosition.checked);
}

async function setFormImage(parent: HTMLElement, src: string): Promise<void> {
  const texture = PIXI.Texture.from(src);
  const width = parent.querySelector(`input[name="speaker.bounds.width"]`);
  const height = parent.querySelector(`input[name="speaker.bounds.height"]`);

  if (!texture.valid) {
    return new Promise(resolve => {
      texture.baseTexture.once("loaded", () => {
        if (height instanceof HTMLInputElement) height.value = texture.baseTexture.realHeight.toString();
        if (width instanceof HTMLInputElement) width.value = texture.baseTexture.realWidth.toString();
        resolve();
      });
    })
  } else {
    if (height instanceof HTMLInputElement) height.value = texture.baseTexture.realHeight.toString();
    if (width instanceof HTMLInputElement) width.value = texture.baseTexture.realWidth.toString();
    return Promise.resolve();
  }
}

function getFileName(path: string): string {
  const split = path.split("/");
  return split[split.length - 1].split(".")[0];
}

export function addEventListeners(dialogue: DialogueStageObjectApplication) {
  const parent = dialogue.element;
  const actorSelect = parent.querySelector(`select[name="speaker.actor"]`);
  // const previewTooltip = parent.querySelector(`[data-role="preview-tooltip"]`)
  const pathInput = parent.querySelector(`[name="speaker.src"] input`);
  const labelInput = parent.querySelector(`input[name="speaker.name"]`)


  const filePicker = parent.querySelector(`[name="speaker.src"]`);
  if (filePicker instanceof HTMLElement) {
    filePicker.addEventListener("change", () => {
      // Set label if it isn't already
      if (labelInput instanceof HTMLInputElement && !labelInput.value) labelInput.value = getFileName((filePicker as HTMLInputElement).value);
      void setFormImage(parent, (filePicker as HTMLInputElement).value)
        .then(() => {
          dialogue.triggerFormChange();
          dialogue.autoPositionSpeakers();

          // const autoPosition = parent.querySelector(`[name="autoPosition"]`);
          // if (autoPosition instanceof HTMLInputElement && autoPosition.checked) dialogue.autoPositionSpeakers();
        })
        .catch((err: Error) => { logError(err); })
    })
  }



  if (actorSelect instanceof HTMLSelectElement) {
    actorSelect.addEventListener("change", () => {
      const actor = coerceActor(actorSelect.value);
      if (!(actor instanceof Actor)) throw new InvalidActorError(actorSelect.value);
      const settings = getActorSettings(actor);
      if (!settings) throw new InvalidActorError(actorSelect.value);

      if (pathInput instanceof HTMLInputElement) pathInput.value = settings.image;
      if (labelInput instanceof HTMLInputElement) labelInput.value = settings.name;

      void setFormImage(parent, settings.image)
        .then(() => {
          dialogue.triggerFormChange();
          dialogue.autoPositionSpeakers();
          // const autoPosition = parent.querySelector(`[name="autoPosition"]`);
          // if (autoPosition instanceof HTMLInputElement && autoPosition.checked) dialogue.autoPositionSpeakers();
        })
        .catch((err: Error) => { logError(err); })
    });
  }
}


export function parseSpeakerFormData(stageObject: DialogueStageObject, data: Record<string, unknown>): SerializedSpeaker {
  switch (data.type) {
    case "actor":
      return parseActorSpeakerFormData(stageObject, data);
    case "image":
      return parseImageSpeakerFormData(stageObject, data);
    default:
      throw new InvalidSpeakerTypeError(data.type);
  }
}


function parseActorSpeakerFormData(stageObject: DialogueStageObject, data: Record<string, unknown>): SerializedActorStageObject {
  const speaker = stageObject.getSpeaker(data.actor as string) as ActorStageObject | undefined ?? new ActorStageObject(data.actor as string);
  const serialized = {
    ...speaker.serialize(),
    ...data,
    src: speaker.path
  }

  // if (data.src) serialized.src = data.src as string;
  // if (data.label) serialized.name = data.label as string;

  if (data.bounds) {
    const bounds = data.bounds as Record<string, number>;
    serialized.bounds = {
      x: bounds.x / window.innerWidth,
      y: bounds.y / window.innerHeight,
      width: bounds.width / window.innerWidth,
      height: bounds.height / window.innerHeight
    }
  }
  return serialized;
}

function parseImageSpeakerFormData(stageObject: DialogueStageObject, data: Record<string, unknown>): SerializedImageStageObject {
  const speaker = stageObject.getSpeaker(data.src as string) ?? new ImageStageObject(data.src as string);
  const serialized = {
    ...speaker.serialize(),
    ...data,
    src: speaker.path
  }

  // if (data.src) serialized.src = data.src as string;
  // if (data.label) serialized.name = data.label as string;

  if (data.bounds) {
    const bounds = data.bounds as Record<string, number>;
    serialized.bounds = {
      x: bounds.x / window.innerWidth,
      y: bounds.y / window.innerHeight,
      width: bounds.width / window.innerWidth,
      height: bounds.height / window.innerHeight
    }
  }
  return serialized;
}