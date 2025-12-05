import { StageObjectCollection } from "StageObjectCollection";

export class ScreenSpaceCanvasGroup extends foundry.canvas.groups.CanvasGroupMixin(foundry.canvas.containers.UnboundContainer) {
  public readonly stageObjects = new StageObjectCollection();
}