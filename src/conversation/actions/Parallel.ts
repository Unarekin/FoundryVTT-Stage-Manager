import { deserializeAction } from "conversation/functions";
import { Action } from "./Action";
import { SerializedParallelAction } from './types';
import { Conversation } from "conversation/Conversation";

export class ParallelAction extends Action<SerializedParallelAction> {
  public static readonly type = "parallel";
  public readonly type = ParallelAction.type;

  public static readonly version = "1.0.0";
  public readonly version = ParallelAction.version;

  public static readonly default: SerializedParallelAction = {
    id: "",
    label: "",
    type: ParallelAction.type,
    version: ParallelAction.version,
    actions: []
  }

  public readonly default = ParallelAction.default;

  public serialize(): SerializedParallelAction {
    return {
      ...super.serialize(),
      actions: this.actions.map(action => action.serialize())
    }
  }

  public deserialize(serialized: SerializedParallelAction) {
    super.deserialize(serialized);
    this.actions.splice(0, this.actions.length, ...serialized.actions.map(action => deserializeAction(action)));
  }

  public static deserialize(serialized: SerializedParallelAction): ParallelAction {
    const obj = new ParallelAction();
    obj.deserialize(serialized);
    return obj;
  }

  public async validate(conversation: Conversation): Promise<boolean> {
    await Promise.all(this.actions.map(action => action.validate(conversation)));
    return true;
  }

  public async prepare(conversation: Conversation) {
    await Promise.all(this.actions.map(action => action.prepare(conversation)));
  }

  public async execute(conversation: Conversation) {
    await Promise.all(this.actions.map(action => action.execute(conversation)));
  }

  constructor(public actions: Action[] = []) {
    super();
  }
}