import {StageManager} from "StageManager";

function characterSheet(): boolean {
  if (StageManager.StageObjects.selected.length === 1) {
    void StageManager.EditStageObject(StageManager.StageObjects.selected[0]);
    return true;
  } else {
    return false;
  }
}

export default characterSheet