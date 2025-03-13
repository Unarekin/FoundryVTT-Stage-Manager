import { DialogueStageObject } from "stageobjects";
import { Action } from "./Action";
import { SerializedLabelAction } from './types';
import { InvalidStageObjectError } from "errors";
import { Conversation } from "conversation/Conversation";

export class LabelAction extends Action<SerializedLabelAction> {
  public static readonly type = "label";
  public readonly type = LabelAction.type;

  public static readonly version = "1.0.0";
  public readonly version = LabelAction.version;

  public static readonly default: SerializedLabelAction = {
    id: "",
    label: "",
    type: LabelAction.type,
    version: LabelAction.version,
    text: "",
    style: {}
  };

  public readonly default = LabelAction.default;

  public serialize(): SerializedLabelAction {
    return {
      ...super.serialize(),
      text: this.text,
      style: this.style
    }
  }

  public deserialize(serialized: SerializedLabelAction) {
    super.deserialize(serialized);
    this.text = serialized.text;
    this.style = serialized.style;
  }

  public static deserialize(serialized: SerializedLabelAction): LabelAction {
    const obj = new LabelAction(serialized.text);
    obj.deserialize(serialized);
    return obj;
  }

  public execute(conversation: Conversation) {
    if (!(conversation.dialogue instanceof DialogueStageObject)) throw new InvalidStageObjectError(conversation.dialogue);
    conversation.dialogue.label = this.text;
    if (this.style)
      foundry.utils.mergeObject(conversation.dialogue.labelStyle, this.style);
  }

  constructor(public text: string, public style: Record<string, unknown> = {}) {
    super();
  }

}