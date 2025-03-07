import { InvalidSpeakerTypeError } from "../../errors";
import { ImageStageObject } from "../../stageobjects";
import { Conversation } from "../Conversation";
import { coerceSpeakerObject, getSpeakerImage, isValidSpeaker } from "../functions";
import { Action } from "./Action";
import { SerializedAddSpeakerAction, SpeakerAnimation } from "./types";

export class AddSpeakerAction extends Action<SerializedAddSpeakerAction> {
  public static readonly type = "addSpeaker";
  public readonly type = AddSpeakerAction.type;

  public static readonly version = "1.0.0";
  public readonly version = AddSpeakerAction.version;

  public static readonly default: SerializedAddSpeakerAction = {
    id: "",
    speaker: "",
    label: "",
    animation: "none",
    duration: 500,
    version: AddSpeakerAction.version,
    type: AddSpeakerAction.type
  };

  public readonly default = AddSpeakerAction.default;


  public speaker = this.default.speaker;
  public duration = this.default.duration;
  public animation = this.default.animation;

  public static deserialize(serialized: SerializedAddSpeakerAction, conversation: Conversation): AddSpeakerAction {
    const obj = new AddSpeakerAction(conversation, serialized.speaker);
    obj.deserialize(serialized, conversation);
    return obj;
  }

  public deserialize(serialized: SerializedAddSpeakerAction, conversation: Conversation) {
    super.deserialize(serialized, conversation);
    this.speaker = serialized.speaker;
    this.duration = serialized.duration;
    this.animation = serialized.animation;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public validate(conversation: Conversation): boolean | Error {
    if (isValidSpeaker(this.speaker)) return true;
    else return new InvalidSpeakerTypeError(this.speaker);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async prepare(conversation: Conversation): Promise<Error | void> {
    // Preload texture
    const img = getSpeakerImage(this.speaker);
    if (!img) return new InvalidSpeakerTypeError(img);

    const texture = PIXI.Texture.from(img);
    if (!texture.valid) {
      return new Promise(resolve => {
        texture.baseTexture.once("loaded", () => { resolve(); });
      });
    }
  }

  public async execute(conversation: Conversation): Promise<void> {
    const speaker = coerceSpeakerObject(this.speaker);
    if (!(speaker instanceof ImageStageObject)) throw new InvalidSpeakerTypeError(this.speaker);

    conversation.object.addSpeaker(speaker);

    if (this.duration) {

    } else {

    }

  }

  constructor(conversation: Conversation, speaker: string, animation?: SpeakerAnimation, duration = 500) {
    super(conversation);
    this.speaker = speaker;
    if (animation) this.animation = animation;
    if (typeof duration === "number") this.duration = duration;
  }
}