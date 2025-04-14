import { InvalidResourcePathError, InvalidUUIDError } from "errors";
import { ProgressClockStageObject } from "./ProgressClockStageObject";
import { SerializedResourceClockStageObject } from "types";
import { ResourceClockStageObjectApplication, StageObjectApplication } from "applications";

export class ResourceClockStageObject extends ProgressClockStageObject {
  private _valuePath = "";
  private _maxPath = "";

  public static readonly type: string = "resourceClock";
  public readonly type: string = ResourceClockStageObject.type;

  public static readonly ApplicationType = ResourceClockStageObjectApplication as typeof StageObjectApplication;
  public readonly ApplicationType = ResourceClockStageObject.ApplicationType;

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

  public get uuid() { return this.object?.uuid ?? "" }
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

  protected getValue() {
    return this.object ? foundry.utils.getProperty(this.object, `system.${this.valuePath}`) as number : 0;
  }

  protected getMax() {
    return this.object ? foundry.utils.getProperty(this.object, `system.${this.maxPath}`) as number : 0;
  }


  protected updateValues() {
    if (!(this.object instanceof foundry.abstract.Document)) return;
    if (!this.valuePath || !this.maxPath) return;

    const value = this.getValue();
    const max = this.getMax();
    if (typeof max === "number") this.max = max;
    if (typeof value === "number") this.value = value;

    this.updateText();
    this.updateSprites();
  }

  public get updateHookName() {
    if (!this.object) return "";
    return `update${this.object.documentName}`;
  }

  protected unhookUpdate() {
    if (!this._hookId) return;
    Hooks.off(this.updateHookName, this._hookId);
  }

  protected isValidPath(obj: object, path: string): boolean {
    return typeof foundry.utils.getProperty(obj, `system.${path}`) === "number";
  }

  protected hookUpdate() {
    if (this._hookId) this.unhookUpdate();
    Hooks.on(this.updateHookName, (obj: foundry.abstract.Document<any, any, any>, delta: Record<string, unknown>, options: any, userId: string) => {
      if (obj.uuid === this.uuid && (this.isValidPath(delta, this.valuePath) || this.isValidPath(delta, this.maxPath)))
        this.onObjectUpdate(obj, delta, options, userId);
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onObjectUpdate(obj: foundry.abstract.Document<any, any, any>, delta: Record<string, unknown>, options: any, userId: string) {
    const value = foundry.utils.getProperty(delta, `system.${this.valuePath}`) as number;
    const max = foundry.utils.getProperty(delta, `system.${this.maxPath}`) as number;

    if (typeof max === "number") this.max = max;
    if (typeof value === "number") this.value = value;
  }

  public serialize(): SerializedResourceClockStageObject {
    return {
      ...super.serialize(),
      type: this.type,
      maxPath: this.maxPath,
      valuePath: this.valuePath,
      object: this.object?.uuid ?? ""
    }
  }

  public deserialize(serialized: SerializedResourceClockStageObject) {
    super.deserialize(serialized);
    if (typeof serialized.object === "string") this.uuid = serialized.object;
    if (typeof serialized.maxPath === "string") this.maxPath = serialized.maxPath;
    if (typeof serialized.valuePath === "string") this.valuePath = serialized.valuePath;
  }

  public static deserialize(serialized: SerializedResourceClockStageObject): ResourceClockStageObject {
    const obj = new ResourceClockStageObject(serialized.object, serialized.valuePath, serialized.maxPath, serialized.fgSprite, serialized.bgSprite, serialized.lerpSprite);
    obj.deserialize(serialized);
    return obj;
  }


  constructor(uuid: string, valuePath: string, maxPath: string, fg: PIXI.TextureSource | PIXI.ColorSource, bg: PIXI.TextureSource | PIXI.ColorSource, lerp?: PIXI.TextureSource | PIXI.ColorSource)
  constructor(obj: foundry.abstract.Document<any, any, any>, valuePath: string, maxPath: string, fg: PIXI.TextureSource | PIXI.ColorSource, bg: PIXI.TextureSource | PIXI.ColorSource, lerp?: PIXI.TextureSource | PIXI.ColorSource)
  constructor(arg: unknown, valuePath: string, maxPath: string, fg: PIXI.TextureSource | PIXI.ColorSource, bg: PIXI.TextureSource | PIXI.ColorSource, lerp?: PIXI.TextureSource | PIXI.ColorSource) {
    const obj = typeof arg === "string" ? fromUuidSync(arg) : arg;
    if (!(obj instanceof foundry.abstract.Document)) throw new InvalidUUIDError(arg);

    super(0, 0, fg, bg, lerp);
    if (!this.isValidPath(obj, valuePath)) throw new InvalidResourcePathError(valuePath);
    if (!this.isValidPath(obj, maxPath)) throw new InvalidResourcePathError(maxPath);

    this.uuid = obj.uuid;
    this.maxPath = maxPath;
    this.valuePath = valuePath;

    this.updateText();
    this.updateSprites();
  }

}