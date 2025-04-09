import { Easing, ProgressTextMode, SerializedProgressStageObject } from 'types';
import { StageObject } from './StageObject';
import { getStyleDiff } from 'functions';

export abstract class ProgressStageObject extends StageObject<PIXI.Container> {
  public abstract bgObject: PIXI.DisplayObject;
  public abstract fgObject: PIXI.DisplayObject;
  public abstract lerpObject: PIXI.DisplayObject;

  public lerpEasing: Easing = "sine.inOut";
  public primaryLerpTime = 1000;
  public secondaryLerpTime = 500;

  public animateValueChanges = true;

  private _clamp = true;
  public get clamp() { return this._clamp; }
  public set clamp(val) {
    if (this.clamp !== val) {
      this._clamp = val;
      if (val) this.value = Math.min(Math.max(this.value, 0), this.max);
      this.dirty = true;
    }
  }

  public readonly textObject: PIXI.HTMLText = new PIXI.HTMLText();

  private _textMode: ProgressTextMode = "none";
  public get textMode() { return this._textMode; }
  public set textMode(val) {
    if (this.textMode !== val) {
      this._textMode = val;
      this.dirty = true;
      this.updateText();
    }
  }

  public get textStyle() { return this.textObject.style; }

  private _max = 100;
  public get max() { return this._max; }
  public set max(val) {
    if (this.max !== val) {
      this._max = val;
      this.dirty = true;
      this.updateText();
      this.updateSprites();
    }
  }

  private _value = 0;
  public get value() { return this._value; }
  public set value(val) {
    const actualVal = this.clamp ? Math.min(Math.max(val, 0), this.max) : val;
    if (this.value !== actualVal) {
      const oldVal = this.value;
      this._value = val;
      this.dirty = true;
      if (this.animateValueChanges) {
        void this.animateTextUpdate(oldVal, val);
        void this.animateSpriteUpdate(oldVal, val);
      } else {
        this.updateText();
        this.updateSprites();
      }
    }
  }

  /**
   * Updates text based on current value and {@link ProgressTextMode | textMode}
   */
  protected updateText(overrideValue?: number) {
    this.textObject.visible = true;
    this.textObject.anchor.y = 0.5;
    this.textObject.y = this.height / 2;

    switch (this.textMode) {
      case "values":
        this.textObject.text = `${Math.floor(overrideValue ?? this.value)} / ${this.max}`;
        break;
      case "percentage":
        this.textObject.text = `${Math.floor(((overrideValue ?? this.value) / this.max) * 100)}%`
        break;
      default:
        this.textObject.visible = false
    }
  }

  private _textUpdateTween: Record<string, unknown> | undefined = undefined;
  protected animateTextUpdate(start: number, end: number): Promise<void> {
    if (this._textUpdateTween && typeof this._textUpdateTween.kill === "function") this._textUpdateTween.kill();

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this._textUpdateTween = gsap.to({ value: start }, {
        value: end,
        duration: this.primaryLerpTime / 1000,
        ease: this.lerpEasing,
        onComplete: () => {
          // Ensure we are showing final value
          this.updateText();
          resolve();
        },
        onInterrupt: reject,
        onUpdate: () => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          const val = start + ((end - start) * (this._textUpdateTween as any).ratio);
          this.updateText(val);
        }
      })
    });
  }

  /** Handles updating sprite display */
  protected abstract updateSprites(overrideValue?: number): void;

  protected abstract animateSpriteUpdate(start: number, end: number): Promise<void>;

  public serialize(): SerializedProgressStageObject {
    const serialized = super.serialize();
    return {
      ...serialized,
      value: this.value,
      clamp: this.clamp,
      max: this.max,
      animateValueChanges: this.animateValueChanges,
      textMode: this.textMode,
      textStyle: getStyleDiff(this.textStyle),
      lerpEasing: this.lerpEasing,
      primaryLerpTime: this.primaryLerpTime,
      secondaryLerpTime: this.secondaryLerpTime
    }
  }

  public deserialize(serialized: SerializedProgressStageObject) {
    super.deserialize(serialized);

    if (typeof serialized.max === "number") this.max = serialized.max;
    if (typeof serialized.value === "number") this.value = serialized.value;
    if (typeof serialized.textMode === "string") this.textMode = serialized.textMode;
    if (typeof serialized.lerpEasing === "string") this.lerpEasing = serialized.lerpEasing;
    if (typeof serialized.primaryLerpTime === "number") this.primaryLerpTime = serialized.primaryLerpTime;
    if (typeof serialized.secondaryLerpTime === "number") this.secondaryLerpTime = serialized.secondaryLerpTime;

    if (typeof serialized.textStyle === "object")
      foundry.utils.mergeObject(this.textStyle, serialized.textStyle)
  }

  constructor(value?: number, max?: number) {
    const container = new PIXI.Container();
    super(container);

    if (typeof max === "number") this.max = max;
    if (typeof value === "number") this.value = value;

    container.addChild(this.textObject);

    this.resizable = true;

    this.updateText();
    this.updateSprites();
  }
}