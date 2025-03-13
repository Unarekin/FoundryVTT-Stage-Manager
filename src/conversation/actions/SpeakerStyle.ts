import { InvalidSpeakerTypeError, InvalidStageObjectError } from "../../errors";
import { ImageStageObject } from "../../stageobjects";
import { Conversation } from "../Conversation";
import { Speaker } from "../Speaker";
import { Action } from "./Action";
import { SerializedSpeakerStyleAction } from './types';

export class SpeakerStyleAction extends Action<SerializedSpeakerStyleAction> {
  public static readonly type = "speakerStyle";
  public readonly type = SpeakerStyleAction.type;

  public static readonly version = "1.0.0";
  public readonly version = SpeakerStyleAction.version;

  public static readonly default: SerializedSpeakerStyleAction = {
    id: "",
    label: "",
    type: SpeakerStyleAction.type,
    version: SpeakerStyleAction.version,
    textStyle: {},
    labelStyle: {},
    speaker: ""
  };

  public readonly default = SpeakerStyleAction.default;


  serialize(): SerializedSpeakerStyleAction {
    return {
      ...super.serialize(),
      textStyle: this.textStyle,
      labelStyle: this.labelStyle,
      speaker: this.speaker
    }
  }

  public deserialize(serialized: SerializedSpeakerStyleAction) {
    super.deserialize(serialized);
    this.speaker = serialized.speaker;
    this.textStyle = serialized.textStyle;
    this.labelStyle = serialized.labelStyle
  }

  public static deserialize(serialized: SerializedSpeakerStyleAction): SpeakerStyleAction {
    const obj = new SpeakerStyleAction(serialized.speaker);
    obj.deserialize(serialized);
    return obj;
  }

  public validate(conversation: Conversation): boolean {
    return !!conversation.speakers.find(speaker => speaker.id === this.speaker);
  }

  public execute(conversation: Conversation) {
    const speaker = conversation.speakers.find(speaker => speaker.id === this.speaker);
    if (!(speaker instanceof Speaker)) throw new InvalidSpeakerTypeError(this.speaker);
    if (!(speaker.object instanceof ImageStageObject)) throw new InvalidStageObjectError(speaker.object);

    speaker._textStyle = this.textStyle;
    speaker._labelStyle = this.labelStyle;
  }

  constructor(public speaker: string, public textStyle: Record<string, unknown> = {}, public labelStyle: Record<string, unknown> = {}) {
    super();
  }

}