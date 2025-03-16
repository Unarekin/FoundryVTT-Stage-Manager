import { Action } from "./Action";
import { SerializedSpeakerAlphaAction } from './types';
import { Conversation } from "../Conversation";
import { Speaker } from "conversation/Speaker";
import { InvalidSpeakerTypeError, InvalidStageObjectError } from "errors";
import { ImageStageObject } from "stageobjects";

export class SpeakerAlphaAction extends Action<SerializedSpeakerAlphaAction> {
  public static readonly type = "speakerAlpha";
  public readonly type = SpeakerAlphaAction.type;

  public static readonly version = "1.0.0";
  public readonly version = SpeakerAlphaAction.version;

  public static readonly default: SerializedSpeakerAlphaAction = {
    id: "",
    label: "",
    type: SpeakerAlphaAction.type,
    version: SpeakerAlphaAction.version,
    alpha: 1,
    speaker: ""
  };

  public readonly default = SpeakerAlphaAction.default;
  public duration = this.default.duration;
  public easing = this.default.easing;
  public start = this.default.start;



  validate(conversation: Conversation): boolean {
    return !!conversation.speakers.find(speaker => speaker.id === this.speaker);
  }

  public deserialize(serialized: SerializedSpeakerAlphaAction) {
    super.deserialize(serialized);
    this.alpha = serialized.alpha;
    this.duration = serialized.duration;
    this.easing = serialized.easing;
    this.start = serialized.start;
  }

  public static deserialize(serialized: SerializedSpeakerAlphaAction): SpeakerAlphaAction {
    const obj = new SpeakerAlphaAction(serialized.speaker, serialized.alpha);
    obj.deserialize(serialized);
    return obj;
  }

  public serialize(): SerializedSpeakerAlphaAction {
    return {
      ...super.serialize(),
      alpha: this.alpha,
      duration: this.duration,
      easing: this.easing,
      start: this.start
    }
  }

  public async execute(conversation: Conversation): Promise<void> {
    const speaker = conversation.speakers.find(speaker => speaker.id === this.speaker);
    if (!(speaker instanceof Speaker)) throw new InvalidSpeakerTypeError(this.speaker);
    if (!(speaker.object instanceof ImageStageObject)) throw new InvalidStageObjectError(speaker.object);

    if (typeof this.start === "number") speaker.object.alpha = this.start;
    if (this.duration) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await gsap.to(speaker.object, {
        alpha: this.alpha,
        duration: this.duration / 1000,
        ease: this.easing ?? "none"
      });
    } else {
      speaker.object.alpha = this.alpha;
    }
  }

  constructor(public speaker: string, public alpha: number) {
    super();
  }
}