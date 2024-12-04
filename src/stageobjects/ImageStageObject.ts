import { SerializedStageObject } from "../types";
import { StageObject } from "./StageObject";

export class ImageStageObject extends StageObject {
  public static type = "image";

  public get displayObject(): PIXI.Sprite { return this._displayObject as PIXI.Sprite; }

  public get width() { return this.displayObject.width; }
  public set width(width) { this.displayObject.width = width; }

  public get height() { return this.displayObject.height; }
  public set height(height) { this.displayObject.height = height; }

  public get anchor() { return this.displayObject.anchor; }
  public set anchor(anchor) { this.displayObject.anchor = anchor; }

  public get texture() { return this.displayObject.texture; }

  public serialize(): Record<string, unknown> {
    return {
      ...super.serialize(),
      image: this.path,
      anchor: { x: this.anchor.x, y: this.anchor.y },
      width: this.width,
      height: this.height
    }
  }


  protected applyJSON(data: Record<string, unknown>): void {
    super.applyJSON(data);
    this.anchor.x = data.anchor?.x as number ?? 0;
    this.anchor.y = data.anchor?.y as number ?? 0;
    this.width = data.width as number ?? this.texture.width;
    this.height = data.height as number ?? this.texture.height;
  }

  public static deserialize(data: SerializedStageObject): ImageStageObject {
    const obj = new ImageStageObject(data.data.image as string, data.data.name as string);
    obj.applyJSON(data.data);

    return obj;
  }

  constructor(private path: string, name?: string) {
    const sprite = PIXI.Sprite.from(path);
    super(sprite, name);
    this.anchor.x = .5;
    this.anchor.y = .5;
  }
}