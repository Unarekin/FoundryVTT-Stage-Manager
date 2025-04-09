import { ProgressStageObject } from "./ProgressStageObject";
import { coerceColor, coerceTexture } from "coercion";
import { InvalidTextureError } from "errors";
import { ObservableBorder } from "./ObservableBorder";
import { SerializedProgressBarStageObject, Border } from "types";
import { serializeTexture } from "lib/textureSerialization";

export class ProgressBarStageObject extends ProgressStageObject {

  public static readonly type = "progressBar";
  public readonly type = ProgressBarStageObject.type;

  public readonly bgObject: PIXI.NineSlicePlane;
  public readonly fgObject: PIXI.NineSlicePlane;
  public readonly lerpObject: PIXI.NineSlicePlane;

  protected bgSource = "";
  protected fgSource = "";
  protected lerpSource = "";

  private _textAlignment: "left" | "right" | "center" = "center";
  public get textAlignment() { return this._textAlignment; }
  public set textAlignment(val) {
    if (this.textAlignment !== val) {
      this._textAlignment = val;
      this.dirty = true;
      this.updateText();
    }
  }

  public get fgBlendMode() { return this.fgObject.blendMode; }
  public set fgBlendMode(val) {
    if (this.fgBlendMode !== val) {
      this.fgObject.blendMode = val;
      this.dirty = true;
    }
  }

  public get bgBlendMode() { return this.bgObject.blendMode; }
  public set bgBlendMode(val) {
    if (this.bgBlendMode !== val) {
      this.bgObject.blendMode = val;
      this.dirty = true;
    }
  }

  public get lerpBlendMode() { return this.lerpObject.blendMode; }
  public set lerpBlendMode(val) {
    if (this.lerpBlendMode !== val) {
      this.lerpObject.blendMode = val;
      this.dirty = true;
    }
  }

  public get fgTint() { return this.fgObject.tint; }
  public set fgTint(val) {
    if (this.fgTint !== val) {
      this.fgObject.tint = val;
      this.dirty = true;
    }
  }

  public get bgTint() { return this.bgObject.tint; }
  public set bgTint(val) {
    if (this.bgTint !== val) {
      this.bgObject.tint = val;
      this.dirty = true;
    }
  }

  public get lerpTint() { return this.lerpObject.tint; }
  public set lerpTint(val) {
    if (this.lerpTint !== val) {
      this.lerpObject.tint = val;
      this.dirty = true;
    }
  }

  public static deserialize(serialized: SerializedProgressBarStageObject): ProgressBarStageObject {
    const obj = new ProgressBarStageObject(serialized.value, serialized.max, serialized.fgSprite, serialized.bgSprite, serialized.lerpSprite);
    obj.deserialize(serialized);
    return obj;
  }

  public deserialize(serialized: SerializedProgressBarStageObject) {
    super.deserialize(serialized);
    if (serialized.bgSprite) {
      this.bgObject.texture = PIXI.Texture.from(serialized.bgSprite);
      this.bgSource = serialized.bgSprite;
    }
    if (serialized.fgSprite) {
      this.fgObject.texture = PIXI.Texture.from(serialized.fgSprite);
      this.fgSource = serialized.fgSprite;
    }
    if (serialized.lerpSprite) {
      this.lerpObject.texture = PIXI.Texture.from(serialized.lerpSprite);
      this.lerpSource = serialized.lerpSprite;
    }

    if (typeof serialized.clamp === "boolean") this.clamp = serialized.clamp;

    if (serialized.fgBorder) {
      if (typeof serialized.fgBorder.left === "number") this.fgBorder.left = serialized.fgBorder.left;
      if (typeof serialized.fgBorder.right === "number") this.fgBorder.right = serialized.fgBorder.right;
      if (typeof serialized.fgBorder.top === "number") this.fgBorder.top = serialized.fgBorder.top;
      if (typeof serialized.fgBorder.bottom === "number") this.fgBorder.bottom = serialized.fgBorder.bottom;
    }

    if (serialized.bgBorder) {
      if (typeof serialized.bgBorder.left === "number") this.bgBorder.left = serialized.bgBorder.left;
      if (typeof serialized.bgBorder.right === "number") this.bgBorder.right = serialized.bgBorder.right;
      if (typeof serialized.bgBorder.top === "number") this.bgBorder.top = serialized.bgBorder.top;
      if (typeof serialized.bgBorder.bottom === "number") this.bgBorder.bottom = serialized.bgBorder.bottom;
    }

    if (serialized.lerpBorder) {
      if (typeof serialized.lerpBorder.left === "number") this.lerpBorder.left = serialized.lerpBorder.left;
      if (typeof serialized.lerpBorder.right === "number") this.lerpBorder.right = serialized.lerpBorder.right;
      if (typeof serialized.lerpBorder.top === "number") this.lerpBorder.top = serialized.lerpBorder.top;
      if (typeof serialized.lerpBorder.bottom === "number") this.lerpBorder.bottom = serialized.lerpBorder.bottom;
    }

    if (typeof serialized.fgBlendMode === "string") this.fgBlendMode = serialized.fgBlendMode;
    if (typeof serialized.bgBlendMode === "string") this.bgBlendMode = serialized.bgBlendMode;
    if (typeof serialized.lerpBlendMode === "string") this.lerpBlendMode = serialized.lerpBlendMode;

    if (typeof serialized.fgTint === "string") this.fgTint = serialized.fgTint;
    if (typeof serialized.bgTint === "string") this.bgTint = serialized.bgTint;
    if (typeof serialized.lerpTint === "string") this.lerpTint = serialized.lerpTint;

    if (serialized.fgPadding) {
      if (typeof serialized.fgPadding.left === "number") this.fgPadding.left = serialized.fgPadding.left;
      if (typeof serialized.fgPadding.right === "number") this.fgPadding.right = serialized.fgPadding.right;
      if (typeof serialized.fgPadding.top === "number") this.fgPadding.top = serialized.fgPadding.top;
      if (typeof serialized.fgPadding.bottom === "number") this.fgPadding.bottom = serialized.fgPadding.bottom;
    }

    if (typeof serialized.textAlignment === "string") this.textAlignment = serialized.textAlignment;
  }

