import { StageManager } from "StageManager"
import { StageManagerControlsLayer } from "ControlButtonsHandler";


function paste(context: KeyboardEventContext): boolean {
  if (!canvas) return false;
  if (!context.up && canvas.activeLayer instanceof StageManagerControlsLayer && StageManager.CopiedObjects.length && StageManager.canAddStageObjects(game.user?.id ?? "")) {
    const pos = new PIXI.Point();
    // Apply inverse world transform to get to screen space
    canvas.app?.stage.localTransform.clone().invert().applyInverse(canvas.mousePosition, pos);

    StageManager.PasteObjects(pos);
    return true;
  } else {
    return false;
  }
}

export default paste;
