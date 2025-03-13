import { Conversation } from "../Conversation";
import { PositionCoordinate } from "types";
import { Action } from "./Action";
import { SerializedSpeakerPositionAction } from "./types";
import { InvalidSpeakerTypeError, InvalidStageObjectError } from "errors";
import { Speaker } from "conversation/Speaker";
import { parsePositionCoordinate } from "functions";
import { ImageStageObject } from "stageobjects";

export class SpeakerPositionAction extends Action<SerializedSpeakerPositionAction> {
  public static readonly type = "speakerPosition";
  public readonly type = SpeakerPositionAction.type;

  public static readonly version = "1.0.0";
  public readonly version = SpeakerPositionAction.version;

  public static readonly default: SerializedSpeakerPositionAction = {
    id: "",
    type: SpeakerPositionAction.type,
    version: SpeakerPositionAction.version,
    label: "",
    speaker: "",
    end: {}
  }

  public readonly default = SpeakerPositionAction.default;

  public end = this.default.end;
  public start = this.default.start;

  public duration = this.default.duration;
  public easing = this.default.easing;

  public serialize(): SerializedSpeakerPositionAction {
    return {
      ...super.serialize(),
      speaker: this.speaker,
      start: this.start,
      end: this.end,
      duration: this.duration
    }
  }

  public deserialize(serialized: SerializedSpeakerPositionAction) {
    super.deserialize(serialized);
    this.start = serialized.start;
    this.end = serialized.end;
    this.speaker = serialized.speaker;
    this.duration = serialized.duration;
  }

  public static deserialize(serialized: SerializedSpeakerPositionAction): SpeakerPositionAction {
    const obj = new SpeakerPositionAction(serialized.speaker, serialized.end);
    obj.deserialize(serialized);
    return obj;
  }

  validate(conversation: Conversation): boolean {
    return !!conversation.speakers.find(speaker => speaker.id === this.speaker);
  }

  public async execute(conversation: Conversation): Promise<void> {
    const speaker = conversation.speakers.find(speaker => speaker.id === this.speaker);
    if (!(speaker instanceof Speaker)) throw new InvalidSpeakerTypeError(this.speaker);
    if (!(speaker.object instanceof ImageStageObject)) throw new InvalidStageObjectError(speaker.object);

    const slot = conversation.speakerSlotPosition(speaker);

    const parseContext = {
      panelHeight: conversation.dialogue?.panel.height ?? 0,
      slotX: parsePositionCoordinate(slot.x, speaker.object),
      slotY: parsePositionCoordinate(slot.y, speaker.object),
      slotZ: parsePositionCoordinate(slot.z, speaker.object)
    };

    if (typeof this.start?.x !== "undefined") speaker.object.x = parsePositionCoordinate(this.start.x, speaker.object, parseContext);
    if (typeof this.start?.y !== "undefined") speaker.object.y = parsePositionCoordinate(this.start.y, speaker.object, parseContext);

    if (this.duration) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await gsap.to(speaker.object, {
        ...(typeof this.end.x !== "undefined" ? { x: parsePositionCoordinate(this.end.x, speaker.object, parseContext) } : { x: parseContext.slotX }),
        ...(typeof this.end.y !== "undefined" ? { y: parsePositionCoordinate(this.end.y, speaker.object, parseContext) } : { y: parseContext.slotY }),
        zIndex: parseContext.slotZ,
        duration: this.duration / 1000,
        ease: this.easing ?? "none"
      });
    } else {
      if (typeof this.end.x !== "undefined") speaker.object.x = parsePositionCoordinate(this.end.x, speaker.object, parseContext);
      if (typeof this.end.y !== "undefined") speaker.object.y = parsePositionCoordinate(this.end.y, speaker.object, parseContext);
    }

  }

  constructor(public speaker: string, pos: { x?: PositionCoordinate, y?: PositionCoordinate }, start?: { x?: PositionCoordinate, y?: PositionCoordinate }) {
    super();
    this.end = pos;
    this.start = start;
  }
}