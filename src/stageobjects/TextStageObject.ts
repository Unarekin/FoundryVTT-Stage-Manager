import { HTMLText } from "pixi.js";
import { StageObject } from "./StageObject";
import { SerializedTextStageObject } from "../types";

export class TextStageObject extends StageObject<PIXI.HTMLText> {
  public static readonly type: string = "text";
  public readonly type: string = "text";

  public get text() { return postpareText(this.displayObject.text); }
  public set text(val) {
    if (val !== this.text) {
      this.dirty = true;
      this.displayObject.text = prepareText(val);
    }
  }

  /**
 * The distance from the top of the screen to the top edge of this object.
 * 
 * @remarks If {@link StageObject.restrictToVisualArea | restrictToVisualArea} is true, then this is the distance from the top of the visual bounds, instead.
 */
  public get top() { return this.y + this.actualBounds.top - (this.height * this.anchor.y); }
  public set top(val) { this.y = this.actualBounds.top + val + (this.height * this.anchor.y); }

  /**
   * The distance from the left side of the screen to the left-most edge of this object
   * 
   * @remarks If {@link StageObject.restrictToVisualArea | restrictToVisualArea} is true, then this is the distance from the left of the visual bounds, instead.
   */
  public get left() { return this.x - this.actualBounds.left - (this.width * this.anchor.x); }
  public set left(val) { this.x = val + this.actualBounds.left + (this.width * this.anchor.x); }

  /**
   * The distance from the left side of the screen to the right-most edge of this object.
   * 
   * @remarks If {@link StageObject.restrictToVisualArea | restrictToVisualArea} is true, then this is the distance from the left of the visual bounds, instead.
   */
  public get right() { return this.x + this.actualBounds.left + (this.width * (1 - this.anchor.x)); }
  public set right(val) { this.x = val + this.actualBounds.left - (this.width * (1 - this.anchor.x)); }

  /**
   * The distance from the top of the screen to the bottom-most edge of the object.
   * 
   * @remarks If {@link StageObject.restrictToVisualArea | restrictToVisualArea} is true, then this is the distance from the top of the visual bounds, instead.
   */
  public get bottom() { return this.y - this.actualBounds.top + (this.height * (1 - this.anchor.y)); }
  public set bottom(val) { this.y = val + this.actualBounds.top - (this.height * (1 - this.anchor.y)); }

  public get center(): PIXI.Point {
    return new PIXI.Point(
      this.x + (this.width * (.5 - this.anchor.x)),
      this.y + (this.height * (.5 - this.anchor.y))
    );
  }
  public set center(val: PIXI.Point) {
    this.x = val.x + this.actualBounds.left - (this.width * (.5 - this.anchor.x));
    this.y = val.y + this.actualBounds.top - (this.height * (.5 - this.anchor.y));
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
    // if (val !== this.width) {
    //   this.dirty = true;
    //   this.displayObject.width = val;
    // }
  }

  public get height() { return this.displayObject.height; }
  public set height(val) {
    // if (val !== this.height) {
    //   this.dirty = true;
    //   this.displayObject.height = val;
    // }
  }

  public createDragGhost(): HTMLText {
    const style = this.displayObject.style.clone();
    const obj = new PIXI.HTMLText(prepareText(this.text), style);
    obj.alpha = 0.5;
    obj.width = this.width;
    obj.height = this.height;
    obj.anchor.x = this.anchor.x;
    obj.anchor.y = this.anchor.y;
    obj.x = this.x;
    obj.y = this.y;

    return obj;
  }


  public serialize(): SerializedTextStageObject {

    // Generate diffed style
    const style = JSON.parse(JSON.stringify(this.style)) as Record<string, unknown>;
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
      type: TextStageObject.type,
      text: this.text,
      style: diffed,
      anchor: {
        x: this.anchor.x,
        y: this.anchor.y
      }
    }
  }

  public deserialize(serialized: SerializedTextStageObject) {
    super.deserialize(serialized);
    this.text = prepareText(serialized.text ?? "");
    this.style = serialized.style as unknown as PIXI.HTMLTextStyle;
    this.scale.x = this.scale.y = 1;
    if (typeof serialized.anchor !== "undefined") {
      if (typeof serialized.anchor.x !== "undefined") this.anchor.x = serialized.anchor.x;
      if (typeof serialized.anchor.y !== "undefined") this.anchor.y = serialized.anchor.y;
    }
  }

  public static deserialize(serialized: SerializedTextStageObject) {
    const obj = new TextStageObject(serialized.text);
    obj.deserialize(serialized);
    return obj;
  }

  public static prepareText(text: string): string { return prepareText(text); }
  public static postpareText(text: string): string { return postpareText(text); }

  constructor(text: string, style?: PIXI.HTMLTextStyle) {
    const obj = new PIXI.HTMLText(prepareText(text), style);
    super(obj);
    this.resizable = false;
    this.anchor.x = .5
    this.anchor.y = .5
  }
}

function prepareText(text: string): string {
  return text.replaceAll("\n", "<br>");
}

function postpareText(text: string): string {
  return text.replaceAll("<br>", "\n").replaceAll("<br/>", "\n");
}