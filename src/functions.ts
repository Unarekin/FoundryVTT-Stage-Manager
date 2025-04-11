import { PositionCoordinate } from "types";
import { StageManager } from "./StageManager";
import { StageObject } from "stageobjects";
import math from "vendor/math";
import { CanvasNotInitializedError, InvalidExpressionError } from "errors";

export function localize(key: string, subs?: Record<string, string>): string {
  if (game?.i18n) return game.i18n.format(key, subs);
  else return key;
}

const CONTEXT_MENUS: ContextMenu[] = [];

export function registerContextMenu(menu: ContextMenu) {
  CONTEXT_MENUS.push(menu);
  const origClose = menu.onClose;
  menu.onClose = (target) => {
    if (CONTEXT_MENUS.includes(menu)) CONTEXT_MENUS.splice(CONTEXT_MENUS.indexOf(menu), 1);
    if (origClose) origClose(target);
  }
}

export function isColor(data: string): boolean {
  return CSS.supports("color", data);
}


export async function closeAllContextMenus(options?: ContextMenu.CloseOptions) {
  const menus = [...CONTEXT_MENUS];
  for (const menu of menus) {
    await menu.close(options);
    if (CONTEXT_MENUS.includes(menu)) CONTEXT_MENUS.splice(CONTEXT_MENUS.indexOf(menu), 1);
  }
}

/**
 * Determines if a given value matches a bit flag
 * @param {number} value - The value to check
 * @param {number} flag - The bit flag
 * @returns 
 */
export function hasFlag(value: number, flag: number): boolean {
  return (value & flag) === flag;
}

export function parsePositionCoordinates(coord: { x: PositionCoordinate, y: PositionCoordinate, z: PositionCoordinate }, stageObject: StageObject, context?: Record<string, number>): { x: number, y: number, z: number }
export function parsePositionCoordinates(coord: { x: PositionCoordinate, y: PositionCoordinate, z: PositionCoordinate }, context?: Record<string, number>): { x: number, y: number, z: number }
export function parsePositionCoordinates(coord: { x: PositionCoordinate, y: PositionCoordinate, z: PositionCoordinate }, ...args: unknown[]): { x: number, y: number, z: number } {
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    x: parsePositionCoordinate(coord.x, ...args as any[]),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    y: parsePositionCoordinate(coord.y, ...args as any[]),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    z: parsePositionCoordinate(coord.z, ...args as any[])
  };
}

export function parsePositionCoordinate(coord: PositionCoordinate, stageObject: StageObject, context?: Record<string, number>): number
export function parsePositionCoordinate(coord: PositionCoordinate, context?: Record<string, unknown>): number
export function parsePositionCoordinate(coord: PositionCoordinate, ...args: unknown[]): number {
  if (typeof coord === "number" && isNaN(coord)) throw new InvalidExpressionError(coord);
  if (typeof coord === "undefined" || coord === null) throw new InvalidExpressionError(coord);

  const context = {
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    visualWidth: StageManager.VisualBounds.width,
    visualHeight: StageManager.VisualBounds.height,
    visualX: StageManager.VisualBounds.left,
    visualY: StageManager.VisualBounds.top
  }

  if (args[0] instanceof StageObject) {
    foundry.utils.mergeObject(context, {
      x: args[0].x,
      y: args[0].y,
      width: args[0].width,
      height: args[0].height
    });
  }

  if (!(args[args.length - 1] instanceof StageObject)) {
    foundry.utils.mergeObject(context, args[args.length - 1] as Record<string, unknown>);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  return math.evaluate(typeof coord === "number" ? `${coord}` : coord, context) as number;
}


/**
 * Calculates the center of mass of a given {@link ImageData}
 * @param imageData 
 */
export function imageCenterOfMass(imageData: ImageData): { x: number, y: number } | undefined {
  const { data, width, height } = imageData;

  let total = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3] / 255;
      const weight = alpha;

      total += weight;
      sumX += x * weight;
      sumY += y * weight;
    }
  }

  if (total === 0) return;
  return {
    x: sumX / total,
    y: sumY / total
  }
}

/**
 * Calculates the center of mass of a given {@link PIXI.Texture}}
 */
export function textureCenterOfMass(texture: PIXI.Texture): { x: number, y: number } | undefined {
  if (!(canvas?.app?.renderer)) throw new CanvasNotInitializedError();

  const rt = PIXI.RenderTexture.create({ width: texture.width, height: texture.height });
  const pixels = Uint8Array.from(canvas.app.renderer.extract.pixels(rt));
  const allPixels = pixels.reduce((curr, prev) => prev + curr);

  if (allPixels === 0) {
    console.warn(`Unable to extract pixel data`, texture);
  }

  const { width, height } = rt;

  let total = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = pixels[index + 3] / 255;
      const weight = alpha;

      total += weight;
      sumX += x * weight;
      sumY += y * weight;
    }
  }

  if (total === 0) return;

  return {
    x: sumX / total,
    y: sumY / total
  };
}


export function awaitFrame(): Promise<void> {
  return new Promise(resolve => { requestAnimationFrame(() => { resolve(); }); });
}

export function durationOfHold(text: string): number {
  const words = text.split(/\W/).filter(char => !!char);
  return (.2 * words.length) + (words.length >= 10 ? 3 : 2);
}

export async function inputPrompt(content: string, title?: string): Promise<string | undefined> {
  const input = await foundry.applications.api.DialogV2.wait({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    window: ({ title: localize(title ?? "") } as any),
    content: localize(content),
    rejectClose: false,
    buttons: [
      {
        icon: `<i class="fas fa-check"></i>`,
        label: localize("Confirm"),
        action: "confirm",
        callback: (e, button, dialog) => {
          const input = dialog.querySelector("#text");
          if (!(input instanceof HTMLInputElement)) return Promise.resolve();
          return Promise.resolve(input.value);
        }
      },
      {
        icon: `<I class="fas fa-times"></i>`,
        label: localize("Cancel"),
        action: "cancel"
      }
    ]
  });
  if (input === "cancel" || !input || input === "confirm") return undefined;
  else return input;
}

export async function confirm(title: string, content: string) {
  return foundry.applications.api.DialogV2.confirm({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    window: ({ title } as any),
    content,
    rejectOnClose: false
  });
}

export function serializeTextStyle(style: PIXI.HTMLTextStyle): Record<string, unknown> {
  const serialized = JSON.parse(JSON.stringify(style)) as Record<string, unknown>;
  const keys = Object.keys(serialized).filter(key => key.startsWith("_"));
  for (const key of keys) {
    serialized[key.substring(1)] = serialized[key];
    delete serialized[key];
  }
  return serialized;
}

export function getStyleDiff(style: PIXI.HTMLTextStyle): Record<string, unknown> {
  const serialized = serializeTextStyle(style);
  const defaultStyle = serializeTextStyle(PIXI.HTMLTextStyle.defaultStyle as unknown as PIXI.HTMLTextStyle);
  const diffed = foundry.utils.diffObject(defaultStyle, serialized) as Record<string, unknown>;
  delete diffed.styleID;
  return diffed;
}