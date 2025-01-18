import { HTMLText } from "pixi.js";
import { StageObject } from "./StageObject";
import { SerializedTextStageObject } from "../types";

export class TextStageObject extends StageObject<PIXI.HTMLText> {
  public static readonly type: string = "text";
  public readonly type: string = "text";

  public get text() { return this.displayObject.text; }
  public set text(val) {
    if (val !== this.text) {
      this.dirty = true;
      this.displayObject.text = val;
    }
  }

  public get anchor() { return this.displayObject.anchor; }
  public set anchor(anchor) { this.displayObject.anchor = anchor; }

  public get style() { return this.displayObject.style; }
  public set style(val) {
    if (!foundry.utils.objectsEqual(val, this.style)) {
      this.dirty = true;
      this.displayObject.style = val;
    }
  }

  public get width() { return this.displayObject.width; }
  public set width(val) {
    if (val !== this.width) {
      this.dirty = true;
      this.displayObject.width = val;
    }
  }

  public get height() { return this.displayObject.height; }
  public set height(val) {
    if (val !== this.height) {
      this.dirty = true;
      this.displayObject.height = val;
    }
  }

  public createDragGhost(): HTMLText {
    const style = this.displayObject.style.clone();
    const obj = new PIXI.HTMLText(this.text, style);
    obj.alpha = 0.5;
    obj.width = this.width;
    obj.height = this.height;
    obj.anchor.x = this.anchor.x;
    obj.anchor.y = this.anchor.y;
    obj.x = this.x;
    obj.y = this.y;

    return obj;
  }

  public get left() { return this.x + this.actualBounds.left - (this.width * this.anchor.x); }

  public set left(val) {
    if (this.left !== val) {
      this.x = val + this.actualBounds.left + (this.width * this.anchor.x);
      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get right() { return this.actualBounds.right - (this.x + (this.width * this.anchor.x)); }

  public set right(val) {
    if (this.right !== val) {
      // Set relative to right side of screen
      this.displayObject.x = this.actualBounds.right - val - (this.width * this.anchor.x);
      this.dirty = true;

      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get top() { return this.y - this.actualBounds.top - (this.height * this.anchor.y); }

  public set top(val) {
    if (this.top !== val) {
      this.y = val + this.actualBounds.top + (this.height * this.anchor.y);
      this.dirty = true;
      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public get bottom() { return this.actualBounds.bottom - (this.y + (this.height * this.anchor.y)); }

  public set bottom(val) {
    if (this.bottom !== val) {
      this.displayObject.y = this.actualBounds.bottom - val - (this.height * this.anchor.y);
      this.updateScaledDimensions();
      this.updatePinLocations();
    }
  }

  public serialize(): SerializedTextStageObject {
    return {
      ...super.serialize(),
      type: TextStageObject.type,
      text: this.text,
      style: foundry.utils.mergeObject({}, this.style)
    }
  }

  public deserialize(serialized: SerializedTextStageObject) {
    super.deserialize(serialized);
    this.text = serialized.text;
    this.style = serialized.style as unknown as PIXI.HTMLTextStyle;
  }

  public static deserialize(serialized: SerializedTextStageObject) {
    const obj = new TextStageObject(serialized.text);
    obj.deserialize(serialized);
    return obj;
  }


  constructor(text: string, style?: PIXI.HTMLTextStyle) {
    const obj = new PIXI.HTMLText(text, style);
    super(obj);
    this.resizable = true;
    this.anchor.x = .5
    this.anchor.y = .5
  }
}
