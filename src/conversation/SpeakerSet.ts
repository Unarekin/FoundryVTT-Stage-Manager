import { Easing, PositionCoordinate } from "types";
import { Conversation } from "./Conversation";
import { Speaker } from "./Speaker";
import { ParallelAction, SpeakerScaleAction, SpeakerAlphaAction, SpeakerPositionAction, RemoveSpeakerAction } from "./actions";

export class SpeakerSet {
  public fadeTo(alpha: number, duration = 500, easing: Easing = "none", start?: number): this {
    this.conversation.queue.push(new ParallelAction(this.speakers.map(speaker => {
      const action = new SpeakerAlphaAction(speaker.id, alpha);
      action.duration = duration;
      action.easing = easing;
      action.start = start;
      return action;
    })));
    return this;
  }

  public fadeIn(duration = 500, easing: Easing = "none"): this { return this.fadeTo(1, duration, easing, 0); }
  public fadeOut(duration = 500, easing: Easing = "none"): this { return this.fadeTo(0, duration, easing); }

  public flipX(duration = 0, easing: Easing = "none"): this {
    const actions = this.speakers.map(speaker => {
      const action = new SpeakerScaleAction(speaker.id, -1);
      action.anchor = { x: 1 };
      action.duration = duration;
      action.easing = easing;
      return action;
    });
    this.conversation.queue.push(new ParallelAction(actions));
    return this;
  }

  public flipY(duration = 0, easing: Easing = "none"): this {
    const actions = this.speakers.map(speaker => {
      const action = new SpeakerScaleAction(speaker.id, undefined, -1);
      action.anchor = { y: 1 };
      action.duration = duration;
      action.easing = easing;
      return action;
    });
    this.conversation.queue.push(new ParallelAction(actions));
    return this;
  }

  public mirrorX(duration = 0, easing: Easing = "none"): this { return this.flipX(duration, easing); }
  public mirrorY(duration = 0, easing: Easing = "none"): this { return this.flipY(duration, easing); }


  public x(x: number): this {
    this.conversation.queue.push(...this.speakers.map(speaker => new SpeakerPositionAction(speaker.id, { x })))
    return this;
  }

  public y(y: number): this {
    this.conversation.queue.push(...this.speakers.map(speaker => new SpeakerPositionAction(speaker.id, { y })));
    return this;
  }


  public slideTo(x?: number, y?: number, duration = 500, easing: Easing = "none"): this {
    this.conversation.queue.push(...this.speakers.map(speaker => {
      const action = new SpeakerPositionAction(speaker.id, { x, y });
      action.duration = duration;
      action.easing = easing;
      return action;
    }));
    return this;
  }

  public slideInRight(x: PositionCoordinate = "slotX", duration = 500, easing: Easing = "elastic.out(1,1)" as Easing): this {
    this.conversation.queue.push(...this.speakers.map(speaker => {
      const action = new SpeakerPositionAction(speaker.id, { x });
      action.start = { x: "-width" };
      action.duration = duration;
      action.easing = easing;
      return action;
    }));
    return this;
  }

  public slideOutLeft(duration = 500, easing: Easing = "elastic.in(1,1)" as Easing): this {
    this.conversation.queue.push(...this.speakers.map(speaker => {
      const action = new SpeakerPositionAction(speaker.id, { x: "-width" });
      action.duration = duration;
      action.easing = easing;
      return action;
    }));
    return this;
  }

  public autoPosition(duration = 500, easing: Easing = "elastic.inOut(1,1)" as Easing): this {
    this.conversation.queue.push(...this.speakers.map(speaker => {
      const action = new SpeakerPositionAction(speaker.id, { x: "slotX", y: "slotY" });
      action.duration = duration;
      action.easing = easing;
      return action;
    }));
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

  public remove(): Conversation {
    this.conversation.queue.push(...this.speakers.map(speaker => new RemoveSpeakerAction(speaker.id)));
    return this.conversation;
  }

  constructor(public readonly conversation: Conversation, public readonly speakers: Speaker[]) { }
}