  public serialize(): SerializedProgressBarStageObject {
    const serialized = super.serialize();
    return {
      ...serialized,
      type: this.type,
      bgSprite: this.bgSource,
      fgSprite: this.fgSource,
      lerpSprite: this.lerpSource,
      bounds: {
        ...serialized.bounds,
        width: this.width / this.actualBounds.width,
        height: this.height / this.actualBounds.height
      },
      fgBorder: {
        left: this.fgBorder.left,
        right: this.fgBorder.right,
        top: this.fgBorder.top,
        bottom: this.fgBorder.bottom
      },
      bgBorder: {
        left: this.bgBorder.left,
        right: this.bgBorder.right,
        top: this.bgBorder.top,
        bottom: this.bgBorder.bottom
      },
      lerpBorder: {
        left: this.lerpBorder.left,
        right: this.lerpBorder.right,
        top: this.lerpBorder.top,
        bottom: this.lerpBorder.bottom
      },
      fgBlendMode: this.fgBlendMode,
      bgBlendMode: this.bgBlendMode,
      lerpBlendMode: this.lerpBlendMode,
      fgTint: new PIXI.Color(this.fgTint).toHexa(),
      bgTint: new PIXI.Color(this.bgTint).toHexa(),
      lerpTint: new PIXI.Color(this.lerpTint).toHexa(),
      fgPadding: {
        left: this.fgPadding.left,
        right: this.fgPadding.right,
        top: this.fgPadding.top,
        bottom: this.fgPadding.bottom
      },
      textAlignment: this.textAlignment
    }
  }

  private _bgBorder = new ObservableBorder(0, 0, 0, 0, (left, right, top, bottom) => {
    this.bgObject.leftWidth = left;
    this.bgObject.rightWidth = right;
    this.bgObject.topHeight = top;
    this.bgObject.bottomHeight = bottom;
    this.dirty = true;
    this.updateSprites();
  });

  public get bgBorder(): ObservableBorder { return this._bgBorder; }
  public set bgBorder(val: number | Border) {
    if (typeof val === "number") {
      this._bgBorder.left = val;
      this._bgBorder.right = val;
      this._bgBorder.top = val;
      this._bgBorder.bottom = val;
    } else {
      if (typeof val.left === "number") this._bgBorder.left = val.left;
      if (typeof val.right === "number") this._bgBorder.right = val.right;
      if (typeof val.top === "number") this._bgBorder.top = val.top;
      if (typeof val.bottom === "number") this._bgBorder.bottom = val.bottom;
    }
  }



  private _fgBorder = new ObservableBorder(0, 0, 0, 0, (left, right, top, bottom) => {
    this.fgObject.leftWidth = left;
    this.fgObject.rightWidth = right;
    this.fgObject.topHeight = top;
    this.fgObject.bottomHeight = bottom;
    this.dirty = true;
    this.updateSprites();
  });

  public get fgBorder(): ObservableBorder { return this._fgBorder; }
  public set fgBorder(val: number | Border) {
    if (typeof val === "number") {
      this._fgBorder.left = val;
      this._fgBorder.right = val;
      this._fgBorder.top = val;
      this._fgBorder.bottom = val;
    } else {
      if (typeof val.left === "number") this._fgBorder.left = val.left;
      if (typeof val.right === "number") this._fgBorder.right = val.right;
      if (typeof val.top === "number") this._fgBorder.top = val.top;
      if (typeof val.bottom === "number") this._fgBorder.bottom = val.bottom;
    }
  }

