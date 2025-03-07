import { ImageStageObject } from 'stageobjects';
import { DialogueStageObject } from '../stageobjects/DialogueStageObject';
import { Action } from './actions/Action';
import { Speaker } from './Speaker';
import { SpeakerNotFoundError } from 'errors';
import { isValidSpeaker } from "./functions"

export class Conversation {
  public readonly object: DialogueStageObject;

  public readonly speakers: Speaker[] = [];
  public readonly queue: Action[] = [];


  public addSpeaker(id: string): this
  public addSpeaker(name: string): this
  public addSpeaker(uuid: string): this
  public addSpeaker(speaker: ImageStageObject): this
  public addSpeaker(actor: Actor): this
  public addSpeaker(token: Token): this
  public addSpeaker(token: TokenDocument): this
  public addSpeaker(url: string): this
  public addSpeaker(url: URL): this
  public addSpeaker(arg: unknown): this {
    if (!isValidSpeaker(arg)) throw new SpeakerNotFoundError(arg);


    return this;
  }


  constructor(dialogue?: DialogueStageObject) {
    if (dialogue instanceof DialogueStageObject) this.object = dialogue;
    else this.object = new DialogueStageObject();

    this.object.visible = false;
  }
}