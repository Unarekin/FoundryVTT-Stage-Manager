import { Conversation } from "conversation/Conversation";
import { Action } from "./Action";
import { SerializedRemoveSpeakerAction } from './types';
import { InvalidSpeakerTypeError, InvalidStageObjectError } from "errors";
import { Speaker } from "conversation/Speaker";
import { ImageStageObject } from "stageobjects";

export class RemoveSpeakerAction extends Action<SerializedRemoveSpeakerAction> {
  public static readonly type = "removeSpeaker";
  public readonly type = RemoveSpeakerAction.type;

  public static readonly version = "1.0.0";
  public readonly version = RemoveSpeakerAction.version;

  public static readonly default: SerializedRemoveSpeakerAction = {
    type: RemoveSpeakerAction.type,
    version: RemoveSpeakerAction.version,
    id: "",
    label: "",
    speaker: ""
  }

  public readonly default = RemoveSpeakerAction.default;

  serialize(): SerializedRemoveSpeakerAction {
    return {
      ...super.serialize(),
      speaker: this.speaker
    }
  }

  public deserialize(serialized: SerializedRemoveSpeakerAction) {
    super.deserialize(serialized);
    this.speaker = serialized.speaker;
  }

  public static deserialize(serialized: SerializedRemoveSpeakerAction): RemoveSpeakerAction {
    const obj = new RemoveSpeakerAction(serialized.speaker);
    obj.deserialize(serialized);
    return obj;
  }

  public validate(conversation: Conversation): boolean {
    if (!conversation.speakers.some(speaker => speaker.id === this.speaker))
      throw new InvalidSpeakerTypeError(this.speaker);
    else
      return true;
  }

  public execute(conversation: Conversation) {
    if (!(conversation.dialogue instanceof ImageStageObject)) throw new InvalidStageObjectError(conversation.dialogue);
    const index = conversation.speakers.findIndex(speaker => speaker.id === this.speaker);
    if (index === -1) throw new InvalidSpeakerTypeError(this.speaker);
    const speaker = conversation.speakers[index];
    if (!(speaker instanceof Speaker)) throw new InvalidSpeakerTypeError(this.speaker);

    if (!(speaker.object instanceof ImageStageObject)) throw new InvalidStageObjectError(speaker.object);


    conversation.speakers.splice(index, 1);
    conversation.dialogue.removeSpeaker(speaker.object);
    speaker.object.destroy();
  }

  constructor(public speaker: string) {
    super();
  }
}