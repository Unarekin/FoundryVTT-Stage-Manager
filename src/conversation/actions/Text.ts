import { Conversation } from "conversation/Conversation";
import { Action } from "./Action";
import { SerializedTextAction } from "./types";
import { DialogueStageObject } from "stageobjects";
import { InvalidStageObjectError } from "errors";
import { durationOfHold } from "functions";

export class TextAction extends Action<SerializedTextAction> {
  public static readonly type = "text";
  public readonly type = TextAction.type;

  public static readonly version = "1.0.0";
  public readonly version = TextAction.version;

  public static readonly default: SerializedTextAction = {
    id: "",
    type: TextAction.type,
    version: TextAction.version,
    label: "",
    text: "",
    wait: 0,
    style: {}
  }

  public readonly default = TextAction.default;

  public serialize(): SerializedTextAction {
    return {
      ...super.serialize(),
      text: this.text,
      style: this.style ?? {},
      wait: this.wait
    }
  }


  public deserialize(serialized: SerializedTextAction) {
    super.deserialize(serialized);
    this.text = serialized.text;
    this.style = serialized.style;
    this.wait = serialized.wait;
  }

  public static deserialize(serialized: SerializedTextAction): TextAction {
    const obj = new TextAction(serialized.text);
    obj.deserialize(serialized);
    return obj;
  }

  public async execute(conversation: Conversation): Promise<void> {
    if (!(conversation.dialogue instanceof DialogueStageObject)) throw new InvalidStageObjectError(conversation.dialogue);

    conversation.dialogue.text = this.text;
    if (this.style) foundry.utils.mergeObject(conversation.dialogue.textStyle, this.style);
    const waitTime = this.wait ? this.wait : durationOfHold(this.text);

    await new Promise(resolve => { setTimeout(resolve, waitTime * 1000); });
  }

  constructor(public text: string, public style: Record<string, unknown> = {}, public wait = 0) {
    super();
  }
}