import {StageManager} from "StageManager";

function characterSheet(context: KeyboardManager.KeyboardEventContext): boolean {
  
  if (StageManager.StageObjects.selected.length === 1) {
    if (context.up) return false;
    void StageManager.EditStageObject(StageManager.StageObjects.selected[0]);
    return true;
  } else {
    return false;
  }
}

export default characterSheet