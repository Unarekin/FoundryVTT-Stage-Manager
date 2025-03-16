import { Action } from "./Action";
import { Conversation } from "../Conversation";
import { SerializedAddSpeakerAction } from "./types";
import { coerceSpeakerObject, isValidSpeaker } from "../functions";
import { InvalidSpeakerTypeError, InvalidStageObjectError } from "errors";
import { Speaker } from "../Speaker";
import { DialogueStageObject, ImageStageObject } from "stageobjects";

export class AddSpeakerAction extends Action<SerializedAddSpeakerAction> {
  public static readonly type = "addSpeaker";
  public readonly type = AddSpeakerAction.type;

  public static readonly version = "1.0.0";
  public readonly version = AddSpeakerAction.version;

  public static readonly default: SerializedAddSpeakerAction = {
    id: "",
    label: "",
    type: AddSpeakerAction.type,
    version: AddSpeakerAction.version,
    speaker: ""
  };

  public readonly default = AddSpeakerAction.default;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public validate(conversation: Conversation): boolean {
    return isValidSpeaker(this.speaker);
  }

  public async prepare(conversation: Conversation): Promise<void> {
    // Manifest the object
    const speaker = conversation.speakers.find(speaker => speaker.id === this.speaker);
    if (!(speaker instanceof Speaker)) throw new InvalidSpeakerTypeError(this.speaker);
    speaker.object = coerceSpeakerObject(speaker.speaker);
    if (!(speaker.object instanceof ImageStageObject)) throw new InvalidSpeakerTypeError(this.speaker);
    if (!speaker.object.texture.valid) {
      await speaker.object.textureLoaded();
    }
  }

  public execute(conversation: Conversation) {
    if (!(conversation.dialogue instanceof DialogueStageObject)) throw new InvalidStageObjectError(conversation.dialogue);
    const speaker = conversation.speakers.find(speaker => speaker.id === this.speaker);
    if (!speaker) throw new InvalidSpeakerTypeError(this.speaker);
    if (!(speaker.object instanceof ImageStageObject)) throw new InvalidStageObjectError(speaker.object);

    conversation.dialogue.addSpeaker(speaker.object);
  }

  public serialize(): SerializedAddSpeakerAction {
    return {
      ...super.serialize(),
      speaker: this.speaker
    }
  }

  public deserialize(serialized: SerializedAddSpeakerAction) {
    super.deserialize(serialized);
    this.speaker = serialized.speaker;
  }

  public static deserialize(serialized: SerializedAddSpeakerAction): AddSpeakerAction {
    const obj = new AddSpeakerAction(serialized.speaker);
    obj.deserialize(serialized);
    return obj;
  }

  constructor(public speaker: string) {
    super();
  }
}