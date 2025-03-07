import { coerceActor } from "coercion";
import mime from "../mime";
import { StageManager } from "../StageManager";
import { ActorStageObject, ImageStageObject } from "../stageobjects";
import { Speaker } from "./Speaker";

export function isValidSpeaker(arg: unknown): boolean {
  if (arg instanceof Speaker || arg instanceof ImageStageObject || arg instanceof Actor || arg instanceof Token || arg instanceof TokenDocument || arg instanceof URL) return true;

  if (typeof arg === "string") {

    if (StageManager.StageObjects.get(arg) instanceof ImageStageObject) return true;
    if (StageManager.StageObjects.getName(arg) instanceof ImageStageObject) return true;

    const mimeType = mime(arg);
    const mimeTypeSplit = mimeType.split("/");
    if (mimeTypeSplit[0] === "image" || mimeTypeSplit[0] === "video") return true;

    const uuid = fromUuidSync(arg);
    if (uuid instanceof Actor || uuid instanceof Token || uuid instanceof TokenDocument) return true;

    const actor = coerceActor(arg);
    if (actor instanceof Actor) return true;
  }

  return false;
}

/**
 * 
 * @param arg 
 * @returns 
 */
export function coerceSpeakerObject(arg: unknown): ImageStageObject | undefined {
  if (arg instanceof Speaker) return arg.speaker;
  if (arg instanceof ImageStageObject) return arg;
  if (arg instanceof ActorStageObject) return arg;
  if (arg instanceof URL) return new ImageStageObject(arg.toString());
  if (arg instanceof Actor) return new ActorStageObject(arg);
  if ((arg instanceof Token || arg instanceof TokenDocument) && !!arg.actor) return new ActorStageObject(arg.actor);


  if (typeof arg !== "string") return;

  // Check if URL
  const mimeType = mime(arg);
  const mimeSplit = mimeType.split("/");
  if (mimeSplit[0] === "image" || mimeSplit[0] === "video" && URL.canParse(arg, location.origin)) return new ImageStageObject(arg);

  const uuid = foundry.utils.parseUuid(arg);
  if (uuid.collection instanceof DocumentCollection) {
    const actor = fromUuidSync(arg);
    if (actor instanceof Actor) return new ActorStageObject(actor);
  }

  if (StageManager.StageObjects.get(arg) instanceof ImageStageObject) return StageManager.StageObjects.get(arg) as ImageStageObject;
  if (StageManager.StageObjects.getName(arg) instanceof ImageStageObject) return StageManager.StageObjects.getName(arg) as ImageStageObject;

  if (game.actors) {
    let actor = game.actors.get(arg) as Actor | undefined;
    if (actor instanceof Actor) return new ActorStageObject(actor);
    actor = game.actors.getName(arg) as Actor | undefined;
    if (actor instanceof Actor) return new ActorStageObject(actor);
  }
}

export function getSpeakerImage(arg: unknown): string | undefined {
  if (arg instanceof ImageStageObject) return arg.path;
  if (arg instanceof Actor) return arg.img!;
  if (arg instanceof Token || arg instanceof TokenDocument) return arg.actor?.img ?? undefined;

  if (arg instanceof URL) return arg.href;

  if (typeof arg === "string") {
    const actor = coerceActor(arg);
    if (actor instanceof Actor) return actor.img ?? undefined;
    const uuid = fromUuidSync(arg);
    if (uuid instanceof TokenDocument) return uuid.actor?.img ?? undefined;
    if (uuid instanceof Token) return uuid.actor?.img ?? undefined;
  }
}