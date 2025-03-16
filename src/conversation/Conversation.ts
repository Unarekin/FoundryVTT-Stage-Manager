import { DialogueStageObject, ImageStageObject } from "../stageobjects";
import { Speaker } from "./Speaker";
import { Action, AddSpeakerAction, ConversationAlphaAction, ConversationStyleAction, LabelAction, MacroAction, ParallelAction, SerializedAction, SpeakerPositionAction, TextAction, WaitAction } from "./actions";
import { SerializedConversation } from "./types";
import { deserializeAction, isValidSpeaker } from './functions';
import { InvalidMacroError, InvalidSpeakerTypeError } from "errors";
import { StageManager } from "StageManager";
import { logError } from "logging";
import { textureCenterOfMass } from "functions";
import { Easing, PositionCoordinate } from "types";
import { SpeakerSet } from "./SpeakerSet";
import { coerceMacro } from "coercion";

export class Conversation {
  #dialogue: DialogueStageObject | undefined = undefined;
  public get dialogue() { return this.#dialogue; }
  public readonly id = foundry.utils.randomID();
  public readonly version = "1.0.0";

  public readonly queue: Action[] = [];
  public readonly speakers: Speaker[] = [];

  public _textStyle: Record<string, unknown> = {};
  public _labelStyle: Record<string, unknown> = {};

  public readonly validationContext = {

  }

  public serialize(): SerializedConversation {
    return {
      id: this.id,
      version: this.version,
      actions: this.queue.map(action => action.serialize()),
      speakers: this.speakers.map(speaker => speaker.serialize())
    }
  }

  public async run(serialized?: SerializedAction[]): Promise<void> {
    try {
      const queue = serialized ? serialized.map(action => deserializeAction(action)) : this.queue;

      const createDialogue = !this.dialogue;
      if (createDialogue) this.#dialogue = new DialogueStageObject("");

      // Validate
      for (const action of queue)
        await action.validate(this);

      // Prepare
      for (const action of queue)
        await action.prepare(this);

      if (this.#dialogue instanceof DialogueStageObject) StageManager.addStageObject(this.#dialogue);

      // Execute
      for (const action of queue)
        await action.execute(this);

      if (createDialogue && (this.#dialogue instanceof DialogueStageObject)) {
        this.#dialogue.destroy();
        this.#dialogue = undefined;
      }
    } catch (err) {
      logError(err as Error);
    }
  }

  public async exec(serialized?: SerializedAction[]): Promise<void> { return this.run(serialized); }
  public async execute(serialized?: SerializedAction[]): Promise<void> { return this.run(serialized); }
  public async play(serialized?: SerializedAction[]): Promise<void> { return this.run(serialized); }

  public addSpeaker(id: string): Speaker
  public addSpeaker(uuid: string): Speaker
  public addSpeaker(stageObject: ImageStageObject): Speaker
  public addSpeaker(actor: Actor): Speaker
  public addSpeaker(url: string): Speaker
  public addSpeaker(url: URL): Speaker
  public addSpeaker(arg: unknown): Speaker {
    if (!isValidSpeaker(arg)) throw new InvalidSpeakerTypeError(arg);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const speaker = new Speaker(this, arg as any);
    this.speakers.push(speaker);
    this.queue.push(new AddSpeakerAction(speaker.id));
    return speaker;
  }



  public addSpeakers(speakers: (string | ImageStageObject | Actor | URL)[]): SpeakerSet {
    for (const speaker of speakers) {
      if (!isValidSpeaker(speaker)) throw new InvalidSpeakerTypeError(speaker);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const speakerObjs = speakers.map(speaker => new Speaker(this, speaker as any));
    this.speakers.push(...speakerObjs);

    const actions = speakerObjs.map(speaker => new AddSpeakerAction(speaker.id));
    this.queue.push(new ParallelAction(actions));
    return new SpeakerSet(this, speakerObjs);
  }

  public speakerSlotPosition(speaker: Speaker): { x: PositionCoordinate, y: PositionCoordinate, z: PositionCoordinate } {
    const slot = {
      x: 0,
      // y: `-height + ${this.dialogue?.panel.height ?? 0}`,
      y: this.dialogue?.speakerSlotTop ?? `-height`,
      z: 0
    };

    const index = this.speakers.indexOf(speaker);
    if (index === -1) return slot;
    slot.z = -10 - (10 * index);

    const prev = this.speakers[index - 1];
    if (prev?.object instanceof ImageStageObject) {
      const center = textureCenterOfMass(prev.object.texture);
      if (center) slot.x = prev.object.x + center?.x;
      else slot.x = prev.object.x + (prev.object.width / 2);
    }

    return slot;
  }

  public getSpeakers(speakers: (string | URL)[]): SpeakerSet {
    const objs = speakers.map(arg => {
      if (typeof arg === "string") return this.speakers.find(speaker => speaker.id === arg || speaker.speaker === arg);
      if (arg instanceof URL) return this.speakers.find(speaker => speaker.speaker === arg.toString());
    });
    if (objs.some(obj => typeof obj === "undefined")) throw new InvalidSpeakerTypeError(undefined);
    return new SpeakerSet(this, objs as Speaker[]);
  }

  public getSpeaker(id: string): Speaker | undefined
  public getSpeaker(uuid: string): Speaker | undefined
  public getSpeaker(url: string): Speaker | undefined
  public getSpeaker(url: URL): Speaker | undefined
  public getSpeaker(arg: unknown): Speaker | undefined {
    if (typeof arg === "string") return this.speakers.find(speaker => speaker.id === arg || speaker.speaker === arg);
    if (arg instanceof URL) return this.speakers.find(speaker => speaker.speaker === arg.toString());
  }

  public autoPositionSpeakers(duration = 500, easing: Easing = "elastic.inOut(1,1)" as Easing): this {
    this.queue.push(...this.speakers.map(speaker => {
      const action = new SpeakerPositionAction(speaker.id, { x: "slotX", y: "slotY" });
      action.duration = duration;
      action.easing = easing;
      return action;
    }));
    return this;
  }

  public clearText(): this {
    this.queue.push(new TextAction(""));
    this.queue.push(new ConversationStyleAction(PIXI.HTMLTextStyle.defaultStyle as unknown as Record<string, unknown>));
    return this;
  }

  public clearLabel(): this {
    this.queue.push(new LabelAction(""));
    this.queue.push(new ConversationStyleAction(undefined, PIXI.HTMLTextStyle.defaultStyle as unknown as Record<string, unknown>));
    return this;
  }

  public wait(duration: number): this {
    this.queue.push(new WaitAction(duration));
    return this;
  }

  public textStyle(style: Record<string, unknown>): this {
    this.queue.push(new ConversationStyleAction(style));
    return this;
  }

  public labelStyle(style: Record<string, unknown>): this {
    this.queue.push(new ConversationStyleAction(undefined, style));
    return this;
  }

  public fadeTo(alpha: number, duration = 500, easing: Easing = "none"): this {
    const action = new ConversationAlphaAction(alpha);
    action.duration = duration;
    action.easing = easing;
    this.queue.push(action);
    return this;
  }

  public fadeIn(duration = 500, easing: Easing = "none"): this {
    const action = new ConversationAlphaAction(1);
    action.start = 0;
    action.duration = duration;
    action.easing = easing;
    this.queue.push(action)
    return this;
  }

  public fadeOut(duration = 500, easing: Easing = "none"): this {
    const action = new ConversationAlphaAction(0);
    action.duration = duration;
    action.easing = easing;
    this.queue.push(action);
    return this;
  }

  public macro(macro: Macro): this
  public macro(macro: string): this
  public macro(arg: unknown): this {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const macro = coerceMacro(arg as any);
    if (!(macro instanceof Macro)) throw new InvalidMacroError(arg);
    this.queue.push(new MacroAction(macro.uuid));
    return this;
  }

  constructor(dialogue?: DialogueStageObject) {
    if (dialogue) this.#dialogue = dialogue;
  }
}