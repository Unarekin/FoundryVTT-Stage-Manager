import { PermissionDeniedError } from "errors";
import { logError } from "logging";
import { StageManager } from "StageManager";

function characterSheet(context: KeyboardEventContext): boolean {

  if (StageManager.StageObjects.selected.length === 1) {
    if (context.up) return false;
    if (StageManager.StageObjects.selected[0].canUserModify(game.user as User, "modify"))
      void StageManager.EditStageObject(StageManager.StageObjects.selected[0]);
    else
      logError(new PermissionDeniedError());
    return true;
  } else {
    return false;
  }
}

export default characterSheet