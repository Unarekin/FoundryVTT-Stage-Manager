import { DeepPartial, SerializedStageObject, StageObjectType } from "types";
import { LocalizedError } from "errors";

export abstract class StageObject<t extends PIXI.DisplayObject = PIXI.Container, v extends SerializedStageObject = SerializedStageObject> {
  public readonly object: t;

  protected abstract readonly type: StageObjectType;
  protected abstract createObject(): t;

  #id: string = foundry.utils.randomID();
  public get id() { return this.#id; }
  protected set id(val) { this.#id = val; }

  #name: string = this.id;
  public get name() { return this.#name; }
  public set name(val) { this.#name = val; }

  public readonly width = 0;
  public readonly height = 0;

  public readonly tags: string[] = [];

  #clickThrough = false;
  public get clickThrough() { return this.#clickThrough; }
  public set clickThrough(val) { this.#clickThrough = val; }


  public get rotation() { return this.object.rotation; }
  public set rotation(val) { this.object.rotation = val; }

  public get angle() { return this.object.angle; }
  public set angle(val) { this.object.angle = val; }


  public get skew() { return this.object.skew; }
  public set skew(val) { this.object.skew = val; }

  public get x() { return this.object.x; }
  public set x(val) { this.object.x = val; }

  public get y() { return this.object.y; }
  public set y(val) { this.object.y = val; }

  #locked = false;
  public get locked() { return this.#locked; }
  public set locked(val) { this.#locked = val; }

  public get visible() { return this.object.visible; }
  public set visible(val) { this.object.visible = val; }

  public get alpha() { return this.object.alpha; }
  public set alpha(val) { this.object.alpha = val; }

  public get zIndex() { return this.object.zIndex; }
  public set zIndex(val) { this.object.zIndex = val; }

  public get mask() { return this.object.mask; }
  public set mask(val) { this.object.mask = val; }

  public serialize(): v {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: __MODULE_VERSION__,
      tags: [...this.tags],
      clickThrough: this.clickThrough,
      bounds: {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height
      },
      skew: {
        x: this.skew.x,
        y: this.skew.y
      },
      angle: this.angle,
      locked: this.locked,
      visible: this.visible,
      mask: "", // TODO: Implement mask
      alpha: this.alpha,
      zIndex: this.zIndex
    } as v
  }

  public deserialize(serialized: v): this {

    if (typeof serialized.id === "string") this.id = serialized.id;
    if (typeof serialized.name === "string") this.name = serialized.name;
    if (Array.isArray(serialized.tags)) this.tags.splice(0, this.tags.length, ...serialized.tags);
    if (typeof serialized.clickThrough === "boolean") this.clickThrough = serialized.clickThrough;
    if (typeof serialized.angle === "number") this.angle = serialized.angle;
    if (typeof serialized.locked === "boolean") this.locked = serialized.locked;
    if (typeof serialized.visible === "boolean") this.visible = serialized.visible;
    if (typeof serialized.alpha === "number") this.alpha = serialized.alpha;
    if (typeof serialized.zIndex === "number") this.zIndex = serialized.zIndex;

    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static deserialize(serialized: DeepPartial<SerializedStageObject>): StageObject { throw new LocalizedError("NOTIMPLEMENTED"); }

  constructor() {

    this.object = this.createObject();
  }
}