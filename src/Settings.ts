import { coerceActor } from "./coercion";
import { InvalidActorError } from "./errors";
import { StageObject } from "./stageobjects";
import { ActorSettings, SerializedStageObject } from "./types";

export function registerSettings() {
  if (game?.settings) {
    game.settings.register(__MODULE_ID__, "stageObjects", {
      name: "Current StageObjects",
      hint: "Serialized list of StageObjects currently present.",
      config: false,
      scope: "world",
      type: Array,
      default: [],
      requiresReload: false
    });

    game.settings.register(__MODULE_ID__, "objectOwnership", {
      name: "Object Ownership",
      hint: "List of StageObjects and their specified owners.",
      config: false,
      scope: "world",
      type: Object,
      default: {},
      requiresReload: false
    });
  }
}

export function setSetting<t = any>(setting: string, value: t): Promise<t | null> {
  if (!game?.settings) return null;
  return game.settings.set(__MODULE_ID__, setting, value) as t | null;
}

export function getSetting<t = any>(setting: string): t | undefined {
  return game?.settings?.get(__MODULE_ID__, setting) as t | undefined;
}

export async function setGlobalObjects(objects: StageObject[]) {
  const current = getGlobalObjects();
  const serialized = objects.map(obj => obj.serialize());
  if (!foundry.utils.objectsEqual({ wrap: current }, { wrap: serialized }))
    return setSetting<SerializedStageObject[]>("stageObjects", serialized);
  else
    return current;
}

export function getGlobalObjects(): SerializedStageObject[] {
  return getSetting<SerializedStageObject[]>("stageObjects") ?? [];
}

export async function setSceneObjects(scene: Scene, objects: StageObject[]): Promise<void>
export async function setSceneObjects(scene: Scene, objects: SerializedStageObject[]): Promise<void>
export async function setSceneObjects(scene: Scene, objects: StageObject[] | SerializedStageObject[]): Promise<void> {
  const serialized = objects.map(obj => obj instanceof StageObject ? obj.serialize() : obj);
  const current = getSceneObjects(scene);
  if (!foundry.utils.objectsEqual({ wrap: current }, { wrap: serialized }))
    await scene.setFlag(__MODULE_ID__, "stageObjects", serialized);
}

export function getSceneObjects(scene: Scene): SerializedStageObject[] {
  return scene.getFlag(__MODULE_ID__, "stageObjects") ?? [];
}

export async function setUserObjects(user: User, objects: StageObject[]): Promise<void>
export async function setUserObjects(user: User, objects: SerializedStageObject[]): Promise<void>
export async function setUserObjects(user: User, objects: StageObject[] | SerializedStageObject[]): Promise<void> {
  const serialized = objects.map(obj => obj instanceof StageObject ? obj.serialize() : obj);
  const current = getUserObjects(user);
  if (!foundry.utils.objectsEqual({ wrap: current }, { wrap: serialized }))
    await user.setFlag(__MODULE_ID__, "stageObjects", serialized);
}

export function getUserObjects(user: User): SerializedStageObject[] {
  return user.getFlag(__MODULE_ID__, "stageObjects") ?? [];
}

export function getActorSettings(id: string): ActorSettings | undefined
export function getActorSettings(name: string): ActorSettings | undefined
export function getActorSettings(uuid: string): ActorSettings | undefined
export function getActorSettings(actor: Actor): ActorSettings | undefined
export function getActorSettings(token: Token): ActorSettings | undefined
export function getActorSettings(token: TokenDocument): ActorSettings | undefined
export function getActorSettings(arg: unknown): ActorSettings | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const actor = coerceActor(arg as any);
  if (!(actor instanceof Actor)) throw new InvalidActorError(arg);

  return {
    name: actor.getFlag(__MODULE_ID__, "name") ?? actor.name,
    image: actor.getFlag(__MODULE_ID__, "image") ?? actor.img
  };

}