  private _lerpBorder = new ObservableBorder(0, 0, 0, 0, (left, right, top, bottom) => {
    this.lerpObject.leftWidth = left;
    this.lerpObject.rightWidth = right;
    this.lerpObject.topHeight = top;
    this.lerpObject.bottomHeight = bottom;
    this.dirty = true;
    this.updateSprites();
  })
  public get lerpBorder(): ObservableBorder { return this._lerpBorder; }
  public set lerpBorder(val: number | Border) {
    if (typeof val === "number") {
      this._lerpBorder.left = val;
      this._lerpBorder.right = val;
      this._lerpBorder.top = val;
      this._lerpBorder.bottom = val;
    } else {
      if (typeof val.left === "number") this._lerpBorder.left = val.left;
      if (typeof val.right === "number") this._lerpBorder.right = val.right;
      if (typeof val.top === "number") this._lerpBorder.top = val.top;
      if (typeof val.bottom === "number") this._lerpBorder.bottom = val.bottom;
    }
  }

  private _fgPadding = new ObservableBorder(0, 0, 0, 0, () => {
    this.dirty = true;
    this.updateSprites();
  });
  public get fgPadding(): ObservableBorder { return this._fgPadding; }
  public set fgPadding(val: number | Border) {
    if (typeof val === "number") {
      this._fgPadding.left = val;
      this._fgPadding.right = val;
      this._fgPadding.top = val;
      this._fgPadding.bottom = val;
    } else {
      if (typeof val.left === "number") this._fgPadding.left = val.left;
      if (typeof val.right === "number") this._fgPadding.right = val.right;
      if (typeof val.top === "number") this._fgPadding.top = val.top;
      if (typeof val.bottom === "number") this._fgPadding.bottom = val.bottom;
    }
  }

  protected updateText(overrideValue?: number) {
    super.updateText(overrideValue);


    // Align text
    switch (this.textAlignment) {
      case "left":
        this.textObject.anchor.x = 0;
        this.textObject.x = 0;
        break;
      case "right":
        this.textObject.anchor.x = 1;
        this.textObject.x = 0;
        break;
      case "center":
        this.textObject.anchor.x = 0.5;
        this.textObject.x = this.width / 2;
        break;
    }
  }

