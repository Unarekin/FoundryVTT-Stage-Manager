import { InvalidUserError } from "./errors";
import { StageObject } from "./stageobjects";
import { StageManager } from "./StageManager";
import { loadVideoTexture, pathIsVideo } from "lib/videoTextures";


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
 * Will attempt to locate a StageObject by id, name, or its associated {@link PIXI.DisplayObject}
 * @param {unknown} arg 
 * @returns {StageObject | undefined}
 */
export function coerceStageObject<t extends StageObject>(arg: unknown): t | undefined {
  if (arg === undefined) return;
  if (arg === null) return;

  if (arg instanceof StageObject) return arg as t;
  if (typeof arg === "string") {
    let obj = StageObject.find(arg);
    if (obj instanceof StageObject) return obj as t;
    obj = StageManager.StageObjects.get(arg);
    if (obj instanceof StageObject) return obj as t;
    obj = StageManager.StageObjects.getName(arg);
    if (obj instanceof StageObject) return obj as t;
  } else if (arg instanceof PIXI.DisplayObject) {
    const obj = StageManager.StageObjects.find(item => item.displayObject === arg);
    if (obj instanceof StageObject) return obj as t;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (typeof (arg as any).id === "string") return coerceStageObject((arg as any).id);
}

export function coerceScene(id: string): Scene | undefined
export function coerceScene(name: string): Scene | undefined
export function coerceScene(uuid: string): Scene | undefined
export function coerceScene(scene: Scene): Scene
export function coerceScene(arg: unknown): Scene | undefined {
  if (arg instanceof Scene) return arg;
  if (typeof arg === "string") {
    let scene: unknown = fromUuidSync(arg);
    if (scene instanceof Scene) return scene;
    if (!game.scenes) return;
    scene = game.scenes.get(arg);
    if (scene instanceof Scene) return scene;
    scene = game.scenes.getName(arg);
    if (scene instanceof Scene) return scene;
  }
}

export function coerceActor(id: string): Actor | undefined
export function coerceActor(name: string): Actor | undefined
export function coerceActor(uuid: string): Actor | undefined
export function coerceActor(token: Token): Actor | undefined
export function coerceActor(token: TokenDocument): undefined
export function coerceActor(actor: Actor): Actor
export function coerceActor(arg: unknown): Actor | undefined {
  if (arg instanceof Actor) return arg;
  if (arg instanceof Token) return arg.actor as Actor ?? undefined;
  if (arg instanceof TokenDocument) return arg.actor ?? undefined;
  if (typeof arg === "string") {
    let actor: unknown = fromUuidSync(arg);
    if (actor instanceof Actor) return actor;
    if (!game.actors) return;
    actor = game.actors.get(arg);
    if (actor instanceof Actor) return actor;
    actor = game.actors.getName(arg);
    if (actor instanceof Actor) return actor;
  }
}

export function getActorFromCombatant(id: string): Actor | undefined {
  if (!id) return;
  if (!(game.combat instanceof Combat)) return;
  const combatant = game.combat.combatants.get(id);
  if (!(combatant instanceof Combatant)) return;
  if (!combatant.actorId) return;
  const actor = game.actors?.get(combatant.actorId) as Actor | undefined;
  if (!(actor instanceof Actor)) return;
  return actor;
}

export function coerceMacro(id: string): Macro | undefined
export function coerceMacro(name: string): Macro | undefined
export function coerceMacro(uuid: string): Macro | undefined
export function coerceMacro(macro: Macro): Macro | undefined
export function coerceMacro(arg: unknown): Macro | undefined {
  if (arg instanceof Macro) return arg;
  if (typeof arg === "string") {
    let macro = fromUuidSync(arg) as Macro | undefined;
    if (macro instanceof Macro) return macro;
    // if (!(game instanceof Game && game.macros)) return;
    if (!game.macros) return;
    macro = game.macros.get(arg) as Macro | undefined;
    if (macro instanceof Macro) return macro;
    macro = game.macros.getName(arg) as Macro | undefined;
    if (macro instanceof Macro) return macro;
  }
}

export function coerceJSON(val: string): any {
  try {
    return JSON.parse(val);
  } catch {
    return;
  }
}

export function coerceColor(source: unknown): PIXI.Color | undefined {
  try {
    return new PIXI.Color(source as PIXI.ColorSource);
  } catch { /* empty */ }
}


export function coerceTexture(source: unknown): PIXI.Texture | undefined {
  const color = coerceColor(source);
  if (color) return createColorTexture(color);


  // Attempt to get a texture directly
  try {
    if (typeof source === "string" && pathIsVideo(source)) return loadVideoTexture(source);
    return PIXI.Texture.from(source as PIXI.TextureSource);
  } catch { /* empty */ }
}


/**
 * Generates a 1x1 {@link PIXI.Texture} with a given color
 * @param {PIXI.Color} color {@link PIXI.Color}
 * @returns 
 */
export function createColorTexture(color: PIXI.ColorSource): PIXI.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Cannot create canvas context");

  const actualColor = new PIXI.Color(color);
  ctx.fillStyle = actualColor.toHexa();
  ctx.fillRect(0, 0, 1, 1);
  return PIXI.Texture.from(canvas);
}
