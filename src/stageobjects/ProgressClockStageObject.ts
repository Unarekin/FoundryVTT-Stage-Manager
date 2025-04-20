import { coerceColor, coerceTexture } from 'coercion';
import { ProgressStageObject } from './ProgressStageObject';
import { serializeTexture } from 'lib/textureSerialization';
import { CanvasNotInitializedError, InvalidTextureError } from 'errors';
import { ObservableBorder } from './ObservableBorder';
import { Border, SerializedProgressClockStageObject } from 'types';
import { ProgressClockStageObjectApplication, StageObjectApplication } from 'applications';

export class ProgressClockStageObject extends ProgressStageObject {

  public static readonly type: string = "progressClock";
  public readonly type: string = ProgressClockStageObject.type;

  public static readonly ApplicationType = ProgressClockStageObjectApplication as typeof StageObjectApplication;
  public readonly ApplicationType = ProgressClockStageObject.ApplicationType;

  private _bgObject: PIXI.Sprite;
  private _fgObject: PIXI.Sprite;
  private _lerpObject: PIXI.Sprite;

  private _bgSource: string;
  private _fgSource: string;
  private _lerpSource: string;

  private _textHAlignment: "left" | "center" | "right" = "center";
  private _textVAlignment: "top" | "center" | "bottom" = "bottom";
  public get textHAlignment() { return this._textHAlignment; }
  public set textHAlignment(val) {
    if (this.textHAlignment !== val) {
      this._textHAlignment = val;
      this.dirty = true;
      this.updateText();
    }
  }

  public get textVAlignment() { return this._textVAlignment; }
  public set textVAlignment(val) {
    if (this.textVAlignment !== val) {
      this._textVAlignment = val;
      this.dirty = true;
      this.updateText();
    }
  }

  protected updateText(overrideValue?: number) {
    super.updateText(overrideValue);

    switch (this.textHAlignment) {
      case "left":
        this.textObject.anchor.x = 0;
        this.textObject.x = 0;
        break;
      case "center":
        this.textObject.anchor.x = 0.5;
        this.textObject.x = this.width / 2;
        break;
      case "right":
        this.textObject.anchor.x = 1;
        this.textObject.x = this.width;
        break;
    }

    switch (this.textVAlignment) {
      case "top":
        this.textObject.anchor.y = 0;
        this.textObject.y = 0;
        break;
      case "center":
        this.textObject.anchor.y = 0.5;
        this.textObject.y = this.height / 2;
        break;
      case "bottom":
        this.textObject.anchor.y = 1;
        this.textObject.y = this.height;
    }
  }

  private _swapLayers = false;
  public get swapLayers() { return this._swapLayers; }
  public set swapLayers(val) {
    if (this.swapLayers !== val) {
      this._swapLayers = val;
      this.dirty = true;
      this.updateSprites();
    }
  }

  protected readonly maskCanvas: HTMLCanvasElement;
  protected readonly maskSprite: PIXI.Sprite;

  protected readonly lerpMaskCanvas: HTMLCanvasElement;
  protected readonly lerpMaskSprite: PIXI.Sprite;

  public get bgSource() { return this._bgSource; }
  public set bgSource(val) {
    if (this.bgSource !== val) {
      const { width, height } = this;
      const texture = coerceTexture(val);
      if (!(texture instanceof PIXI.Texture)) throw new InvalidTextureError();
      this._bgSource = val;
      if (!texture.valid) {
        texture.baseTexture.once("loaded", () => {
          this.bgObject.texture = texture;
          this.width = width;
          this.height = height;
          this.updateSprites();
          this.dirty = true;
        });
      } else {
        this.bgObject.texture = texture;
        this.width = width;
        this.height = height;
        this.updateSprites();
        this.dirty = true;
      }
    }
  }

  public get fgSource() { return this._fgSource; }
  public set fgSource(val) {
    if (this.fgSource !== val) {
      this._fgSource = val;
      const texture = coerceTexture(val);
      if (!(texture instanceof PIXI.Texture)) throw new InvalidTextureError();

      if (!texture.valid) {
        texture.baseTexture.once("loaded", () => {
          this.fgObject.texture = texture;
          this.fgObject.mask = this.maskSprite;
          this.updateSprites();
          this.dirty = true;
        })
      } else {
        this.fgObject.texture = texture;
        this.fgObject.mask = this.maskSprite;
        this.updateSprites();
        this.dirty = true;
      }
    }
  }

