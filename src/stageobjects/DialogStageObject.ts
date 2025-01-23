import { diff } from "../lib/deepDiff";
import { log } from "../logging";
import { SerializedDialogStageObject } from "../types";
import { PanelStageObject } from "./PanelStageObject";

export class DialogStageObject extends PanelStageObject {
  public static type = "dialog";
  public type = "dialog";

  #textObj: PIXI.HTMLText;
  #portrait: PIXI.Sprite | null = null;
  #showPortrait = false;
  #portraitSrc = "";

  public get portraitObj() { return this.#portrait; }

  public get portrait() { return this.#portraitSrc; }
  public set portrait(val) {
    if (this.portrait !== val) {
      this.dirty = true;
      this.#portraitSrc = val;
      this.setPortrait(val);
    }
  }

  public get showPortrait() { return this.#showPortrait; }
  public set showPortrait(val) {
    if (val !== this.showPortrait) {
      this.dirty = true;
      this.#showPortrait = true;
      if (this.#portrait instanceof PIXI.Sprite) this.#portrait.renderable = val;
      this.sizeTextObject();
    }
  }

  protected setPortrait(url: string) {
    if (this.#portrait) this.#portrait.destroy();
    const sprite = PIXI.Sprite.from(url);
    sprite.width = 128;
    sprite.height = 128;
    this.displayObject.addChild(sprite);
    sprite.x = this.borders.left;
    sprite.y = this.borders.top;
    this.#portrait = sprite;
    this.showPortrait = true;
    if (!sprite.texture.valid) {
      sprite.texture.baseTexture.once("loaded", () => { this.sizeTextObject(); });
    } else {
      this.sizeTextObject();
    }
  }

  public get width() { return super.width; }
  public set width(val) {
    super.width = val;
    this.sizeTextObject();
  }

  protected sizeTextObject() {
    this.#textObj.style.wordWrap = true;
    this.#textObj.style.wordWrapWidth = this.width - this.borders.left - this.borders.right - (this.showPortrait && this.#portrait ? this.#portrait.width : 0);
    this.#textObj.style.whiteSpace = "normal";
    this.#textObj.x = this.borders.left + (this.showPortrait && this.#portrait ? this.#portrait.width : 0);
    this.#textObj.y = this.borders.top;
  }

  public get style() { return this.#textObj.style; }

  public get text() { return this.#textObj.text; }
  public set text(val) {
    if (val !== this.text) {
      this.dirty = true;
      this.#textObj.text = val;
    }
  }

  public get anchor() { return this.#textObj.anchor; }
  public set anchor(anchor) { this.#textObj.anchor = anchor; }

  public serialize(): SerializedDialogStageObject {

    // Generate diffed style
    const style = JSON.parse(JSON.stringify(this.style)) as Record<string, unknown>;
    for (const key in style) {
      if (key.startsWith("_")) {
        style[key.substring(1)] = style[key];
        delete style[key];
      }
    }

    const diffed = diff(JSON.parse(JSON.stringify(PIXI.HTMLTextStyle.defaultStyle)) as Record<string, unknown>, style);
    for (const key in diffed) {
      if (typeof diffed[key] === "undefined")
        delete diffed[key]
    }

    return {
      ...super.serialize(),
      type: DialogStageObject.type,
      text: this.text,
      style: diffed,
      portrait: this.portrait,
      showPortrait: this.showPortrait
    }
  }

  public createDragGhost(): PIXI.NineSlicePlane {
    const ghost = super.createDragGhost();
    const text = new PIXI.HTMLText(this.text, this.#textObj.style.clone());
    text.width = this.#textObj.width;
    text.height = this.#textObj.height;
    text.x = this.#textObj.x;
    text.y = this.#textObj.y;
    text.style.wordWrap = true;
    text.style.wordWrapWidth = this.#textObj.style.wordWrapWidth;
    text.style.whiteSpace = "normal";

    return ghost;
  }

  public static deserialize(serialized: SerializedDialogStageObject): DialogStageObject {
    const obj = new DialogStageObject(serialized.text, serialized.src, serialized.borders.left, serialized.borders.right, serialized.borders.top, serialized.borders.bottom, serialized.style as unknown as PIXI.HTMLTextStyle);
    obj.deserialize(serialized);
    return obj;
  }

  public deserialize(serialized: SerializedDialogStageObject) {
    log("Deserializing:", serialized);
    super.deserialize(serialized);
    this.text = serialized.text;
    this.#textObj.style = serialized.style as unknown as PIXI.HTMLTextStyle;
    log("Deserialized:", this.serialize())
  }

  constructor(text: string, background: string, vertical: number, horizontal: number, style?: PIXI.HTMLTextStyle)
  constructor(text: string, background: string, left: number, right: number, top: number, bottom: number, style?: PIXI.HTMLTextStyle)
  constructor(text: string, background: string, ...args: (number | PIXI.HTMLTextStyle)[]) {
    const left = args[0] as number;
    const right = (args.length >= 4 ? args[1] : args[0]) as number;
    const top = (args.length >= 4 ? args[2] : args[1]) as number;
    const bottom = (args.length >= 4 ? args[3] : args[1]) as number;
    const style = typeof args[args.length - 1] === "number" ? PIXI.HTMLTextStyle.defaultStyle : args[args.length - 1] as PIXI.HTMLTextStyle;

    super(background, left, right, top, bottom);

    this.#textObj = new PIXI.HTMLText(text, style);
    this.displayObject.addChild(this.#textObj);

    if (!this.displayObject.texture.valid) {
      this.displayObject.texture.baseTexture.once("loaded", () => {
        this.sizeTextObject();
      })
    } else {
      this.sizeTextObject();
    }

  }

}