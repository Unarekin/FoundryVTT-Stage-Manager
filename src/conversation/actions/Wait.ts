import { Action } from "./Action";
import { Conversation } from "../Conversation";
import { SerializedWaitAction } from "./types";

export class WaitAction extends Action<SerializedWaitAction> {
  public static readonly type = "wait";
  public readonly type = WaitAction.type;

  public static readonly version = "1.0.0";
  public readonly version = WaitAction.version;

  public static readonly default: SerializedWaitAction = {
    id: "",
    label: "",
    type: WaitAction.type,
    version: WaitAction.version,
    duration: 0
  }

  public readonly default = WaitAction.default;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async execute(conversation: Conversation) {
    await new Promise(resolve => { setTimeout(resolve, this.duration); });
  }

  public serialize(): SerializedWaitAction {
    return {
      ...super.serialize(),
      duration: this.duration
    }
  }

  public deserialize(serialized: SerializedWaitAction) {
    super.deserialize(serialized);
    this.duration = serialized.duration;
  }

  public static deserialize(serialized: SerializedWaitAction): WaitAction {
    const obj = new WaitAction(serialized.duration);
    obj.deserialize(serialized);
    return obj;
  }

  constructor(public duration: number) {
    super();
  }
}