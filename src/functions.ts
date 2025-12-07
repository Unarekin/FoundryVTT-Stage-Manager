import { LocalizedError } from "errors";
import { StageLayer } from "types";

export async function awaitHook(hook: string): Promise<any[]> {
  return new Promise(resolve => {
    Hooks.once(hook as Hooks.HookName, (...args: unknown[]) => { resolve(args); })
  })
}

export function serializeStyle(style: PIXI.TextStyle): Record<string, unknown> {
  const serialized = JSON.parse(JSON.stringify(style)) as Record<string, unknown>;
  for (const key in style) {
    if (key.startsWith("_")) {
      serialized[key.substring(1)] = serialized[key];
      delete serialized[key];
    }
  }
  return serialized;
}

export async function placeStageObject(ghost: PIXI.DisplayObject, layer: StageLayer): Promise<{ x: number, y: number } | undefined> {
  if (!game?.StageManager || !canvas?.stage) throw new LocalizedError("STAGEMANAGERNOTINITIALIZED");

  return new Promise<{ x: number, y: number } | undefined>((resolve) => {
    const group = game.StageManager.layers[layer];
    if (!group) throw new LocalizedError("STAGEMANAGERNOTINITIALIZED");

    group.addChild(ghost);

    function pointerUp(e: PIXI.FederatedPointerEvent) {
      canvas?.stage?.off("pointerup", pointerUp);
      canvas?.stage?.off("pointermove", pointerMove);
      canvas?.stage?.off("pointercancel", pointerCancel);
      resolve({ x: e.clientX, y: e.clientY });
    }

    function pointerMove(e: PIXI.FederatedPointerEvent) {
      ghost.x = e.clientX;
      ghost.y = e.clientY;
    }

    function pointerCancel() {
      canvas?.stage?.off("pointerup", pointerUp);
      canvas?.stage?.off("pointermove", pointerMove);
      canvas?.stage?.off("pointercancel", pointerCancel);
      resolve(undefined);
    }

    canvas?.stage?.once("pointerup", pointerUp);
    canvas?.stage?.once("pointercancel", pointerCancel);
    canvas?.stage?.on("pointermove", pointerMove);


  })
}