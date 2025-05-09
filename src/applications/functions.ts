import { coerceTexture } from "coercion";
import { CanvasNotInitializedError, InvalidTextureError, UnknownDocumentTypeError } from "errors";
import { Border, Scope } from "types";
import presetData from "./pathPresets.json";

const presetPaths: Record<string, Record<string, Record<string, string>>> = presetData;
/*
{
  "system": {
    "type": {
      "path": "i18n"
    }
  }
}
*/

interface SectionSpec {
  pack: string;
  uuid: string;
  name: string;
  selected: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function addEventListeners(parent: HTMLElement) {
  // empty
}

export function fontSelectContext(): Record<string, string> {
  return Object.fromEntries(
    FontConfig.getAvailableFonts()
      .sort((a, b) => a.localeCompare(b))
      .map(font => [font, font])
  );
}

export function textAlignmentContext(): Record<string, string> {
  return {
    left: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.LEFT",
    right: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.RIGHT",
    center: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.CENTER",
    justify: "STAGEMANAGER.EDITDIALOG.TEXTALIGN.JUSTIFY"
  }
}

export function whiteSpaceContext(): Record<string, string> {
  return {
    normal: "STAGEMANAGER.EDITDIALOG.WHITESPACE.NORMAL",
    pre: "STAGEMANAGER.EDITDIALOG.WHITESPACE.PRE",
    "pre-line": "STAGEMANAGER.EDITDIALOG.WHITESPACE.PRELINE"
  }
}


export function getDocuments(documentName: string, selected?: string): SectionSpec[] {
  if (!(game instanceof Game)) return [];
  const documents: SectionSpec[] = [];

  const collection = game.collections?.get(documentName);
  if (!collection) throw new UnknownDocumentTypeError(documentName);

  // Add non-compendium documents
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  documents.push(...collection.map((item: any) => ({ uuid: item.uuid, name: item.name ?? "", pack: "", selected: item.uuid === selected })));

  // Add compendium documents
  if (game?.packs) {
    game.packs.forEach(pack => {
      if (pack.documentName === documentName) {

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        documents.push(...pack.index.map((item: any) => ({ uuid: item.uuid, name: item.name ?? item.uuid, pack: pack.metadata.label, selected: item.uuid === selected })));
      }
    })
  }

  return documents;
}

export async function drawPanelPreview(previewCanvas: HTMLCanvasElement, source: PIXI.TextureSource | PIXI.ColorSource, border: Border, showGuides = true, overrideWidth = 0, overrideHeight = 0) {
  if (!canvas?.app?.renderer) throw new CanvasNotInitializedError();

  const targetCanvas = document.createElement("canvas");

  const texture = coerceTexture(source);
  if (!(texture instanceof PIXI.Texture)) throw new InvalidTextureError();
  const ctx = targetCanvas.getContext("2d");
  if (!ctx) throw new CanvasNotInitializedError();

  const { width, height } = texture;

  previewCanvas.style.width = overrideWidth ? `${overrideWidth}px` : "100%";
  previewCanvas.style.height = overrideHeight ? `${overrideHeight}px` : `${Math.min(Math.max(32, height), 128)}px`;

  // Set to width of parent element or, if none, natural width of the texture
  // targetCanvas.width = Math.max(previewCanvas.parentElement?.clientWidth ? previewCanvas.parentElement.clientWidth : width, 64);
  targetCanvas.width = overrideWidth ? overrideWidth : previewCanvas.clientWidth ? previewCanvas.clientWidth : 128;
  targetCanvas.height = overrideHeight ? overrideHeight : previewCanvas.clientHeight ? previewCanvas.clientHeight : 64;


  // Render to RenderTexture
  const sprite = new PIXI.Sprite(texture);
  const renderTexture = PIXI.RenderTexture.create({ width, height });
  canvas.app.renderer.render(sprite, { renderTexture, skipUpdateTransform: true, clear: false });

  const img = await canvas.app.renderer.extract.image(renderTexture);

  ctx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

  // Top row
  ctx.drawImage(img, 0, 0, border.left, border.top, 0, 0, border.left, border.top);
  ctx.drawImage(img, border.left, 0, width - border.right - border.left, border.top, border.left, 0, targetCanvas.width - border.left - border.right, border.top);
  ctx.drawImage(img, width - border.right, 0, border.right, border.top, targetCanvas.width - border.right, 0, border.right, border.top);

  // Middle row
  ctx.drawImage(img, 0, border.top, border.left, height - border.top - border.bottom, 0, border.top, border.left, targetCanvas.height - border.bottom - border.top);
  ctx.drawImage(img, border.left, border.top, width - border.left - border.right, height - border.top - border.bottom, border.left, border.top, targetCanvas.width - border.left - border.right, targetCanvas.height - border.top - border.bottom);
  ctx.drawImage(img, width - border.right, border.top, border.right, height - border.top - border.bottom, targetCanvas.width - border.right, border.top, border.right, targetCanvas.height - border.top - border.bottom);

  // Bottom row
  ctx.drawImage(img, 0, height - border.bottom, border.right, border.bottom, 0, targetCanvas.height - border.bottom, border.left, border.bottom);
  ctx.drawImage(img, border.left, height - border.bottom, width - border.right - border.left, border.bottom, border.left, targetCanvas.height - border.bottom, targetCanvas.width - border.right - border.left, border.bottom);
  ctx.drawImage(img, width - border.right, height - border.bottom, border.right, border.bottom, targetCanvas.width - border.right, targetCanvas.height - border.bottom, border.right, border.bottom);


  // Add guidelines
  if (showGuides) {
    ctx.beginPath();
    ctx.moveTo(border.left, 0);
    ctx.lineTo(border.left, targetCanvas.height);

    ctx.moveTo(targetCanvas.width - border.right, 0);
    ctx.lineTo(targetCanvas.width - border.right, targetCanvas.height);

    ctx.moveTo(0, border.top);
    ctx.lineTo(targetCanvas.width, border.top);

    ctx.moveTo(0, targetCanvas.height - border.bottom);
    ctx.lineTo(targetCanvas.width, targetCanvas.height - border.bottom);

    ctx.strokeStyle = "red";
    ctx.stroke();
  }

  const previewCtx = previewCanvas.getContext("2d");
  if (!previewCtx) throw new CanvasNotInitializedError();
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCanvas.width = targetCanvas.width;
  previewCanvas.height = targetCanvas.height;
  previewCtx.drawImage(targetCanvas, 0, 0);


  // Cleanup
  renderTexture.destroy();
  sprite.destroy();
}



export function easingSelectOptions(): Record<string, string> {
  return {
    "none": "STAGEMANAGER.EASINGS.NONE",
    "power1.in": "STAGEMANAGER.EASINGS.POWER1IN",
    "power1.out": "STAGEMANAGER.EASINGS.POWER1OUT",
    "power1.inOut": "STAGEMANAGER.EASINGS.POWER1INOUT",
    "power2.in": "STAGEMANAGER.EASINGS.POWER2IN",
    "power2.out": "STAGEMANAGER.EASINGS.POWER2OUT",
    "power2.inOut": "STAGEMANAGER.EASINGS.POWER2INOUT",
    "power3.in": "STAGEMANAGER.EASINGS.POWER3IN",
    "power3.out": "STAGEMANAGER.EASINGS.POWER3OUT",
    "power3.inOut": "STAGEMANAGER.EASINGS.POWER3INOUT",
    "power4.in": "STAGEMANAGER.EASINGS.POWER4IN",
    "power4.out": "STAGEMANAGER.EASINGS.POWER4OUT",
    "power4.inOut": "STAGEMANAGER.EASINGS.POWER4INOUT",
    "back.in": "STAGEMANAGER.EASINGS.BACKIN",
    "back.out": "STAGEMANAGER.EASINGS.BACKOUT",
    "back.inOut": "STAGEMANAGER.EASINGS.BACKINOUT",
    "bounce.in": "STAGEMANAGER.EASINGS.BOUNCEIN",
    "bounce.out": "STAGEMANAGER.EASINGS.BOUNCEOUT",
    "bounce.inOut": "STAGEMANAGER.EASINGS.BOUNCEINOUT",
    "circ.in": "STAGEMANAGER.EASINGS.CIRCIN",
    "circ.out": "STAGEMANAGER.EASINGS.CIRCOUT",
    "circ.inOut": "STAGEMANAGER.EASINGS.CIRCINOUT",
    "elastic.in": "STAGEMANAGER.EASINGS.ELASTICIN",
    "elastic.out": "STAGEMANAGER.EASINGS.ELASTICOUT",
    "elastic.inOut": "STAGEMANAGER.EASINGS.ELASTICINOUT",
    "expo.in": "STAGEMANAGER.EASINGS.EXPOIN",
    "expo.out": "STAGEMANAGER.EASINGS.EXPOOUT",
    "expo.inOut": "STAGEMANAGER.EASINGS.EXPOINOUT",
    "sine.in": "STAGEMANAGER.EASINGS.SINEIN",
    "sine.out": "STAGEMANAGER.EASINGS.SINEOUT",
    "sine.inOut": "STAGEMANAGER.EASINGS.SINEINOUT",
    // "steps": "STAGEMANAGER.EASINGS.STEPS",
    // "rough": "STAGEMANAGER.EASINGS.ROUGH",
    // "slow": "STAGEMANAGER.EASINGS.SLOW",
    // "expoScale": "STAGEMANAGER.EASINGS.EXPOSCALE"
  }
}

export function pathPresetSelect(uuid?: string): Record<string, string> {
  const context: Record<string, string> = {};

  if (uuid) {
    const obj = fromUuidSync(uuid) as foundry.abstract.Document<any, any, any>;

    if (game?.system && presetPaths[game.system.id]?.[obj.documentName as string]) {
      foundry.utils.mergeObject(context, presetPaths[game.system.id][obj.documentName as string]);
    }


    if (obj instanceof Actor) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const attrs = TokenDocument.getTrackedAttributes(obj.type as any);
      if (attrs?.bar) {
        const tracked = Object.fromEntries(attrs.bar.map(elem => [elem.join("."), elem.join(".")]));
        foundry.utils.mergeObject(context, tracked);
      }
    }
  }
  return foundry.utils.flattenObject(context) as Record<string, string>;
}

