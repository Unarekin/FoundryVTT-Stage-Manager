import { DeepPartial, SerializedStageObject, StageLayer, StageObjectType } from "types";
import { LocalizedError } from "errors";

export abstract class StageObject<t extends PIXI.DisplayObject = PIXI.Container, v extends SerializedStageObject = SerializedStageObject> {
  public readonly object: t;

  protected abstract readonly type: StageObjectType;
  protected abstract createObject(): t;

  #dirty = false;
  public get dirty() { return this.#dirty; }
  public set dirty(val) { this.#dirty = val; }

  #id: string = foundry.utils.randomID();
  public get id() { return this.#id; }
  protected set id(val) {
    if (this.id === val) return;

    this.#id = val;
    this.dirty = true;
  }

  #name: string = this.id;
  public get name() { return this.#name; }
  public set name(val) {
    if (this.name === val) return;
    this.#name = val;
    this.dirty = true;
  }

  public width = 0;
  public height = 0;

  public readonly tags: string[] = [];

  #clickThrough = false;
  public get clickThrough() { return this.#clickThrough; }
  public set clickThrough(val) {
    if (this.clickThrough === val) return;
    this.#clickThrough = val;
    this.dirty = true;
  }


  public get rotation() { return this.object.rotation; }
  public set rotation(val) {
    if (this.rotation === val) return;
    this.object.rotation = val;
    this.dirty = true;
  }

  public get angle() { return this.object.angle; }
  public set angle(val) {
    if (this.angle === val) return;
    this.object.angle = val;
    this.dirty = true;
  }


  public get skew() { return this.object.skew; }
  public set skew(val) {
    if (this.skew === val) return;
    this.object.skew = val;
    this.dirty = true;
  }

  public get x() { return this.object.x; }
  public set x(val) {
    if (this.x === val) return;
    this.object.x = val;
    this.dirty = true;
  }

  public get y() { return this.object.y; }
  public set y(val) {
    if (this.y === val) return;
    this.object.y = val;
    this.dirty = true;
  }

  #locked = false;
  public get locked() { return this.#locked; }
  public set locked(val) {
    if (this.locked === val) return;
    this.#locked = val;
    this.dirty = true;
  }

  public get visible() { return this.object.visible; }
  public set visible(val) {
    if (this.visible === val) return;
    this.object.visible = val;
    this.dirty = true;
  }

  public get alpha() { return this.object.alpha; }
  public set alpha(val) {
    if (this.alpha === val) return;
    this.object.alpha = val;
    this.dirty = true;
  }

  public get zIndex() { return this.object.zIndex; }
  public set zIndex(val) {
    if (this.zIndex === val) return;
    this.object.zIndex = val;
    this.dirty = true;
  }

  public get mask() { return this.object.mask; }
  public set mask(val) {
    if (this.mask === val) return;
    this.object.mask = val;
    this.dirty = true;
  }

  #layer: StageLayer = "foreground";
  public get layer() { return this.#layer; }
  public set layer(val) {
    if (this.layer === val) return;
    this.#layer = val;
    this.dirty = true;
  }

  public get responsibleUser() { return game?.users?.activeGM; }
  public get isResponsibleUser() { return !!game?.user?.isActiveGM; }

  public serialize(): v {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      version: __MODULE_VERSION__,
      tags: [...this.tags],
      clickThrough: this.clickThrough,
      layer: this.layer,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
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

  public deserialize(serialized: v, dirty = false): this {

    if (typeof serialized.id === "string") this.id = serialized.id;
    if (typeof serialized.name === "string") this.name = serialized.name;
    if (Array.isArray(serialized.tags)) this.tags.splice(0, this.tags.length, ...serialized.tags);
    if (typeof serialized.clickThrough === "boolean") this.clickThrough = serialized.clickThrough;
    if (typeof serialized.angle === "number") this.angle = serialized.angle;
    if (typeof serialized.locked === "boolean") this.locked = serialized.locked;
    if (typeof serialized.visible === "boolean") this.visible = serialized.visible;
    if (typeof serialized.alpha === "number") this.alpha = serialized.alpha;
    if (typeof serialized.zIndex === "number") this.zIndex = serialized.zIndex;
    if (typeof serialized.layer === "string") this.layer = serialized.layer;
    if (typeof serialized.x === "number") this.x = serialized.x;
    if (typeof serialized.y === "number") this.y = serialized.y;
    if (typeof serialized.width === "number") this.width = serialized.width;
    if (typeof serialized.height === "number") this.height = serialized.height;

    this.dirty = dirty;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static deserialize(serialized: DeepPartial<SerializedStageObject>, dirty = false): StageObject { throw new LocalizedError("NOTIMPLEMENTED"); }

  #destroyed = false;
  public get destroyed() { return this.#destroyed; }

  public destroy() {
    if (this.#destroyed) return;

    if (this.object) {
      if (Array.isArray(this.object.filters)) {
        const filters = [...this.object.filters];
        this.object.filters = [];
        filters.forEach(filter => { filter.destroy(); });
      }

      gsap.killTweensOf(this.object);
      this.object.destroy();
    }
    game!.StageManager!.stageObjects.delete(this.id);
    this.#destroyed = true;
  }

  constructor() {

    this.object = this.createObject();
  }
}