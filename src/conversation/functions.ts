import { InvalidConversationActionTypeError, InvalidStageObjectError } from 'errors';
import mime from '../mime';
import { ActorStageObject, ImageStageObject } from '../stageobjects';
import { Action, SerializedAction } from './actions';
import * as tempActions from "./actions";

export function isValidSpeaker(input: unknown): boolean {
  if (input instanceof ImageStageObject) return true;
  if (input instanceof Actor) return true;
  if (input instanceof URL) return true;
  if (typeof input === "string") {
    if (fromUuidSync(input) instanceof Actor) return true;
    if (game?.actors?.get(input) instanceof Actor) return true;
    if (game?.actors?.getName(input) instanceof Actor) return true;

    const mimeType = mime(input);
    const mimeSplit = mimeType.split("/");
    if (mimeSplit[0] === "image" || mimeSplit[0] === "video") return true;
  }
  return false;
}

export function deserializeAction<t extends SerializedAction = SerializedAction>(action: t): Action<t> {
  const actionClass = Object.values(tempActions).find(item => typeof item === "function" && item.type) as typeof Action | undefined;
  if (!actionClass) throw new InvalidConversationActionTypeError(action.type);
  return actionClass.deserialize(action) as Action<t>;
}

export function coerceSpeakerObject(speaker: string): ImageStageObject | ActorStageObject | undefined {
  const uuid = fromUuidSync(speaker);
  if (uuid instanceof Actor) return new ActorStageObject(uuid);
  else if (uuid) throw new InvalidStageObjectError(uuid);

  let actor = game?.actors?.get(speaker) as Actor | undefined;
  if (actor instanceof Actor) return new ActorStageObject(actor);
  actor = game?.actors?.getName(speaker) as Actor | undefined;
  if (actor instanceof Actor) return new ActorStageObject(actor);

  return new ImageStageObject(speaker);

}