  private _barUpdateTween: Record<string, unknown> | undefined = undefined;
  protected animateSpriteUpdate(start: number, end: number): Promise<void> {
    if (this._barUpdateTween && typeof this._barUpdateTween.kill === "function") this._barUpdateTween.kill();
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this._barUpdateTween = gsap.timeline({
        paused: true,
        onComplete: () => {
          this.updateSprites();
          resolve();
        },
        onInterrupt: reject
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const firstTween = gsap.to({ value: start }, {
        value: end,
        duration: this.primaryLerpTime / 1000,
        ease: this.lerpEasing,
        onUpdate: () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const val = start + ((end - start) * firstTween.ratio);
          this.updateSprites(val, true);
        }
      });
      if (typeof this._barUpdateTween?.add === "function") this._barUpdateTween.add(firstTween);

      // Add LERP tween
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const lerpTween = gsap.to({ value: start }, {
        value: end,
        duration: this.secondaryLerpTime / 1000,
        ease: this.lerpEasing,
        onUpdate: () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const val = start + ((end - start) * lerpTween.ratio);
          const perc = val / this.max;
          this.lerpObject.width = (this.bgObject.width - this.fgPadding.right - this.fgPadding.left) * perc;
        }
      });

      if (typeof this._barUpdateTween?.add === "function") this._barUpdateTween.add(lerpTween, ">");

      if (typeof this._barUpdateTween?.play === "function") this._barUpdateTween.play();
    })
  }

  protected updateSprites(overrideValue?: number, ignoreLerpBar = false): void {
    if (!(this.fgObject instanceof PIXI.NineSlicePlane && this.bgObject instanceof PIXI.NineSlicePlane && this.lerpObject instanceof PIXI.NineSlicePlane)) return;

    // Line up foreground and lerp objects
    this.fgObject.x = this.lerpObject.x = this.fgPadding.left;
    this.fgObject.y = this.lerpObject.y = this.fgPadding.top;
    this.fgObject.height = this.lerpObject.height = this.height - this.fgPadding.top - this.fgPadding.bottom;

    const perc = (overrideValue ?? this.value) / this.max;
    this.fgObject.width = (this.bgObject.width - this.fgPadding.right - this.fgPadding.left) * perc;
    if (!ignoreLerpBar) this.lerpObject.width = this.fgObject.width;
  }

  public get width() { return this.bgObject?.width ?? 0; }
  public set width(val) {
    if (this.width !== val) {
      this.bgObject.width = val;
      this.dirty = true;
      this.updateText();
      this.updateSprites();
    }
  }

  public get height() { return this.bgObject?.height ?? 0; }
  public set height(val) {
    if (this.height !== val) {
      this.bgObject.height = val;
      this.dirty = true;
      this.updateText();
      this.updateSprites();
    }
  }

  /** Actually a GSAP Timeline object  */
  protected lerpTimeline: Record<string, unknown> | undefined = undefined;

  protected async lerpValueTo(value: number): Promise<void> {
    if (this.lerpTimeline && typeof this.lerpTimeline.kill === "function") this.lerpTimeline.kill();


    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const tl: Record<string, any> = gsap.timeline({
        onComplete: resolve,
        onInterrupt: reject,
        paused: true
      });

      const newWidth = (this.width - this.fgPadding.left - this.fgPadding.right) * (value / this.max);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      tl.to(this.fgObject, { width: newWidth, duration: this.primaryLerpTime / 1000, ease: this.lerpEasing });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      tl.to(this.lerpObject, { width: newWidth, duration: this.secondaryLerpTime / 1000, ease: this.lerpEasing }, ">")

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      tl.play();
    });
  }

  protected coerceSprite(source: PIXI.ColorSource | PIXI.TextureSource): PIXI.NineSlicePlane {
    const texture = coerceTexture(source);
    if (!(texture instanceof PIXI.Texture)) throw new InvalidTextureError();

    return new PIXI.NineSlicePlane(texture);
  }

  protected cloneNineSlice(obj: PIXI.NineSlicePlane): PIXI.NineSlicePlane {
    const newObj = new PIXI.NineSlicePlane(obj.texture.clone());
    newObj.leftWidth = obj.leftWidth;
    newObj.rightWidth = obj.rightWidth;
    newObj.topHeight = obj.topHeight;
    newObj.bottomHeight = obj.bottomHeight;

    return obj;
  }

  public createDragGhost(): PIXI.Container {
    const container = new PIXI.Container();
    const bg = this.cloneNineSlice(this.bgObject);
    const fg = this.cloneNineSlice(this.fgObject);

    const text = new PIXI.HTMLText(this.textObject.text);
    text.style = this.textStyle.clone();
    text.anchor.x = this.textObject.anchor.x;
    text.anchor.y = this.textObject.anchor.y;

    container.addChild(bg);
    container.addChild(fg);
    container.addChild(text);

    fg.x = this.fgPadding.left;
    fg.y = this.fgPadding.top;
    fg.height = this.height - this.fgPadding.top - this.fgPadding.bottom;
    fg.width = (this.value / this.max) * (this.width - this.fgPadding.left - this.fgPadding.right);

    switch (this.textAlignment) {
      case "left":
        text.anchor.x = 0;
        text.x = 0;
        break;
      case "right":
        text.anchor.x = 1;
        text.x = bg.width;
        break;
      case "center":
        text.anchor.x = 0.5;
        text.x = bg.width / 2;
        break;
    }

    return container;
  }

  protected coerceSpriteSource(source: PIXI.ColorSource | PIXI.TextureSource): string | undefined {
    if (typeof source === "string") return source;
    const color = coerceColor(source);
    if (color instanceof PIXI.Color) return color.toHexa();
    const texture = coerceTexture(source);
    if (texture) {
      const serialized = serializeTexture(texture)
      if (typeof serialized === "string") return serialized;
    }
  }

  constructor(value: number, max: number, fg: PIXI.TextureSource | PIXI.ColorSource, bg: PIXI.TextureSource | PIXI.ColorSource, lerp: PIXI.TextureSource | PIXI.ColorSource = "transparent") {
    super();

    this.bgSource = this.coerceSpriteSource(bg) ?? "";
    if (!this.bgSource) throw new InvalidTextureError();
    this.fgSource = this.coerceSpriteSource(fg) ?? "";
    if (!this.fgSource) throw new InvalidTextureError();
    this.lerpSource = this.coerceSpriteSource(lerp) ?? "";
    if (!this.lerpSource) throw new InvalidTextureError();

    this.bgObject = this.coerceSprite(bg);
    this.fgObject = this.coerceSprite(fg);
    this.lerpObject = this.coerceSprite(lerp);

    this.displayObject.addChild(this.bgObject);
    this.displayObject.addChild(this.lerpObject);
    this.displayObject.addChild(this.fgObject);

    this.displayObject.removeChild(this.textObject);
    this.displayObject.addChild(this.textObject);

    this.max = max;
    this.value = value;
    this.updateText();
    this.updateSprites();
  }

}