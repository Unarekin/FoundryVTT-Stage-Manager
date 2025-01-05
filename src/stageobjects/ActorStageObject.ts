import { coerceActor } from '../coercion';
import { InvalidActorError } from '../errors';
import { localize } from '../functions';
import { getActorSettings } from '../Settings';
import { SerializedActorStageObject } from '../types';
import { ImageStageObject } from './ImageStageObject';

export class ActorStageObject extends ImageStageObject {

  public static readonly type: string = "actor";
  public readonly type: string = "actor";

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


  public deserialize(serialized: SerializedActorStageObject) {
    const actor = coerceActor(serialized.actor);
    if (!(actor instanceof Actor)) throw new InvalidActorError(serialized.actor);
    super.deserialize(serialized);
    this.actor = actor;
    // if (serialized.src) this.path = serialized.src;
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