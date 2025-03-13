import { PositionCoordinate } from "types";
import { Action } from "./Action";
import { SerializedSpeakerScaleAction } from './types';
import { Conversation } from "../Conversation";
import { InvalidSpeakerTypeError, InvalidStageObjectError } from "errors";
import { ImageStageObject } from "stageobjects";
import { Speaker } from "../Speaker";
import { parsePositionCoordinate } from "functions";

export class SpeakerScaleAction extends Action<SerializedSpeakerScaleAction> {
  public static readonly type = "speakerScale";
  public readonly type = SpeakerScaleAction.type;

  public static readonly version = "1.0.0";
  public readonly version = SpeakerScaleAction.version;

  public static readonly default: SerializedSpeakerScaleAction = {
    id: "",
    speaker: "",
    label: "",
    type: SpeakerScaleAction.type,
    version: SpeakerScaleAction.version,
    x: 1,
    y: 1,
    easing: "none"
  }

  public readonly default = SpeakerScaleAction.default;


  public duration = this.default.duration;
  public easing = this.default.easing;
  public start = this.default.start;
  public anchor = this.default.anchor;

  public serialize(): SerializedSpeakerScaleAction {
    return {
      ...super.serialize(),
      x: this.x,
      y: this.y,
      duration: this.duration,
      easing: this.easing,
      start: this.start,
      anchor: this.anchor
    }
  }

  public deserialize(serialized: SerializedSpeakerScaleAction) {
    super.deserialize(serialized);
    this.x = serialized.x;
    this.y = serialized.y;
    this.duration = serialized.duration;
    this.easing = serialized.easing;
    this.start = serialized.start;
    this.anchor = serialized.anchor;
  }

  public static deserialize(serialized: SerializedSpeakerScaleAction): SpeakerScaleAction {
    const obj = new SpeakerScaleAction(serialized.speaker, serialized.x, serialized.y);
    obj.deserialize(serialized);
    return obj;
  }

  public validate(conversation: Conversation): boolean {
    return !!conversation.speakers.find(speaker => speaker.id === this.speaker);
  }

  public async execute(conversation: Conversation): Promise<void> {
    const speaker = conversation.speakers.find(speaker => speaker.id === this.speaker);
    if (!(speaker instanceof Speaker)) throw new InvalidSpeakerTypeError(this.speaker);
    if (!(speaker.object instanceof ImageStageObject)) throw new InvalidStageObjectError(speaker.object);

    if (typeof this.start?.x !== "undefined") speaker.object.scale.x = parsePositionCoordinate(this.start.x, speaker.object);
    if (typeof this.start?.y !== "undefined") speaker.object.scale.y = parsePositionCoordinate(this.start.y, speaker.object);

    if (this.duration) {
      await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        gsap.to(speaker.object, {
          ...(typeof this.x !== "undefined" ? { x: parsePositionCoordinate(this.x, speaker.object) } : {}),
          ...(typeof this.y !== "undefined" ? { y: parsePositionCoordinate(this.y, speaker.object) } : {}),
          duration: this.duration / 1000,
          ease: this.easing ?? "none"
        }),
        ...(typeof this.anchor !== "undefined" ? [
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          gsap.to(speaker.object.anchor, {
            ...(typeof this.anchor.x !== "undefined" ? { x: parsePositionCoordinate(this.anchor.x, speaker.object) } : {}),
            ...(typeof this.anchor.y !== "undefined" ? { y: parsePositionCoordinate(this.anchor.y, speaker.object) } : {}),
            duration: this.duration / 1000,
            ease: this.easing ?? "none"
          }) as Promise<void>
        ] : [])
      ])
    } else {
      if (typeof this.x !== "undefined") speaker.object.scale.x = parsePositionCoordinate(this.x, speaker.object);
      if (typeof this.y !== "undefined") speaker.object.scale.y = parsePositionCoordinate(this.y, speaker.object);
      if (typeof this.anchor?.x !== "undefined") speaker.object.anchor.x = parsePositionCoordinate(this.anchor.x, speaker.object);
      if (typeof this.anchor?.y !== "undefined") speaker.object.anchor.y = parsePositionCoordinate(this.anchor.y, speaker.object);
    }

  }

  constructor(public speaker: string, public x: PositionCoordinate | undefined = 1, public y: PositionCoordinate | undefined = 1) {
    super();
  }
}