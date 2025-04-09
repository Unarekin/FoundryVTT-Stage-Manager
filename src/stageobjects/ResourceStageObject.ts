import { ActorResource, Border, Easing, ResourceFGSizeMode, ResourceTextMode, SerializedResourceStageObject } from "types";
import { StageObject } from "./StageObject";
import { coerceActor, coerceTexture } from "coercion";
import { InvalidActorError, InvalidResourcePathError, InvalidTextureError } from "errors";
import { ObservableBorder } from "./ObservableBorder";
import { unloadVideoTexture } from '../lib/videoTextures';


export class ResourceStageObject extends StageObject<PIXI.Container> {
  public static readonly type = "resource";
  public readonly type = ResourceStageObject.type;

  public readonly fgObject: PIXI.NineSlicePlane;
  public readonly bgObject: PIXI.NineSlicePlane;
  public readonly lerpObject: PIXI.NineSlicePlane;
  public readonly textObject: PIXI.HTMLText = new PIXI.HTMLText();

  private _textMode: ResourceTextMode = "none";
  public get textMode() { return this._textMode; }
  public set textMode(val) {
    if (val !== this.textMode) {
      this._textMode = val;
      this.dirty = true;
      this.textObject.renderable = val !== "none";

      switch (val) {
        case "values":
          this.textObject.text = `${this.value?.toLocaleString()} / ${this.max?.toLocaleString()}`;
          break;
        case "percentage":
          this.textObject.text = `${Math.floor(((this.value ?? 0) / (this.max ?? 0)) * 100)}%`;
          break;
      }

      this.updateValue();
    }
  }


  private _bg = "black";
  private _fg = "red";
  private _lerp = "gray";

  public primaryLerpTime = 1000;
  public primaryLerpEasing: Easing = "sine.inOut";

  public secondaryLerpTime = 500;
  public secondaryLerpEasing: Easing = "sine.inOut";

