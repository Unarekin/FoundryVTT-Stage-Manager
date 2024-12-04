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

  public serialize(): SerializedStageObject {
    const serialized = super.serialize();

    return {
      ...serialized,
      type: "image",
      data: {
        ...serialized.data,
        image: this.path,
        anchor: { x: this.anchor.x, y: this.anchor.y },
        width: this.width,
        height: this.height
      }
    }

  }

  public deserialize(serialized: SerializedStageObject) {
    super.deserialize(serialized);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.anchor.x = (serialized.data.anchor as any)?.x as number ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.anchor.y = (serialized.data.anchor as any)?.y as number ?? 0;
    this.width = serialized.data.width as number ?? this.texture.width;
    this.height = serialized.data.height as number ?? this.texture.height;
  }

  public static deserialize(data: SerializedStageObject): ImageStageObject {
    const obj = new ImageStageObject(data.data.image as string, data.data.name as string);
    obj.deserialize(data);

    return obj;
  }

  constructor(private path: string, name?: string) {
    const sprite = PIXI.Sprite.from(path);
    super(sprite, name);
    this.anchor.x = .5;
    this.anchor.y = .5;
  }
}