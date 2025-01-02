import { StageObject } from "./stageobjects";
import { SerializedStageObject } from "./types";

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
  if (!foundry.utils.objectsEqual(current, serialized))
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
  if (!foundry.utils.objectsEqual(current, serialized))
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
  if (!foundry.utils.objectsEqual(current, serialized))
    await user.setFlag(__MODULE_ID__, "stageObjects", serialized);
}

export function getUserObjects(user: User): SerializedStageObject[] {
  return user.getFlag(__MODULE_ID__, "stageObjects") ?? [];
}