import { StageManagerControlsLayer } from "ControlButtonsHandler";
import { StageManager } from "StageManager";

function deleteHandler(): boolean {
  if (ui.hotbar?._hover) return false;

  if (canvas?.activeLayer instanceof StageManagerControlsLayer && StageManager.StageObjects.selected.length) {
    StageManager.StageObjects.selected.forEach(obj => {
      if (StageManager.canDeleteStageObject(game.user?.id ?? "", obj.id))
        obj.destroy();
    });
    return true;
  } else {
    return false;
  }
}

export default deleteHandler;