  public get lerpSource() { return this._lerpSource; }
  public set lerpSource(val) {
    if (this.lerpSource !== val) {
      const texture = coerceTexture(val);
      if (!(texture instanceof PIXI.Texture)) throw new InvalidTextureError();

      this._lerpSource = val;
      if (!texture.valid) {
        texture.baseTexture.once("loaded", () => {
          this.lerpObject.texture = texture;
          this.lerpObject.mask = this.lerpMaskSprite;
          this.updateSprites();
          this.dirty = true;
        })
      } else {
        this.lerpObject.texture = texture;
        this.lerpObject.mask = this.lerpMaskSprite;
        this.updateSprites();
        this.dirty = true;
      }
    }
  }

  public get bgObject() { return this._bgObject; }
  public set bgObject(val) {
    if (this.bgObject !== val) {
      this._bgObject = val;
      this.dirty = true;
      this.updateSprites();
    }
  }

  public get fgObject() { return this._fgObject; }
  public set fgObject(val) {
    if (this.fgObject !== val) {
      this._fgObject = val;
      this.dirty = true;
      this.updateSprites();
    }
  }

  public get lerpObject() { return this._lerpObject; }
  public set lerpObject(val) {
    if (this.lerpObject !== val) {
      this._lerpObject = val;
      this.dirty = true;
      this.updateSprites();
    }
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

  protected orderSpriteObjects(): void {
    if (!(this.bgObject && this.fgObject)) return;


    this.bgObject.zIndex = this.swapLayers ? 10 : 0;
    this.fgObject.zIndex = this.swapLayers ? 0 : 10;
    if (this.lerpObject) this.lerpObject.zIndex = this.fgObject.zIndex - 5;
    if (this.textObject) this.textObject.zIndex = 20;
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

  private _fgPadding = new ObservableBorder(0, 0, 0, 0, () => {
    this.dirty = true;
    this.updateSprites();
  });

  public get fgPadding(): ObservableBorder { return this._fgPadding; }
  public set fgPadding(val: number | Border) {
    if (typeof val === "number") {
      if (this.fgPadding.left !== val) this.fgPadding.left = val;
      if (this.fgPadding.right !== val) this.fgPadding.right = val;
      if (this.fgPadding.top !== val) this.fgPadding.top = val;
      if (this.fgPadding.bottom !== val) this.fgPadding.bottom = val;
    } else {
      if (this.fgPadding.left !== val.left) this.fgPadding.left = val.left;
      if (this.fgPadding.right !== val.right) this.fgPadding.right = val.right;
      if (this.fgPadding.top !== val.top) this.fgPadding.top = val.top;
      if (this.fgPadding.bottom !== val.bottom) this.fgPadding.bottom = val.bottom;
    }
  }

  public destroy() {
    if (!this.destroyed) {
      if (!this.maskSprite.destroyed) {
        this.fgObject.mask = null;
        this.maskSprite.destroy();
      }
      super.destroy();
    }
  }

  protected generateMask(value: number, sprite: PIXI.Sprite, maskCanvas: HTMLCanvasElement, size: { x: number, y: number, width: number, height: number }) {
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) throw new CanvasNotInitializedError();
    maskCanvas.width = size.width;
    maskCanvas.height = size.height;

    sprite.x = size.x;
    sprite.y = size.y;
    sprite.width = size.width;
    sprite.height = size.height;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    const angle = (2 * Math.PI) * (value / this.max);

    ctx.beginPath();
    ctx.moveTo(maskCanvas.width / 2, maskCanvas.height / 2);
    ctx.arc(maskCanvas.width / 2, maskCanvas.height / 2, maskCanvas.width * 2, -(Math.PI / 2), angle - (Math.PI / 2), false);
    ctx.fillStyle = "white";
    ctx.fill();
  }

  protected updateClockMask(value?: number) {
    if (!(this.maskCanvas && this.maskSprite)) return;
    this.generateMask(value ?? this.value, this.maskSprite, this.maskCanvas, { x: this.fgObject.x, y: this.fgObject.y, width: this.fgObject.width, height: this.fgObject.height });

    this.maskSprite.texture.update();
  }

  protected updateLerpMask(value?: number) {
    if (!(this.lerpMaskCanvas && this.maskSprite)) return;
    this.generateMask(value ?? this.value, this.lerpMaskSprite, this.lerpMaskCanvas, { x: this.lerpObject.x, y: this.lerpObject.y, width: this.lerpObject.width, height: this.lerpObject.height });
    this.lerpMaskSprite.texture.update();
  }

  public get fgBlendMode() { return this.fgObject?.blendMode ?? 0 }
  public set fgBlendMode(val) {
    if (this.fgBlendMode !== val && this.fgObject) {
      this.fgObject.blendMode = val;
      this.dirty = true;
    }
  }

  public get bgBlendMode() { return this.bgObject?.blendMode ?? 0; }
  public set bgBlendMode(val) {
    if (this.bgBlendMode !== val && this.bgObject) {
      this.bgObject.blendMode = val;
      this.dirty = true;
    }
  }

  public get lerpBlendMode() { return this.lerpObject?.blendMode ?? 0; }
  public set lerpBlendMode(val) {
    if (this.lerpBlendMode !== val && this.lerpObject) {
      this.lerpObject.blendMode = val;
      this.dirty = true;
    }
  }

  public get fgTint() { return this.fgObject?.tint ?? 16777215 }
  public set fgTint(val) {
    const tintColor = new PIXI.Color(val);
    if (new PIXI.Color(this.fgTint).toNumber() !== tintColor.toNumber() && this.fgObject) {
      this.fgObject.tint = tintColor.toNumber();
      this.dirty = true;
    }
  }

  public get bgTint() { return this.bgObject?.tint ?? 16777215 }
  public set bgTint(val) {
    const tintColor = new PIXI.Color(val);
    if (new PIXI.Color(this.bgTint).toNumber() !== tintColor.toNumber() && this.bgObject) {
      this.bgObject.tint = tintColor.toNumber();
      this.dirty = true;
    }
  }

  public get lerpTint() { return this.lerpObject?.tint ?? 16777215 }
  public set lerpTint(val) {
    const tintColor = new PIXI.Color(val);
    if (new PIXI.Color(this.lerpTint).toNumber() !== tintColor.toNumber() && this.lerpObject) {
      this.lerpObject.tint = tintColor.toNumber();
      this.dirty = true;
    }
  }


  public serialize(): SerializedProgressClockStageObject {
    const serialized = super.serialize();
    return {
      ...serialized,
      bounds: {
        ...serialized.bounds,
        width: this.width / this.actualBounds.width,
        height: this.height / this.actualBounds.height
      },
      type: this.type,
      fgSprite: this.fgSource,
      bgSprite: this.bgSource,
      lerpSprite: this.lerpSource,
      lerpEasing: this.lerpEasing,
      swapLayers: this.swapLayers,

      fgBlendMode: this.fgBlendMode,
      bgBlendMode: this.bgBlendMode,
      lerpBlendMode: this.lerpBlendMode,

      fgTint: new PIXI.Color(this.fgTint).toHex(),
      bgTint: new PIXI.Color(this.bgTint).toHex(),
      lerpTint: new PIXI.Color(this.lerpTint).toHex(),

      textHAlignment: this.textHAlignment,
      textVAlignment: this.textVAlignment,

      fgPadding: {
        left: this.fgPadding.left,
        right: this.fgPadding.right,
        top: this.fgPadding.top,
        bottom: this.fgPadding.bottom
      }
    }
  }

  public deserialize(serialized: SerializedProgressClockStageObject) {
    super.deserialize(serialized);

    if (serialized.fgSprite) this.fgSource = serialized.fgSprite;
    if (serialized.bgSprite) this.bgSource = serialized.bgSprite;
    if (serialized.lerpSprite) this.lerpSource = serialized.lerpSprite;

    if (serialized.fgBlendMode) this.fgBlendMode = serialized.fgBlendMode;
    if (serialized.bgBlendMode) this.bgBlendMode = serialized.bgBlendMode;
    if (serialized.lerpBlendMode) this.lerpBlendMode = serialized.lerpBlendMode;

    if (serialized.fgTint) this.fgTint = new PIXI.Color(serialized.fgTint).toHex();
    if (serialized.bgTint) this.bgTint = new PIXI.Color(serialized.bgTint).toHex();
    if (serialized.lerpTint) this.lerpTint = new PIXI.Color(serialized.lerpTint).toHex();

    if (serialized.lerpEasing) this.lerpEasing = serialized.lerpEasing;

    if (serialized.fgPadding) {
      if (typeof serialized.fgPadding.left === "number") this.fgPadding.left = serialized.fgPadding.left;
      if (typeof serialized.fgPadding.right === "number") this.fgPadding.right = serialized.fgPadding.right;
      if (typeof serialized.fgPadding.top === "number") this.fgPadding.top = serialized.fgPadding.top;
      if (typeof serialized.fgPadding.bottom === "number") this.fgPadding.bottom = serialized.fgPadding.bottom;
    }

    if (serialized.textHAlignment) this.textHAlignment = serialized.textHAlignment;
    if (serialized.textVAlignment) this.textVAlignment = serialized.textVAlignment;
  }

  public static deserialize(serialized: SerializedProgressClockStageObject): ProgressClockStageObject {
    const obj = new ProgressClockStageObject(serialized.value, serialized.max, serialized.fgSprite, serialized.bgSprite, serialized.lerpSprite);
    obj.deserialize(serialized);
    return obj;
  }

  protected updateSprites(overrideValue?: number, ignoreLerp = false): void {

    if (this.fgObject) this.fgObject.x = this.fgPadding.left;
    if (this.fgObject) this.fgObject.y = this.fgPadding.top;
    if (this.fgObject) this.fgObject.width = this.width - this.fgPadding.left - this.fgPadding.right;
    if (this.fgObject) this.fgObject.height = this.height - this.fgPadding.top - this.fgPadding.bottom;

    if (this.lerpObject) this.lerpObject.x = this.fgObject.x;
    if (this.lerpObject) this.lerpObject.y = this.fgObject.y;
    if (this.lerpObject) this.lerpObject.width = this.fgObject.width;
    if (this.lerpObject) this.lerpObject.height = this.fgObject.height;

    this.updateClockMask();
    if (ignoreLerp) this.updateLerpMask(this.value);
    this.orderSpriteObjects();
  }

  public createDragGhost() { return new PIXI.Container(); }

  private _clockUpdateTween: Record<string, unknown> | undefined = undefined;

  protected animateSpriteUpdate(start: number, end: number): Promise<void> {
    if (this._clockUpdateTween && typeof this._clockUpdateTween.kill === "function") this._clockUpdateTween.kill();
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this._clockUpdateTween = gsap.timeline({
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
          this.updateClockMask(val);
        }
      });
      if (typeof this._clockUpdateTween?.add === "function") this._clockUpdateTween.add(firstTween);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const lerpTween = gsap.to({ value: start }, {
        value: end,
        duration: this.secondaryLerpTime / 1000,
        ease: this.lerpEasing,
        onUpdate: () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const val = start + ((end - start) * lerpTween.ratio);
          // const perc = val / this.max;
          this.updateLerpMask(val);
        }
      });

