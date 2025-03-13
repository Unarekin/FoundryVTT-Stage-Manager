import { ActionType, SerializedAction } from "./types";
import { Conversation } from "../Conversation";
import { NotImplementedError } from "../../errors";

export abstract class Action<t extends SerializedAction = SerializedAction> {

  public static readonly type: ActionType = "" as ActionType;
  public static readonly version = "1.0.0";

  public readonly type = Action.type;
  public readonly version = Action.version;

  public static readonly default: SerializedAction = {
    id: "",
    version: "",
    label: "",
    type: "" as ActionType
  }

  public id = foundry.utils.randomID();

  public label = "";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public validate(conversation: Conversation): boolean | Promise<boolean> { return true; }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public prepare(conversation: Conversation): void | Promise<void> { /* empty */ }
  public abstract execute(conversation: Conversation): Promise<void> | void;

  public serialize(): t {
    return {
      id: this.id,
      version: this.version,
      type: this.type,
      label: this.label
    } as t
  }
  public deserialize(serialized: t) {
    this.id = serialized.id;
    this.label = serialized.label;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static deserialize(serialized: SerializedAction): Action<SerializedAction> { throw new NotImplementedError(); }
}