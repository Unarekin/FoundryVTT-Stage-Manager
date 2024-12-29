import { InvalidUserError } from "./errors";
import { StageObject } from "./stageobjects";
import { StageManager } from "./StageManager";


export function coerceUser(id: string): User | undefined
export function coerceUser(uuid: string): User | undefined
export function coerceUser(name: string): User | undefined
export function coerceUser(user: User): User | undefined
export function coerceUser(arg: unknown): User | undefined {
  if (arg instanceof User) return arg;

  if (typeof arg === "string") {
    let user: User | undefined = fromUuidSync(arg) as User | undefined;
    if (user instanceof User) return user;

    user = game.users?.get(arg) as User | undefined;
    if (user instanceof User) return user;

    user = game.users?.getName(arg) as User | undefined;
    if (user instanceof User) return user;
  }

  throw new InvalidUserError(arg);
}

/**
 * Will attempt to locate a StageObject by id, or name
 * @param {unknown} arg 
 * @returns {StageObject | undefined}
 */
export function coerceStageObject<t extends StageObject>(arg: unknown): t | undefined {
  if (arg instanceof StageObject) return arg as t;
  if (typeof arg === "string") {
    let obj = StageObject.find(arg);
    if (obj instanceof StageObject) return obj as t;
    obj = StageManager.StageObjects.get(arg);
    if (obj instanceof StageObject) return obj as t;
    obj = StageManager.StageObjects.getName(arg);
    if (obj instanceof StageObject) return obj as t;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (typeof (arg as any).id === "string") return coerceStageObject((arg as any).id);
}