      if (typeof this._clockUpdateTween?.add === "function") this._clockUpdateTween.add(lerpTween, ">");
      if (typeof this._clockUpdateTween?.play === "function") this._clockUpdateTween.play();
    });
  }


  constructor(value: number, max: number, fg: PIXI.TextureSource | PIXI.ColorSource, bg: PIXI.TextureSource | PIXI.ColorSource, lerp: PIXI.TextureSource | PIXI.ColorSource = "transparent") {
    super(value, max);

    this.displayObject.sortableChildren = true;

    this._bgSource = this.coerceSpriteSource(bg) ?? "";
    if (!(this.bgSource)) throw new InvalidTextureError();

    this._fgSource = this.coerceSpriteSource(fg) ?? "";
    if (!(this.fgSource)) throw new InvalidTextureError();

    this._lerpSource = this.coerceSpriteSource(lerp) ?? "";
    if (!(this.lerpSource)) throw new InvalidTextureError();

    this._bgObject = PIXI.Sprite.from(this.bgSource);
    this._fgObject = PIXI.Sprite.from(this.fgSource);
    this._lerpObject = PIXI.Sprite.from(this.lerpSource);

    this.displayObject.addChild(this.bgObject);
    this.displayObject.addChild(this.lerpObject);
    this.displayObject.addChild(this.fgObject);

    this.displayObject.removeChild(this.textObject);
    this.displayObject.addChild(this.textObject);

    this.maskCanvas = document.createElement("canvas");
    this.maskSprite = PIXI.Sprite.from(this.maskCanvas);

    this.fgObject.parent.addChild(this.maskSprite);
    this.fgObject.mask = this.maskSprite;

    this.lerpMaskCanvas = document.createElement("canvas");
    this.lerpMaskSprite = PIXI.Sprite.from(this.lerpMaskCanvas);

    this.lerpObject.parent.addChild(this.lerpMaskSprite);
    this.lerpObject.mask = this.lerpMaskSprite;

    this.updateText();
    this.updateSprites();
  }
}
