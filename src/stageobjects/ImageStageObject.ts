import { StageObject } from "./StageObject";

export class ImageStageObject extends StageObject {
  public get displayObject(): PIXI.Sprite { return this._displayObject as PIXI.Sprite; }

  public get width() { return this.displayObject.width; }
  public set width(width) { this.displayObject.width = width; }

  public get anchor() { return this.displayObject.anchor; }
  public set anchor(anchor) { this.displayObject.anchor = anchor; }

  public get texture() { return this.displayObject.texture; }

  constructor(path: string, name?: string) {
    const sprite = PIXI.Sprite.from(path);
    if (sprite) super(sprite, name);
  }
}