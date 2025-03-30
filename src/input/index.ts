import { KeyboardEventContext } from "Foundry-VTT/src/foundry/common/types.mjs";
import dismiss from "./dismiss";
import characterSheet from "./characterSheet";
import bringToFront from "./bringToFront";
import sendToBack from "./sendToBack";

export type HandlerFunction = (context: KeyboardEventContext) => boolean | Promise<boolean>;

export const InputHandlers: Record<string, HandlerFunction> = {
  "core.dismiss": dismiss,
  "core.characterSheet": characterSheet,
  "core.bringToFront": bringToFront,
  "core.sendToBack": sendToBack
}