import { ImageStageObject } from "stageobjects";
import { Conversation } from "./Conversation";
import { Easing, PositionCoordinate } from "types";
import { SerializedSpeaker } from "./types";
import { LabelAction, RemoveSpeakerAction, SpeakerAlphaAction, SpeakerPositionAction, SpeakerScaleAction, SpeakerStyleAction, TextAction, WaitAction } from "./actions";
import { SpeakerSet } from "./SpeakerSet";

export class Speaker {
  public readonly id = foundry.utils.randomID();
  public readonly version = "1.0.0";

  public speaker = "";

  public _textStyle: Record<string, unknown> = {};
  public _labelStyle: Record<string, unknown> = {};

  public _name = "";

  public object: ImageStageObject | undefined = undefined;

  public x(x: number): this {
    this.conversation.queue.push(new SpeakerPositionAction(this.id, { x }));
    return this;
  }

  public y(y: number): this {
    this.conversation.queue.push(new SpeakerPositionAction(this.id, { y }));
    return this;
  }

  public getSpeaker(id: string): Speaker | undefined
  public getSpeaker(uuid: string): Speaker | undefined
  public getSpeaker(url: string): Speaker | undefined
  public getSpeaker(url: URL): Speaker | undefined
  public getSpeaker(arg: unknown): Speaker | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.conversation.getSpeaker(arg as any);
  }

  public getSpeakers(speakers: (string | URL)[]): SpeakerSet {
    return this.conversation.getSpeakers(speakers);
  }

  public flipX(duration = 0, easing: Easing = "none"): this {
    const action = new SpeakerScaleAction(this.id, -1);
    action.duration = duration;
    action.easing = easing;
    action.anchor = { x: 1 };
    this.conversation.queue.push(action);

    return this;
  }

  public flipY(duration = 0, easing: Easing = "none"): this {
    const action = new SpeakerScaleAction(this.id, undefined, -1);
    action.duration = duration;
    action.easing = easing;
    action.anchor = { y: 1 };
    this.conversation.queue.push(action);

    return this;
  }

  public mirrorX(duration = 0, easing: Easing = "none"): this { return this.flipX(duration, easing); }
  public mirrorY(duration = 0, easing: Easing = "none"): this { return this.flipY(duration, easing); }

  public scaleTo(x = 1, y = 1, duration = 500, easing: Easing = "elastic.inOut(1,1)" as Easing): this {
    const action = new SpeakerScaleAction(this.id, x, y);
    action.duration = duration;
    action.easing = easing;
    this.conversation.queue.push(action);

    return this;
  }

  public slideTo(x?: number, y?: number, duration = 500, easing: Easing = "none"): this {
    const action = new SpeakerPositionAction(this.id, { x, y });
    action.duration = duration;
    action.easing = easing;
    this.conversation.queue.push(action);

    return this;
  }

  public fadeTo(alpha: number, duration = 500, easing: Easing = "none"): this {
    const action = new SpeakerAlphaAction(this.id, alpha);
    action.duration = duration;
    action.easing = easing;
    this.conversation.queue.push(action);

    return this;
  }

  public fadeIn(duration = 500, easing: Easing = "none"): this { return this.fadeTo(1, duration, easing); }
  public fadeOut(duration = 500, easing: Easing = "none"): this { return this.fadeTo(0, duration, easing); }

  public slideInRight(x: PositionCoordinate = "slotX", duration = 500, easing: Easing = "elastic.out(1,1)" as Easing): this {
    const action = new SpeakerPositionAction(this.id, { x, y: "slotY" });
    action.start = { x: "-width", y: "slotY" };
    action.duration = duration;
    action.easing = easing;
    this.conversation.queue.push(action);

    return this;
  }

  public slideOutLeft(duration = 500, easing: Easing = "elastic.in(1,1)" as Easing): this {
    const action = new SpeakerPositionAction(this.id, { x: "-width" });
    action.duration = duration;
    action.easing = easing;
    this.conversation.queue.push(action);

    return this;
  }

  public wait(duration: number): this {
    this.conversation.queue.push(new WaitAction(duration));
    return this;
  }

  public addSpeaker(id: string): Speaker
  public addSpeaker(uuid: string): Speaker
  public addSpeaker(stageObject: ImageStageObject): Speaker
  public addSpeaker(actor: Actor): Speaker
  public addSpeaker(url: string): Speaker
  public addSpeaker(url: URL): Speaker
  public addSpeaker(arg: unknown): Speaker {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.conversation.addSpeaker(arg as any);
  }

  public serialize(): SerializedSpeaker {
    return {
      id: this.id,
      version: this.version,
      speaker: this.speaker
    }
  }

  public remove(): Conversation {
    this.conversation.queue.push(new RemoveSpeakerAction(this.speaker));
    return this.conversation;
  }

  public autoPosition(duration = 500, easing: Easing = "elastic.inOut(1,1)" as Easing): this {
    const action = new SpeakerPositionAction(this.speaker, { x: "slotX", y: "slotY" });
    action.duration = duration;
    action.easing = easing;
    this.conversation.queue.push(action);
    return this;
  }

  public style(text: Record<string, unknown>, label: Record<string, unknown> = {}): this {
    this.conversation.queue.push(new SpeakerStyleAction(this.id, text, label));
    this._textStyle = text;
    this._labelStyle = label;
    return this;
  }

  public textStyle(style: Record<string, unknown>): this {
    this.conversation.queue.push(new SpeakerStyleAction(this.id, style));
    this._textStyle = style;
    return this;
  }

  public labelStyle(style: Record<string, unknown>): this {
    this.conversation.queue.push(new SpeakerStyleAction(this.id, undefined, style));
    this._labelStyle = style;
    return this;
  }

  public say(text: string, style?: Record<string, unknown>): this {
    this.conversation.queue.push(new LabelAction(this._name, this._labelStyle));
    this.conversation.queue.push(new TextAction(text, style ?? this._textStyle));
    return this;
  }

  public async run(): Promise<void> { return this.conversation.run(); }
  public async exec(): Promise<void> { return this.conversation.run(); }
  public async execute(): Promise<void> { return this.conversation.run(); }
  public async play(): Promise<void> { return this.conversation.run(); }

  constructor(conversation: Conversation, speaker: string)
  constructor(conversation: Conversation, speaker: Actor)
  constructor(conversation: Conversation, speaker: URL)
  constructor(conversation: Conversation, speaker: ImageStageObject)
  constructor(public readonly conversation: Conversation, arg: unknown) {
    if (arg instanceof URL) {
      this.speaker = arg.toString();
      // Get file name
      const split = arg.toString().split("/");
      this._name = split[split.length - 1].split(".")[0];
    } else if (arg instanceof Actor) {
      this.speaker = arg.uuid;
      this._name = arg.name;
    } else if (arg instanceof ImageStageObject) {
      this.speaker = arg.path;
      const split = arg.path.split("/");
      this._name = split[split.length - 1].split(".")[0];
    } else if (typeof arg === "string") {
      this.speaker = arg;
      const split = arg.split("/");
      this._name = split[split.length - 1].split(".")[0];
    }
  }
}