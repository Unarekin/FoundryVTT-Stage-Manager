import { Conversation } from "conversation/Conversation";
import { Action } from "./Action";
import { SerializedConversationAlphaAction } from "./types";
import { DialogueStageObject } from "stageobjects";
import { InvalidStageObjectError } from "errors";

export class ConversationAlphaAction extends Action<SerializedConversationAlphaAction> {
  public static readonly type = "conversationAlpha";
  public readonly type = ConversationAlphaAction.type;

  public static readonly version = "1.0.0";
  public readonly version = ConversationAlphaAction.version;

  public static readonly default: SerializedConversationAlphaAction = {
    id: "",
    label: "",
    type: ConversationAlphaAction.type,
    version: ConversationAlphaAction.version,
    alpha: 1,
    easing: "none"
  }

  public readonly default = ConversationAlphaAction.default;

  public duration = this.default.duration;
  public start = this.default.start;
  public easing = this.default.easing;

  public async execute(conversation: Conversation): Promise<void> {
    if (!(conversation.dialogue instanceof DialogueStageObject)) throw new InvalidStageObjectError(conversation.dialogue);
    if (this.start) conversation.dialogue.alpha = this.start;
    if (this.duration) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await gsap.to(conversation.dialogue, {
        alpha: this.alpha,
        duration: this.duration / 1000,
        easing: this.easing ?? "none"
      });
    } else {
      conversation.dialogue.alpha = this.alpha;
    }
  }

  constructor(public alpha: number) {
    super();
  }
}