export function updatePresetValues(parent: HTMLElement) {
  const container = parent.querySelector(`#pathSelectParent`);
  if (!(container instanceof HTMLElement)) return;

  const uuidElem = parent.querySelector(`[data-role="object-uuid"]`);
  if (!(uuidElem instanceof HTMLInputElement) || !uuidElem.value) return;

  const selectElem = parent.querySelector(`[data-role="path-select"]`)
  if (!(selectElem instanceof HTMLSelectElement)) return;

  const presets = pathPresetSelect(uuidElem.value);

  const entries = Object.entries(presets)
    .sort((a, b) => a[1].localeCompare(b[1]));

  container.style.display = entries.length ? "block" : "none";
  selectElem.innerHTML = "";

  if (entries.length) {
    // Add a blank one
    selectElem.options.add(document.createElement("option"))
    for (const [key, value] of entries) {
      const option = document.createElement("option");
      option.value = key;
      option.innerText = value;
      selectElem.options.add(option);
    }
  }
}

export function setPresetValues(parent: HTMLElement) {
  const presetSelect = parent.querySelector(`#pathPreset`);
  if (presetSelect instanceof HTMLSelectElement) {
    // If empty, return
    if (!presetSelect.value) return;

    const value = parent.querySelector(`#valuePath`);
    const max = parent.querySelector(`#maxPath`);

    if (value instanceof HTMLInputElement) value.value = `${presetSelect.value}.value`;
    if (max instanceof HTMLInputElement) max.value = `${presetSelect.value}.max`;
  }
}

