import { StageObject } from "./StageObjects";

export class StageObjectCollection extends Collection<StageObject> {
  public get foreground() { return this.filter(obj => obj.layer === "foreground"); }
  public get background() { return this.filter(obj => obj.layer === "background"); }
}