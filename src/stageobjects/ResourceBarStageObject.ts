import { InvalidResourcePathError, InvalidUUIDError } from 'errors';
import { ProgressBarStageObject } from './ProgressBarStageObject';
import { SerializedResourceBarStageObject } from 'types';
import { ResourceBarStageObjectApplication, StageObjectApplication } from 'applications';

export class ResourceBarStageObject extends ProgressBarStageObject {

  private _valuePath = "";
  private _maxPath = "";

  public static readonly type = "resourceBar";
  public readonly type: string = ResourceBarStageObject.type;

  public static readonly ApplicationType = ResourceBarStageObjectApplication as typeof StageObjectApplication;
  public readonly ApplicationType = ResourceBarStageObject.ApplicationType;

  public get valuePath() { return this._valuePath; }
  public set valuePath(val) {
    if (this.valuePath !== val) {
      this._valuePath = val;
      this.dirty = true;
      this.updateValues();
    }
  }

  public get maxPath() { return this._maxPath; }
  public set maxPath(val) {
    if (this.maxPath !== val) {
      this._maxPath = val;
      this.dirty = true;
      this.updateValues();
    }
  }

  private _object: foundry.abstract.Document<any, any, any> | undefined = undefined;
  public get object() { return this._object; }


  private _hookId = 0;

  public get uuid() { return this.object?.uuid ?? ""; }
  public set uuid(val) {
    if (this.uuid !== val) {
      const obj = fromUuidSync(val);
      if (!obj) throw new InvalidUUIDError(val);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this._object = obj as any;
      if (this._hookId) this.unhookUpdate();
      this.hookUpdate();
      this.updateValues();
    }
  }

  protected updateValues() {
    if (!(this.object instanceof foundry.abstract.Document)) return;
    if (!this.valuePath) return;
    if (!this.maxPath) return;

    const value = foundry.utils.getProperty(this.object, this.valuePath) as unknown;
    const max = foundry.utils.getProperty(this.object, this.maxPath) as unknown;

    if (typeof max === "number") this.max = max;
    if (typeof value === "number") this.value = value;

    this.updateText();
    this.updateSprites();
  }

  public get updateHookName() {
    if (!this._object) return "";
    return `update${this.object?.documentName}`;
  }

  protected unhookUpdate() {
    if (!this._hookId) return;
    Hooks.off(this.updateHookName, this._hookId);
  }

  protected hookUpdate() {
    if (this._hookId) this.unhookUpdate();
    Hooks.on(this.updateHookName, (obj: foundry.abstract.Document<any, any, any>, delta: Record<string, unknown>, options: any, userId: string) => {
      const keys = Object.keys(foundry.utils.flattenObject(delta));
      if (obj.uuid === this.uuid && (keys.includes(this.valuePath) || keys.includes(this.maxPath)))
        this.onObjectUpdate(obj, delta, options, userId);
    });
  }


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onObjectUpdate(obj: foundry.abstract.Document<any, any, any>, delta: Record<string, unknown>, options: any, userId: string) {
    const flattened = foundry.utils.flattenObject(delta) as Record<string, unknown>;
    const valPath = this.valuePath;
    const maxPath = this.maxPath;

    if (typeof flattened[maxPath] === "number") this.max = flattened[maxPath];
    if (typeof flattened[valPath] === "number") this.value = flattened[valPath];
  }

  public serialize(): SerializedResourceBarStageObject {
    return {
      ...super.serialize(),
      type: this.type,
      maxPath: this.maxPath,
      valuePath: this.valuePath,
      object: this.object?.uuid ?? ""
    }
  }

  public deserialize(serialized: SerializedResourceBarStageObject) {
    super.deserialize(serialized);
    if (typeof serialized.object === "string") this.uuid = serialized.object
    if (typeof serialized.maxPath === "string") this.maxPath = serialized.maxPath;
    if (typeof serialized.valuePath === "string") this.valuePath = serialized.valuePath;
  }

  public static deserialize(serialized: SerializedResourceBarStageObject): ResourceBarStageObject {
    const obj = new ResourceBarStageObject(serialized.object, serialized.valuePath, serialized.maxPath, serialized.fgSprite, serialized.bgSprite, serialized.lerpSprite);
    obj.deserialize(serialized);
    return obj;
  }

  //const obj = new ProgressBarStageObject(0, max, fg, bg, lerp);
  // constructor(value: number, max: number, fg: PIXI.TextureSource | PIXI.ColorSource, bg: PIXI.TextureSource | PIXI.ColorSource, lerp: PIXI.TextureSource | PIXI.ColorSource = "transparent") {
  constructor(uuid: string, valuePath: string, maxPath: string, fg: PIXI.TextureSource | PIXI.ColorSource, bg: PIXI.TextureSource | PIXI.ColorSource, lerp?: PIXI.TextureSource | PIXI.ColorSource)
  constructor(obj: foundry.abstract.Document<any, any, any>, valuePath: string, maxPath: string, fg: PIXI.TextureSource | PIXI.ColorSource, bg: PIXI.TextureSource | PIXI.ColorSource, lerp?: PIXI.TextureSource | PIXI.ColorSource)
  constructor(arg: unknown, valuePath: string, maxPath: string, fg: PIXI.TextureSource | PIXI.ColorSource, bg: PIXI.TextureSource | PIXI.ColorSource, lerp?: PIXI.TextureSource | PIXI.ColorSource) {
    const obj = typeof arg == "string" ? fromUuidSync(arg) : arg;
    if (!(obj instanceof foundry.abstract.Document)) throw new InvalidUUIDError(arg);

    const flattened = foundry.utils.flattenObject(obj) as Record<string, unknown>;
    const keys = Object.keys(flattened);
    if (!keys.includes(valuePath)) throw new InvalidResourcePathError(valuePath);
    if (!keys.includes(maxPath)) throw new InvalidResourcePathError(maxPath);

    super(0, 0, fg, bg, lerp);
    this.uuid = obj.uuid;

    this.maxPath = maxPath;
    this.valuePath = valuePath;

    this.updateText();
    this.updateSprites();
  }
}