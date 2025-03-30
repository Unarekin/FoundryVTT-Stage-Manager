import { StageManager } from "StageManager";
import { StageLayers, StageLayer } from "types";

function bringToFront(): boolean {
  const tool = game.activeTool as StageLayer;
  if (StageLayers.includes(tool)) {
    if (StageManager.StageObjects.selected.length) {
      // Bring selected objects to the front, but retain their original ordering relative to each other
      StageManager.StageObjects.selected.sort((a, b) => a.zIndex - b.zIndex).forEach(obj => { obj.bringToFront(); });
    }
    return true;
  } else {
    return false;
  }
}

export default bringToFront;
