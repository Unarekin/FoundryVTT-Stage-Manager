import { StageManager } from "StageManager";
import { StageManagerControlsLayer } from "ControlButtonsHandler";
import { localize } from "functions";

function copy(context: KeyboardManager.KeyboardEventContext): boolean {
  // If we have selected text, bail
  if (window.getSelection()?.toString() !== "") return false;
  if (!context.up && canvas && canvas.activeLayer instanceof StageManagerControlsLayer && StageManager.StageObjects.selected.length) {
    const copied = StageManager.CopyObjects(StageManager.StageObjects.selected);
    
    ui.notifications?.info(localize("CONTROLS.CopiedObjects", {
      count: copied.length.toString(),
      type: localize("STAGEMANAGER.STAGEOBJECT")
    }));
    return true;
  } else {
    return false;
  }

}

export default copy;