import { Easing, ProgressTextMode } from 'types';
import { StageObject } from './StageObject';

export abstract class ProgressStageObject extends StageObject<PIXI.Container> {
  public abstract bgObject: PIXI.DisplayObject;
  public abstract fgObject: PIXI.DisplayObject;
  public abstract lerpObject: PIXI.DisplayObject;

  public lerpEasing: Easing = "sine.inOut";
  public primaryLerpTime = 1000;
  public secondaryLerpTime = 500;

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
    if (this.value !== val) {
      this._value = val;
      this.dirty = true;
      this.updateText();
      this.updateSprites();
    }
  }

  /**
   * Updates text based on current value and {@link ProgressTextMode | textMode}
   */
  protected updateText() {
    switch (this.textMode) {
      case "values":
        this.textObject.text = `${this.value} / ${this.max}`;
        break;
      case "percentage":
        this.textObject.text = `${Math.floor((this.value / this.max) * 100)}%`
        break;
      default:
        this.textObject.visible = false
    }
  }

  /** Handles updating sprite display */
  protected abstract updateSprites(): void;


  constructor(value?: number, max?: number) {
    const container = new PIXI.Container();
    super(container);

    if (typeof max === "number") this.max = max;
    if (typeof value === "number") this.value = value;

    container.addChild(this.textObject);

    this.updateText();
    this.updateSprites();
  }
}