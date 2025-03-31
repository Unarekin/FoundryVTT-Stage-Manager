import { KeyboardEventContext } from "Foundry-VTT/src/foundry/common/types.mjs";
import dismiss from "./dismiss";
import characterSheet from "./characterSheet";
import highlight from "./highlight";
import deleteHandler from "./delete";
import copy from "./copy";
import paste from "./paste";
import { moveUp, moveDown, moveLeft, moveRight, moveUpLeft, moveUpRight, moveDownLeft, moveDownRight} from "./movement"

export type HandlerFunction = (context: KeyboardEventContext) => boolean | Promise<boolean>;

export const InputHandlers: Record<string, HandlerFunction> = {
  "core.dismiss": dismiss,
  "core.characterSheet": characterSheet,
  "core.highlight": highlight,
  "core.delete": deleteHandler,
  "core.copy": copy,
  "core.paste": paste,
  "core.panUp": moveUp,
  "core.panDown": moveDown,
  "core.panLeft": moveLeft,
  "core.panRight": moveRight,
  "core.panUpLeft": moveUpLeft,
  "core.panUpRight": moveUpRight,
  "core.panDownLeft": moveDownLeft,
  "core.panDownRight": moveDownRight
}