export function setPathSuggestions(parent: HTMLElement, inputSelector: string, listSelector: string, prop: string) {
  const inputElem = parent.querySelector(inputSelector);
  if (!(inputElem instanceof HTMLInputElement)) return;

  const listElem = parent.querySelector(listSelector);
  if (!(listElem instanceof HTMLDataListElement)) return;

  const uuidElem = parent.querySelector(`[data-role="object-uuid"]`)
  if (!(uuidElem instanceof HTMLInputElement) || !uuidElem.value) return;

  const obj = fromUuidSync(uuidElem.value);
  if (!(obj instanceof foundry.abstract.Document)) return;

  listElem.innerHTML = "";

  const keys = Object.keys(foundry.utils.flattenObject(obj));

  // Check for exact match
  if (keys.includes(`system.${inputElem.value}`)) return;

  const filtered = keys
    .filter(key => {
      const parts = key.split(".");
      return key.startsWith(`system.${inputElem.value}`) && parts[parts.length - 1] === prop;
    })
    .sort((a, b) => a.localeCompare(b))
    ;


  for (const key of filtered) {
    const option = document.createElement("option");
    const path = key.split(".").slice(1).join(".");
    option.value = path;
    option.innerText = path;
    listElem.appendChild(option);
  }


}


export function setScopeConfigs(element: HTMLElement, scope?: Scope) {
  if (!scope) {
    const select = element.querySelector(`select[name="scope"]`);
    if (select instanceof HTMLSelectElement) {
      setScopeConfigs(element, select.value as "global" | "scene" | "user" | "temp");
    } else {
      throw new Error();
    }
  } else {
    const nonConfigs = element.querySelectorAll(`[data-scope]:not([data-scope="${scope}"])`) as unknown as HTMLElement[];
    for (const config of nonConfigs) config.style.display = "none";
    const config = element.querySelector(`[data-scope="${scope}"]`);
    if (config instanceof HTMLElement) config.style.display = "block";
  }
}