import { serializeStyle } from "functions";
import { StageObject } from "./StageObject";
import { SerializedStageObject, SerializedTextStageObject, StageObjectType } from "types";
import { HOOKS } from "hooks";
import { StageManager } from "StageManager";

Hooks.on(HOOKS.INITIALIZED, (stageManager: StageManager) => { stageManager.registerStageObject("text", TextStageObject as typeof StageObject); })

export class TextStageObject extends StageObject<PIXI.HTMLText, SerializedStageObject> {
  protected type: StageObjectType = "text";

  public get text() { return this.object.text; }
  public set text(val) {
    if (this.text === val) return;
    this.object.text = val;
    this.dirty = true;
  }

  public get style() { return this.object.style; }
  public set style(val) {
    this.object.style = val;

  }

  #anchor = new PIXI.ObservablePoint(function () { this.dirty = true; }, this);

  public get anchor() { return this.#anchor; }
  public set anchor(val: PIXI.ObservablePoint | { x: number, y: number }) {
    if (this.anchor.x === val.x && this.anchor.y === val.y) return;

    this.anchor.x = val.x;
    this.anchor.y = val.y;
  }

  public serialize(): SerializedTextStageObject {
    return {
      ...super.serialize(),
      text: this.text,
      style: serializeStyle(this.style),
      anchor: {
        x: this.anchor.x,
        y: this.anchor.y
      }
    }
  }

  public static deserialize(serialized: SerializedStageObject, dirty?: boolean): TextStageObject {
    const obj = new TextStageObject();
    return obj.deserialize(serialized as SerializedTextStageObject, dirty)
  }

  public deserialize(serialized: SerializedTextStageObject, dirty?: boolean): this {
    super.deserialize(serialized, dirty);

    if (typeof serialized.text === "string") this.text = serialized.text;
    if (typeof serialized.style === "object") foundry.utils.mergeObject(this.style, serialized.style);
    if (typeof serialized.anchor === "object") {
      this.anchor.x = serialized.anchor.x;
      this.anchor.y = serialized.anchor.y;
    }


    return this;
  }

  protected createObject(): PIXI.HTMLText {
    const text = new PIXI.HTMLText();
    text.anchor.x = text.anchor.y = 0.5;
    return text;
  }
}