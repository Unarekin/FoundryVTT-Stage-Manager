import { StageManager } from "StageManager";
import { TOOL_LAYERS } from "types";

function highlight(context: KeyboardManager.KeyboardEventContext): boolean {
  if (!game.activeTool) return false;

  if (Object.keys(TOOL_LAYERS).includes(game.activeTool)) {
    const layer = TOOL_LAYERS[game.activeTool];
    StageManager.StageObjects.inLayer(layer).forEach(obj => { obj.highlighted = !context.up; });
    return true;
  } else {
    return false;
  }
}

export default highlight;
