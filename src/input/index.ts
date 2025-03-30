import { KeyboardEventContext } from "Foundry-VTT/src/foundry/common/types.mjs";
import dismiss from "./dismiss";

export type HandlerFunction = (context: KeyboardEventContext) => boolean | Promise<boolean>;

export const InputHandlers: Record<string, HandlerFunction> = {
  "core.dismiss": dismiss
}