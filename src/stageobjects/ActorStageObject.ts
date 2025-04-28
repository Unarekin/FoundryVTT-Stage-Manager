import { ActorStageObjectApplication, StageObjectApplication } from 'applications';
import { coerceActor } from '../coercion';
import { InvalidActorError } from '../errors';
import { localize } from '../functions';
import { getActorSettings } from '../Settings';
import { StageManager } from '../StageManager';
import { SerializedActorStageObject, TriggerEventSignatures } from '../types';
import { ImageStageObject } from './ImageStageObject';

export class ActorStageObject extends ImageStageObject {

  public static readonly type: string = "actor";
  public readonly type: string = "actor";

  public static readonly ApplicationType = ActorStageObjectApplication as typeof StageObjectApplication;
  public readonly ApplicationType = ActorStageObject.ApplicationType;

  public static GetActorObjects(id: string): ActorStageObject[]
  public static GetActorObjects(name: string): ActorStageObject[]
  public static GetActorObjects(uuid: string): ActorStageObject[]
  public static GetActorObjects(actor: Actor): ActorStageObject[]
  public static GetActorObjects(token: Token): ActorStageObject[]
  public static GetActorObjects(token: TokenDocument): ActorStageObject[]
  public static GetActorObjects(arg: unknown): ActorStageObject[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const actor = coerceActor(arg as any);
    if (!(actor instanceof Actor)) throw new InvalidActorError(arg);
    return StageManager.StageObjects.filter(obj => obj instanceof ActorStageObject && obj.actor === actor) as ActorStageObject[]
  }

  private _actor: Actor;
  public get actor() { return this._actor; }
  protected set actor(val) {
    if (!(val instanceof Actor)) throw new InvalidActorError(val);
    this._actor = val;
    const settings = getActorSettings(val);
    if (!settings) throw new InvalidActorError(val);
    this.name = settings?.name;
    this.path = settings?.image;
    this.dirty = true;
  }

  protected get contextMenuItems(): ContextMenuEntry[] {
    return [
      {
        name: localize("STAGEMANAGER.MENUS.ACTORSHEET", { name: this.name ?? this.id }),
        icon: `<i class="sm-icon context-menu fas fa-fw control actor-sheet"></i>`,
        callback: () => {
          if (!(this.actor instanceof Actor)) throw new InvalidActorError(this.actor);
          this.actor.sheet?.render(true);
        },
        condition: () => !!this.actor?.sheet,
      },
      ...super.contextMenuItems
    ]
  }


  public static deserialize(data: SerializedActorStageObject): ActorStageObject {
    const actor = coerceActor(data.actor);
    if (!(actor instanceof Actor)) throw new InvalidActorError(data.actor);
    const obj = new ActorStageObject(actor);
    obj.deserialize(data);
    return obj;
  }

  public serialize(): SerializedActorStageObject {
    return {
      ...super.serialize(),
      type: "actor",
      actor: this.actor.uuid ?? ""
    }
  }

  protected getTriggerArguments<k extends keyof TriggerEventSignatures>(event: k, args: TriggerEventSignatures[k]): Partial<TriggerEventSignatures[k]> | Record<string, unknown> {
    return {
      ...super.getTriggerArguments(event, args),
      actor: this.actor
    };
  }

  public deserialize(serialized: SerializedActorStageObject) {
    const actor = coerceActor(serialized.actor);
    if (!(actor instanceof Actor)) throw new InvalidActorError(serialized.actor);
    super.deserialize(serialized);

    this.actor = actor;
    // if (serialized.src) this.path = serialized.src;
  }

  public macroArguments(): { label: string; value: string; key: string; }[] {
    return [
      ...super.macroArguments(),
      { label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.ACTOR", value: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.AUTO", key: "actor" }
    ]
  }

  constructor(actor: Actor)
  constructor(id: string)
  constructor(name: string)
  constructor(uuid: string)
  constructor(token: Token)
  constructor(token: TokenDocument)
  constructor(arg: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const actor = coerceActor(arg as any);
    if (!(actor instanceof Actor)) throw new InvalidActorError(arg);

    const settings = getActorSettings(actor);
    if (!settings) throw new InvalidActorError(arg);
    super(settings.image, settings.name);
    this._actor = actor;
  }
}