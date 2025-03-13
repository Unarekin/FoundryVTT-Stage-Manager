import { Conversation } from "conversation/Conversation";
import { Action } from "./Action";
import { SerializedConversationStyleAction } from './types';
import { DialogueStageObject } from "stageobjects";
import { InvalidStageObjectError } from "errors";

export class ConversationStyleAction extends Action<SerializedConversationStyleAction> {
  public static readonly type = "conversationStyle";
  public readonly type = ConversationStyleAction.type;

  public static readonly version = "1.0.0";
  public readonly version = ConversationStyleAction.version;

  public static readonly default: SerializedConversationStyleAction = {
    id: "",
    label: "",
    version: ConversationStyleAction.version,
    type: ConversationStyleAction.type,
    labelStyle: {},
    textStyle: {}
  };

  public readonly default = ConversationStyleAction.default;


  serialize(): SerializedConversationStyleAction {
    return {
      ...super.serialize(),
      labelStyle: this.labelStyle,
      textStyle: this.textStyle
    };
  }

  public deserialize(serialized: SerializedConversationStyleAction) {
    super.deserialize(serialized);
    this.labelStyle = serialized.labelStyle;
    this.textStyle = serialized.textStyle;
  }

  public static deserialize(serialized: SerializedConversationStyleAction): ConversationStyleAction {
    const obj = new ConversationStyleAction(serialized.textStyle, serialized.labelStyle);
    obj.deserialize(serialized);
    return obj;
  }

  public execute(conversation: Conversation) {
    if (!(conversation.dialogue instanceof DialogueStageObject)) throw new InvalidStageObjectError(conversation.dialogue);
    if (this.textStyle) {
      foundry.utils.mergeObject(conversation.dialogue.textStyle, this.textStyle);
    }
    if (this.labelStyle) {
      foundry.utils.mergeObject(conversation.dialogue.labelStyle, this.labelStyle);
    }
  }


  constructor(public textStyle: Record<string, unknown> = {}, public labelStyle: Record<string, unknown> = {}) {
    super();
  }
}