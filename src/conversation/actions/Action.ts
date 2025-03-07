import { NotImplementedError } from "errors";
import { Conversation } from "../Conversation";
import { ActionType, SerializedAction } from './types';

export abstract class Action<t extends SerializedAction = SerializedAction> {
  public static type = "";
  public abstract readonly type: string;

  public static version = "";
  public abstract readonly version: string;

  public static default: SerializedAction = {
    id: "",
    type: "" as ActionType,
    version: "",
    label: ""
  };

  private _id: string = foundry.utils.randomID();
  public get id() { return this._id; }
  protected set id(id) { this._id = id; }

  private _label = "";
  public get label() { return this._label; }
  protected set label(val) { this._label = val; }

  public abstract readonly default: SerializedAction;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public validate(conversation: Conversation): boolean | Error | Promise<boolean | Error> { return true; }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public prepare(conversation: Conversation): void | Error | Promise<Error | void> { return; }

  public serialize(): t {
    return {
      id: this.id,
      type: this.type,
      version: this.version,
      label: this.label
    } as t;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static deserialize(serialized: SerializedAction, conversation: Conversation): Action { throw new NotImplementedError(); }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public deserialize(serialized: t, conversation: Conversation) {
    this.id = serialized.id;
    this.label = serialized.label;
  }

  public abstract execute(conversation: Conversation): void | Promise<void>;

  public conversation() { return this._conversation; }

  constructor(private _conversation: Conversation) {

  }
}