  public get fg() { return this._fg; }
  public set fg(val) {
    if (val !== this.fg) {
      this._fg = val;
      if (this.fgObject instanceof PIXI.NineSlicePlane) unloadVideoTexture(this.fgObject.texture);

      const texture = coerceTexture(val);
      if (!(texture instanceof PIXI.Texture)) throw new InvalidTextureError();
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  protected getResource(): ActorResource | undefined { return foundry.utils.getProperty(this.actor, `system.${this.resourcePath}`); }

  public get value(): number | undefined {
    const res = this.getResource();
    return res?.value;
  }

  public get max(): number | undefined {
    const res = this.getResource();
    return res?.max;
  }

  public get min(): number | undefined {
    const res = this.getResource();
    return res?.min;
  }

  public get bg() { return this._bg; }
  public set bg(val) {
    if (val !== this.bg) {
      this._bg = val;
      if (this.bgObject instanceof PIXI.NineSlicePlane) unloadVideoTexture(this.bgObject.texture);
      const texture = coerceTexture(val);
      if (!(texture instanceof PIXI.Texture)) throw new InvalidTextureError();
      this.bgObject.texture = texture;
    }
  }

  private _actor: Actor;
  public get actor(): Actor { return this._actor; }
  public set actor(val: Actor | string) {
    const actor = val instanceof Actor ? val : coerceActor(val);
    if (!(actor instanceof Actor)) throw new InvalidActorError(val);
    if (this.actor !== actor) {
      this._actor = actor;
      this.updateValue();
      this.dirty = true;
    }
  }

  public get textStyle() { return this.textObject.style; }
  public set textStyle(val) {
    if (!foundry.utils.objectsEqual(val, this.textStyle)) {
      this.dirty = true;
      this.textObject.style = val;
    }
  }

  private _resourcePath = "";
  public get resourcePath() { return this._resourcePath; }
  public set resourcePath(val) {
    if (this.resourcePath !== val) {
      this._resourcePath = val;
      this.updateValue();
      this.dirty = true;
    }
  }

  private _lastResourceValue = 0;

  public updateValue() {

    const max = this.max;
    const value = this.value;

    if (typeof max === "undefined" || typeof value === "undefined") throw new InvalidResourcePathError(this.resourcePath);

    const min = this.min ?? 0;

    const perc = (value - min) / (max - min);

    if (this.fgObject instanceof PIXI.NineSlicePlane && this.bgObject instanceof PIXI.NineSlicePlane) {
      this.fgObject.x = this.fgPadding.left;
      this.fgObject.y = this.fgPadding.top;
      this.fgObject.height = this.bgObject.height - (this.fgPadding.top + this.fgPadding.bottom);

      this.textObject.x = this.width / 2;
      this.textObject.y = this.height / 2;

      if (perc !== this._lastResourceValue) {
        // Our actual resource value has changed, time to interpolate
        this.fgObject.width = (this.bgObject.width - (this.fgPadding.left + this.fgPadding.right)) * this._lastResourceValue;
        void this.animateBarChange(perc).then(() => {
          switch (this.textMode) {
            case "values":
              this.textObject.text = `${value.toLocaleString()} / ${max.toLocaleString()}`;
              break;
            case "percentage":
              this.textObject.text = `${Math.floor(perc * 100)}%`;
              break;
          }
        });
        this._lastResourceValue = perc;
      } else {
        this.fgObject.width = (this.bgObject.width - (this.fgPadding.left + this.fgPadding.right)) * perc;
      }

    }
  }

  protected async animateBarChange(val: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    gsap.killTweensOf(this.fgObject);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    gsap.killTweensOf(this.lerpObject);

    this.lerpObject.x = this.fgObject.x;
    this.lerpObject.y = this.fgObject.y;
    this.lerpObject.height = this.fgObject.height;
    this.lerpObject.width = this.fgObject.width;

    this.lerpObject.renderable = true;

    const width = (this.bgObject.width - (this.fgPadding.left + this.fgPadding.right)) * val;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await gsap.to(this.fgObject, {
      width,
      duration: this.primaryLerpTime / 1000,
      ease: this.primaryLerpEasing,
      onUpdate: () => {
        const perc = this.fgObject.width / (this.bgObject.width - (this.fgPadding.left + this.fgPadding.right));

        switch (this.textMode) {
          case "values":
            this.textObject.text = `${Math.floor((this.max ?? 0) * perc).toLocaleString()} / ${this.max?.toLocaleString()}`;
            break;
          case "percentage":
            this.textObject.text = `${Math.floor(perc * 100)}%`;
            break;
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    await gsap.to(this.lerpObject, { width, duration: this.secondaryLerpTime / 1000, ease: this.secondaryLerpEasing });
    this.lerpObject.renderable = false;
  }

  private _fgPadding: ObservableBorder;
  public get fgPadding(): ObservableBorder { return this._fgPadding; }
  public set fgPadding(val: number | Partial<Border>) {
    this.dirty = this.fgPadding.set(val);
  }

  private _fgBorders: ObservableBorder;
  public get fgBorders(): ObservableBorder { return this._fgBorders; }
  public set fgBorders(val: number | Partial<Border>) {
    this.dirty = this._fgBorders.set(val);
  }

  private _bgBorders: ObservableBorder;
  public get bgBorders(): ObservableBorder { return this._bgBorders; }
  public set bgBorders(val: number | Partial<Border>) {
    this.dirty = this._bgBorders.set(val);
  }

  private _fgSizeMode: ResourceFGSizeMode = "stretch";
  public get fgSizeMode() { return this._fgSizeMode; }
  public set fgSizeMode(val) {
    if (val !== this.fgSizeMode) {
      this._fgSizeMode = val;
      this.updateValue();
      this.dirty = true;
    }
  }

  public serialize(): SerializedResourceStageObject {

    // Generate diffed style
    const style = JSON.parse(JSON.stringify(this.textStyle)) as Record<string, unknown>;
    for (const key in style) {
      if (key.startsWith("_")) {
        style[key.substring(1)] = style[key];
        delete style[key];
      }
    }

    const diffed = foundry.utils.diffObject(PIXI.HTMLTextStyle.defaultStyle, style) as Record<string, unknown>;
    delete diffed.styleID;

    return {
      ...super.serialize(),
      type: this.type,
      textMode: this.textMode,
      textStyle: diffed,
      fg: this.fg,
      bg: this.bg,
      resourcePath: this.resourcePath,
      fgSizeMode: this.fgSizeMode,
      actor: this.actor.uuid,
      primaryLerpTime: this.primaryLerpTime,
      primaryLerpEasing: this.primaryLerpEasing,
      secondaryLerpTime: this.secondaryLerpTime,
      secondaryLerpEasing: this.secondaryLerpEasing,
      lerpTexture: this._lerp,
      fgPadding: {
        left: this.fgPadding.left,
        right: this.fgPadding.right,
        top: this.fgPadding.top,
        bottom: this.fgPadding.bottom
      },
      fgBorders: {
        left: this.fgBorders.left,
        right: this.fgBorders.right,
        top: this.fgBorders.top,
        bottom: this.fgBorders.bottom
      },
      bgBorders: {
        left: this.bgBorders.left,
        right: this.bgBorders.right,
        top: this.bgBorders.top,
        bottom: this.bgBorders.bottom
      }
    }
  }

  public static deserialize(serialized: SerializedResourceStageObject): ResourceStageObject {
    const actor = coerceActor(serialized.actor);
    if (!(actor instanceof Actor)) throw new InvalidActorError(serialized.actor);

    const obj = new ResourceStageObject(actor, serialized.resourcePath, serialized.bg, serialized.fg, serialized.lerpTexture ?? "transparent");
    obj.deserialize(serialized);
    return obj;
  }

  public deserialize(serialized: SerializedResourceStageObject) {
    super.deserialize(serialized);

    if (typeof serialized.bg === "string") this.bg = serialized.bg;
    if (typeof serialized.fg === "string") this.fg = serialized.fg;
    if (typeof serialized.lerpTexture === "string") this._lerp = serialized.lerpTexture;

    if (typeof serialized.textStyle !== "undefined") this.textStyle = serialized.textStyle as unknown as PIXI.HTMLTextStyle;

    if (typeof serialized.primaryLerpEasing === "string") this.primaryLerpEasing = serialized.primaryLerpEasing;
    if (typeof serialized.primaryLerpTime === "number") this.primaryLerpTime = serialized.primaryLerpTime;
    if (typeof serialized.secondaryLerpEasing === "string") this.secondaryLerpEasing = serialized.secondaryLerpEasing;
    if (typeof serialized.secondaryLerpTime === "number") this.secondaryLerpTime = serialized.secondaryLerpTime;
    if (typeof serialized.textMode === "string") this.textMode = serialized.textMode;
    if (typeof serialized.resourcePath === "string") this.resourcePath = serialized.resourcePath;
    if (typeof serialized.fgSizeMode === "string") this.fgSizeMode = serialized.fgSizeMode;

    if (typeof serialized.fgPadding !== "undefined") {
      if (typeof serialized.fgPadding.left === "number") this.fgPadding.left = serialized.fgPadding.left;
      if (typeof serialized.fgPadding.right === "number") this.fgPadding.right = serialized.fgPadding.right;
      if (typeof serialized.fgPadding.top === "number") this.fgPadding.top = serialized.fgPadding.top;
      if (typeof serialized.fgPadding.bottom === "number") this.fgPadding.bottom = serialized.fgPadding.bottom;
    }

    if (typeof serialized.fgBorders !== "undefined") {
      if (typeof serialized.fgBorders.left === "number") this.fgBorders.left = serialized.fgBorders.left;
      if (typeof serialized.fgBorders.right === "number") this.fgBorders.right = serialized.fgBorders.right;
      if (typeof serialized.fgBorders.top === "number") this.fgBorders.top = serialized.fgBorders.top;
      if (typeof serialized.fgBorders.bottom === "number") this.fgBorders.bottom = serialized.fgBorders.bottom;
    }

    if (typeof serialized.bgBorders !== "undefined") {
      if (typeof serialized.bgBorders.left === "number") this.bgBorders.left = serialized.bgBorders.left;
      if (typeof serialized.bgBorders.right === "number") this.bgBorders.right = serialized.bgBorders.right;
      if (typeof serialized.bgBorders.top === "number") this.bgBorders.top = serialized.bgBorders.top;
      if (typeof serialized.bgBorders.bottom === "number") this.bgBorders.bottom = serialized.bgBorders.bottom;
    }

    this.updateValue();
  }

  public macroArguments(): { label: string; value: string; key: string; }[] {
    return [
      ...super.macroArguments(),
      { label: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.RESOURCE", key: "resource", value: "STAGEMANAGER.ADDTRIGGERDIALOG.ARGS.AUTO" }
    ];
  }

  public createDragGhost(): PIXI.Container<PIXI.DisplayObject> {
    const container = new PIXI.Container();
    const bg = this.coerceSprite(this.bg);
    const fg = this.coerceSprite(this.fg);
    container.addChild(bg);
    container.addChild(fg);

    bg.width = this.bgObject.width;
    bg.height = this.bgObject.height;
    bg.leftWidth = this.bgObject.leftWidth;
    bg.rightWidth = this.bgObject.rightWidth;
    bg.topHeight = this.bgObject.topHeight;
    bg.bottomHeight = this.bgObject.bottomHeight;

    fg.width = this.fgObject.width;
    fg.height = this.fgObject.height;
    fg.leftWidth = this.fgObject.leftWidth;
    fg.rightWidth = this.fgObject.rightWidth;
    fg.topHeight = this.fgObject.topHeight;
    fg.bottomHeight = this.fgObject.bottomHeight;

    const text = new PIXI.HTMLText(this.textObject.text);
    text.style = foundry.utils.mergeObject({}, this.textStyle);
    text.anchor.x = 0.5;
    text.anchor.y = 0.5;
    container.addChild(text);
    text.x = container.width / 2;
    text.y = container.height / 2;

    return container;
  }

  protected coerceSprite(source: PIXI.ColorSource | PIXI.TextureSource): PIXI.NineSlicePlane {
    const texture = coerceTexture(source);
    if (!(texture instanceof PIXI.Texture)) throw new InvalidTextureError();

    const plane = new PIXI.NineSlicePlane(texture);
    return plane;
  }

  public get width() { return this.bgObject.width; }
  public set width(val) {
    if (val !== this.width) {
      this.bgObject.width = val;
      this.updateValue();
      this.dirty = true;
    }
  }

  public get height() { return this.bgObject.height; }
  public set height(val) {
    if (val !== this.height) {
      this.bgObject.height = val;
      this.updateValue();
      this.dirty = true;
    }
  }

  constructor(actor: Actor, resourcePath: string, bg: string, fg: string, lerp = "transparent") {
    const container = new PIXI.Container();
    super(container);

    this.resizable = true;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const resource = foundry.utils.getProperty(actor, `system.${resourcePath}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!resource || typeof resource.value === "undefined" || typeof resource.max === "undefined")
      throw new InvalidResourcePathError(resourcePath);

    this._actor = actor;
    this.resourcePath = resourcePath;

    this._fg = fg;
    this._bg = bg;
    this._lerp = lerp;

    this.bgObject = this.coerceSprite(bg);
    this.fgObject = this.coerceSprite(fg);

    this._bgBorders = new ObservableBorder(
      this.bgObject.leftWidth, this.bgObject.rightWidth, this.bgObject.topHeight, this.bgObject.bottomHeight,
      (left, right, top, bottom) => {
        this.bgObject.leftWidth = left;
        this.bgObject.rightWidth = right;
        this.bgObject.topHeight = top;
        this.bgObject.bottomHeight = bottom;
        this.updateValue();
      }
    );

    this._fgBorders = new ObservableBorder(
      this.fgObject.leftWidth, this.fgObject.rightWidth, this.fgObject.topHeight, this.fgObject.bottomHeight,
      (left, right, top, bottom) => {
        this.fgObject.leftWidth = left;
        this.fgObject.rightWidth = right;
        this.fgObject.topHeight = top;
        this.fgObject.bottomHeight = bottom;
        this.updateValue();
      }
    );

    this._fgPadding = new ObservableBorder(
      0, 0, 0, 0,
      () => { this.updateValue(); }
    );


    this.lerpObject = this.coerceSprite(lerp ?? "transparent");
    this.lerpObject.renderable = false;

    container.addChild(this.bgObject);
    container.addChild(this.lerpObject);
    container.addChild(this.fgObject);
    container.addChild(this.textObject);

    this.bgObject.zIndex = 0;
    this.lerpObject.zIndex = 5;
    this.fgObject.zIndex = 10;
    this.textObject.zIndex = 15;

    this.displayObject.sortableChildren = true;

    this.width = 128;
    this.height = 64;

    this.textObject.anchor.x = 0.5;
    this.textObject.anchor.y = 0.5;
    this.textObject.x = this.width / 2;
    this.textObject.y = this.height / 2;

    this.updateValue();
  }

}